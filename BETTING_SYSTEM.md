# 내기 시스템 (Betting System)

## 개요

레이팅 매치에서 플레이어들이 포인트나 깃털을 걸고 내기를 할 수 있는 시스템입니다. 승자 팀이 모든 베팅금을 균등하게 나눠가집니다.

## 주요 기능

### 1. 베팅 통화
- **포인트 (POINTS)**: 게임 내 기본 통화
- **깃털 (FEATHERS)**: 프리미엄 통화
- **없음 (NONE)**: 베팅하지 않음 (기본값)

### 2. 승자 독식 방식
- 각 플레이어가 동일한 금액을 베팅
- 총 베팅 풀 = 플레이어당 베팅 금액 × 총 플레이어 수
- 승자 팀의 각 플레이어가 베팅 풀을 균등하게 분배받음

**예시:**
```
매치 타입: MD (복식)
플레이어당 베팅: 100 포인트
총 베팅 풀: 100 × 4 = 400 포인트
승자 1인당 획득: 400 ÷ 2 = 200 포인트
```

## 데이터베이스 구조

### match_sessions 테이블
```sql
ALTER TABLE match_sessions
ADD COLUMN IF NOT EXISTS bet_currency_type TEXT DEFAULT 'NONE'
  CHECK (bet_currency_type IN ('NONE', 'POINTS', 'FEATHERS')),
ADD COLUMN IF NOT EXISTS bet_amount_per_player INTEGER DEFAULT 0;
```

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `bet_currency_type` | TEXT | 베팅 통화 ('NONE', 'POINTS', 'FEATHERS') |
| `bet_amount_per_player` | INTEGER | 플레이어당 베팅 금액 |

### match_participants 테이블
```sql
ALTER TABLE match_participants
ADD COLUMN IF NOT EXISTS bet_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bet_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bet_currency_type TEXT DEFAULT 'NONE'
  CHECK (bet_currency_type IN ('NONE', 'POINTS', 'FEATHERS'));
```

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `bet_paid` | BOOLEAN | 베팅금 지불 여부 |
| `bet_amount` | INTEGER | 실제 베팅 금액 |
| `bet_currency_type` | TEXT | 베팅 통화 종류 |

## 베팅 플로우

### 1. 매치 생성 (UI)

**파일**: [app/matches/create/page.tsx](app/matches/create/page.tsx)

```typescript
// 베팅 상태
const [enableBetting, setEnableBetting] = useState(false);
const [betCurrencyType, setBetCurrencyType] = useState<'points' | 'feathers'>('points');
const [betAmount, setBetAmount] = useState(100);

// API 호출
const response = await fetch('/api/matches/sessions', {
  method: 'POST',
  body: JSON.stringify({
    // ... 기존 필드들
    betCurrencyType: enableBetting ? betCurrencyType.toUpperCase() : 'NONE',
    betAmountPerPlayer: enableBetting ? betAmount : 0
  })
});
```

**UI 구성**:
- 토글 스위치: 내기 모드 활성화/비활성화
- 라디오 버튼: 통화 선택 (포인트/깃털)
- 입력 필드: 베팅 금액
- 정보 박스: 총 베팅 풀 및 승자 1인당 획득 금액 표시

### 2. 매치 생성 (API)

**파일**: [app/api/matches/sessions/route.ts](app/api/matches/sessions/route.ts)

```typescript
export async function POST(request: NextRequest) {
  const {
    betCurrencyType = 'NONE',
    betAmountPerPlayer = 0
  } = await request.json();

  // 베팅 파라미터 검증
  if (!['NONE', 'POINTS', 'FEATHERS'].includes(betCurrencyType)) {
    return NextResponse.json(
      { error: 'Invalid bet currency type' },
      { status: 400 }
    );
  }

  if (betCurrencyType !== 'NONE' && betAmountPerPlayer <= 0) {
    return NextResponse.json(
      { error: 'Bet amount must be greater than 0 when betting is enabled' },
      { status: 400 }
    );
  }

  // 매치 세션 생성 (베팅 정보 포함)
  const { data: session } = await supabase
    .from('match_sessions')
    .insert({
      // ... 기존 필드들
      bet_currency_type: betCurrencyType,
      bet_amount_per_player: betAmountPerPlayer
    })
    .select()
    .single();

  // 참가자 추가 (베팅 정보 포함)
  const participantRecords = participants.map((p: any) => ({
    match_session_id: session.id,
    user_id: p.userId,
    team: p.team,
    bet_paid: false,
    bet_amount: betCurrencyType !== 'NONE' ? betAmountPerPlayer : 0,
    bet_currency_type: betCurrencyType
  }));
}
```

### 3. 베팅금 지불

**함수**: `pay_match_bet(p_match_session_id TEXT, p_user_id UUID)`

**위치**: [supabase/migrations/20251109000003_add_betting_system.sql](supabase/migrations/20251109000003_add_betting_system.sql)

**동작**:
1. 매치 세션 및 참가자 정보 조회
2. 베팅금 지불 여부 확인 (이미 지불했으면 에러)
3. 사용자 잔액 확인
4. 베팅금 차감 (포인트 또는 깃털)
5. 트랜잭션 기록
6. `bet_paid` 플래그 업데이트

```sql
CREATE OR REPLACE FUNCTION pay_match_bet(
  p_match_session_id TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_participant RECORD;
  v_user_balance INTEGER;
BEGIN
  -- 매치 세션 정보 조회
  SELECT * INTO v_session FROM match_sessions WHERE id = p_match_session_id;

  -- 참가자 정보 조회
  SELECT * INTO v_participant
  FROM match_participants
  WHERE match_session_id = p_match_session_id AND user_id = p_user_id;

  -- 이미 지불했는지 확인
  IF v_participant.bet_paid THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bet already paid'
    );
  END IF;

  -- 잔액 확인 및 차감
  IF v_session.bet_currency_type = 'POINTS' THEN
    SELECT points INTO v_user_balance FROM users WHERE id = p_user_id;

    IF v_user_balance < v_participant.bet_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient points'
      );
    END IF;

    UPDATE users SET points = points - v_participant.bet_amount WHERE id = p_user_id;

    -- 트랜잭션 기록
    INSERT INTO transactions (user_id, type, points_change, description)
    VALUES (p_user_id, 'BET_PAYMENT', -v_participant.bet_amount,
            'Bet payment for match ' || p_match_session_id);

  ELSIF v_session.bet_currency_type = 'FEATHERS' THEN
    SELECT feathers INTO v_user_balance FROM users WHERE id = p_user_id;

    IF v_user_balance < v_participant.bet_amount THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Insufficient feathers'
      );
    END IF;

    UPDATE users SET feathers = feathers - v_participant.bet_amount WHERE id = p_user_id;

    -- 트랜잭션 기록
    INSERT INTO transactions (user_id, type, feathers_change, description)
    VALUES (p_user_id, 'BET_PAYMENT', -v_participant.bet_amount,
            'Bet payment for match ' || p_match_session_id);
  END IF;

  -- bet_paid 플래그 업데이트
  UPDATE match_participants
  SET bet_paid = true
  WHERE match_session_id = p_match_session_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'amount_paid', v_participant.bet_amount,
    'currency_type', v_session.bet_currency_type
  );
END;
$$ LANGUAGE plpgsql;
```

### 4. 베팅금 분배 (매치 완료 시)

**함수**: `complete_match_session(p_match_session_id TEXT)`

**위치**: [supabase/migrations/20251109000003_add_betting_system.sql](supabase/migrations/20251109000003_add_betting_system.sql)

**동작**:
1. 매치 결과 기록 및 레이팅 업데이트 (기존 로직)
2. 총 베팅 풀 계산 (`bet_paid = true`인 참가자들의 베팅금 합계)
3. 승자 1인당 베팅 상금 계산 (`총 베팅 풀 ÷ 승자 수`)
4. 각 승자에게 베팅 상금 지급
5. 트랜잭션 기록 (`BET_WINNINGS`)

```sql
-- 총 베팅 풀 계산
SELECT COALESCE(SUM(bet_amount), 0) INTO v_total_bet_pool
FROM match_participants
WHERE match_session_id = p_match_session_id AND bet_paid = true;

-- 승자 1인당 베팅 상금 계산
IF v_winner_count > 0 AND v_total_bet_pool > 0 THEN
  v_bet_winnings_per_winner := v_total_bet_pool / v_winner_count;
ELSE
  v_bet_winnings_per_winner := 0;
END IF;

-- 베팅 상금 분배 (승자에게만)
FOR v_participant IN
  SELECT * FROM match_participants
  WHERE match_session_id = p_match_session_id
LOOP
  -- ... 기존 레이팅 업데이트 로직 ...

  -- 승자에게 베팅 상금 지급
  IF v_is_winner AND v_bet_winnings_per_winner > 0 THEN
    IF v_session.bet_currency_type = 'POINTS' THEN
      UPDATE users
      SET points = points + v_bet_winnings_per_winner
      WHERE id = v_participant.user_id;

      INSERT INTO transactions (user_id, type, points_change, description)
      VALUES (v_participant.user_id, 'BET_WINNINGS', v_bet_winnings_per_winner,
              'Bet winnings from match ' || p_match_session_id);

    ELSIF v_session.bet_currency_type = 'FEATHERS' THEN
      UPDATE users
      SET feathers = feathers + v_bet_winnings_per_winner
      WHERE id = v_participant.user_id;

      INSERT INTO transactions (user_id, type, feathers_change, description)
      VALUES (v_participant.user_id, 'BET_WINNINGS', v_bet_winnings_per_winner,
              'Bet winnings from match ' || p_match_session_id);
    END IF;
  END IF;
END LOOP;
```

## 트랜잭션 타입

베팅 시스템에서 사용하는 새로운 트랜잭션 타입:

| 타입 | 설명 | 시점 |
|------|------|------|
| `BET_PAYMENT` | 베팅금 지불 | 매치 참가 시 |
| `BET_WINNINGS` | 베팅 상금 획득 | 매치 완료 시 (승자) |

## 승자 보상 구조

매치 완료 시 승자가 받는 보상:

1. **기본 승자 포인트**: `match_sessions.winner_points` (기본 100 포인트)
2. **베팅 상금**: 총 베팅 풀 ÷ 승자 수

**예시:**
```
매치 타입: XD (혼합 복식)
참가자: 4명 (각 100 포인트 베팅)
총 베팅 풀: 400 포인트
승자: Team A (2명)

Team A 각 플레이어 획득:
- 기본 승자 포인트: 100 포인트
- 베팅 상금: 400 ÷ 2 = 200 포인트
- 총 획득: 300 포인트

Team B 각 플레이어 손실:
- 베팅 손실: -100 포인트
```

## UI/UX 디자인

### 색상 테마
- **노란색 테마**: 베팅 섹션을 참가비와 구분하기 위해 노란색 강조
  - 테두리: `border-yellow-200`
  - 토글 스위치 활성화: `bg-yellow-500`
  - 정보 박스: `bg-yellow-50`
  - 텍스트: `text-yellow-800`

### 정보 표시
- **총 베팅 풀**: 실시간 계산 및 표시
- **승자 1인당 획득**: 실시간 계산 및 표시
- **🎲 이모지**: 내기 모드임을 시각적으로 표현

## 보안 및 검증

### API 레벨 검증
1. **통화 타입 검증**: 'NONE', 'POINTS', 'FEATHERS'만 허용
2. **금액 검증**: 베팅 활성화 시 금액 > 0
3. **참가자 수 검증**: 매치 타입에 맞는 참가자 수
4. **성별 검증**: 성별 제한 매치 타입 (MS, WS, MD, WD)

### 데이터베이스 레벨 검증
1. **잔액 확인**: 베팅금 지불 전 충분한 잔액 확인
2. **중복 지불 방지**: `bet_paid` 플래그로 중복 지불 차단
3. **트랜잭션 무결성**: 모든 포인트/깃털 변경 기록

## 테스트 시나리오

### 1. 정상적인 베팅 플로우
```
1. 매치 생성: 베팅 100 포인트 활성화
2. 플레이어 초대 및 수락
3. 각 플레이어 베팅금 지불 (100 포인트 차감)
4. 매치 진행 및 완료
5. 승자 각 200 포인트 획득 (100 승자 포인트 + 200 베팅 상금)
```

### 2. 잔액 부족 시나리오
```
1. 매치 생성: 베팅 500 포인트 활성화
2. 잔액 300 포인트인 플레이어 초대 수락
3. 베팅금 지불 시도 → "Insufficient points" 에러
4. 매치 참가 불가
```

### 3. 일부만 베팅한 시나리오
```
1. 매치 생성: 베팅 100 포인트 활성화
2. 4명 중 3명만 베팅금 지불
3. 매치 완료 시 총 베팅 풀: 300 포인트 (3명만 계산)
4. 승자 1인당: 300 ÷ 2 = 150 포인트
```

## 향후 개선 사항

### 1. UI 개선
- [ ] 매치 상세 페이지에 베팅 정보 표시
- [ ] 참가자별 베팅금 지불 상태 표시
- [ ] 매치 기록에 베팅 상금 표시
- [ ] 베팅 통계 (총 베팅 금액, 승률 등)

### 2. 기능 추가
- [ ] 베팅 히스토리 페이지
- [ ] 베팅 순위 (가장 많이 베팅한 유저)
- [ ] 베팅 추천 시스템 (레이팅 차이 기반)
- [ ] 베팅 제한 (최소/최대 금액)

### 3. 알림
- [ ] 베팅금 지불 요청 알림
- [ ] 베팅 상금 획득 알림
- [ ] 잔액 부족 경고

### 4. 관리자 기능
- [ ] 베팅 통계 대시보드
- [ ] 베팅 제한 설정
- [ ] 이상 베팅 감지 및 차단

## 관련 파일

### 프론트엔드
- [app/matches/create/page.tsx](app/matches/create/page.tsx) - 매치 생성 UI

### 백엔드 API
- [app/api/matches/sessions/route.ts](app/api/matches/sessions/route.ts) - 매치 세션 생성 API

### 데이터베이스
- [supabase/migrations/20251109000003_add_betting_system.sql](supabase/migrations/20251109000003_add_betting_system.sql) - 베팅 시스템 마이그레이션

## 참고 문서
- [ACCESSIBILITY_IMPROVEMENTS.md](ACCESSIBILITY_IMPROVEMENTS.md) - 레이팅 시스템 접근성 개선
- [MATCH_HISTORY.md](MATCH_HISTORY.md) - 매치 기록 시스템

## 문의 및 버그 신고

베팅 시스템 관련 문의나 버그는 GitHub Issues를 통해 신고해주세요.
