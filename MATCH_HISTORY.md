# 매치 기록 시스템 가이드

## 개요

사용자의 모든 매치 내역을 확인할 수 있는 매치 기록 시스템이 구현되었습니다. 프로필 페이지와 레이팅 리더보드에서 쉽게 접근할 수 있습니다.

## 주요 기능

### 1. 매치 기록 페이지

경로: `/matches/history/[userId]`

#### 표시되는 정보
- **통계 요약**
  - 총 경기 수
  - 완료된 경기 수
  - 승리/패배 수
  - 총 레이팅 변화
  - 획득한 총 포인트

- **경기 목록**
  - 경기 종목 (MS, WS, MD, WD, XD)
  - 승패 결과
  - 점수 (완료된 경기)
  - 레이팅 변화
  - 팀원 및 상대 정보
  - 획득 포인트
  - 경기 일시 및 장소

### 2. 필터링 기능

#### 경기 종목 필터
- 전체
- 남자 단식 (MS)
- 여자 단식 (WS)
- 남자 복식 (MD)
- 여자 복식 (WD)
- 혼합 복식 (XD)

#### 상태 필터
- 전체
- 완료 (COMPLETED)
- 대기중 (PENDING)
- 취소됨 (CANCELLED)

### 3. 접근 경로

#### 프로필 페이지에서
- 프로필 → 승률 섹션 → "매치 기록" 버튼 클릭
- 경로: `/profile` → `/matches/history/[userId]`

#### 레이팅 리더보드에서
- 레이팅 페이지 → 플레이어 행 클릭
- 경로: `/ratings` → `/matches/history/[userId]`

#### 직접 접근
- URL: `/matches/history/[userId]`

## API 엔드포인트

### `GET /api/users/[userId]/matches`

사용자의 매치 기록 조회

#### Query Parameters

| 파라미터 | 타입 | 설명 | 기본값 |
|---------|------|------|--------|
| `matchType` | string | 경기 종목 필터 (MS, WS, MD, WD, XD) | - |
| `status` | string | 상태 필터 (PENDING, COMPLETED, CANCELLED) | - |
| `limit` | number | 반환할 최대 개수 | 20 |
| `offset` | number | 시작 위치 | 0 |

#### Response

```json
{
  "matches": [
    {
      "id": "match-session-id",
      "matchType": "MS",
      "status": "COMPLETED",
      "result": "PLAYER1_WIN",
      "team": 1,
      "isWinner": true,
      "score": {
        "team1": 21,
        "team2": 18,
        "userTeam": 21,
        "opponentTeam": 18
      },
      "rating": {
        "before": 1500,
        "after": 1525,
        "change": 25
      },
      "entryFee": {
        "points": 100,
        "feathers": 0
      },
      "pointsEarned": 150,
      "location": "서울 체육관",
      "sessionDate": "2025-01-08T10:00:00Z",
      "completedAt": "2025-01-08T11:30:00Z",
      "teammates": [],
      "opponents": [
        {
          "id": "opponent-id",
          "name": "홍길동",
          "nickname": "배드킹",
          "profileImage": "...",
          "ratingBefore": 1450,
          "ratingAfter": 1425,
          "ratingChange": -25
        }
      ]
    }
  ],
  "stats": {
    "totalMatches": 25,
    "completed": 20,
    "wins": 14,
    "losses": 6,
    "totalRatingGained": 250,
    "totalPointsEarned": 2100
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## 매치 카드 UI

각 매치는 카드 형태로 표시됩니다:

### 카드 색상 코딩

- **왼쪽 테두리 색상**
  - 🟢 녹색: 승리 (완료된 경기)
  - 🔴 빨간색: 패배 (완료된 경기)
  - 🔵 파란색: 대기중
  - ⚪ 회색: 취소됨

### 표시 정보

#### 헤더
- 경기 종목 배지
- 승패 배지 (완료된 경기)
- 상태 배지 (대기중/취소됨)

#### 참가자
- **팀원**: 복식 경기의 경우 표시
- **상대**: 모든 상대 플레이어 표시
- 각 플레이어의 레이팅 변화 표시

#### 경기 결과 (완료된 경기)
- **점수**: 사용자 팀 vs 상대 팀
- **레이팅 변화**: 이전 → 변화량 → 이후
- **획득 포인트**: 승리 시 획득한 포인트

#### 하단
- 경기 일시
- 경기 장소

#### 오른쪽
- 경기 후 티어 아이콘 및 이름

## 통계 카드

페이지 상단에 6개의 통계 카드 표시:

1. **총 경기**: 모든 경기 수 (대기중 포함)
2. **완료**: 완료된 경기 수
3. **승리**: 승리한 경기 수 (녹색)
4. **패배**: 패배한 경기 수 (빨간색)
5. **레이팅 변화**: 누적 레이팅 변화 (양수/음수)
6. **획득 포인트**: 누적 획득 포인트 (보라색)

## 상호작용

### 클릭 동작
- 매치 카드 클릭 → 매치 세션 상세 페이지로 이동
- 경로: `/matches/history/[userId]` → `/matches/[sessionId]`

### 필터 변경
- 경기 종목 버튼 클릭 → 즉시 필터 적용
- 상태 드롭다운 변경 → 즉시 필터 적용
- 필터 변경 시 자동으로 API 재호출

## 데이터 처리

### 승패 판단

#### 단식 (MS, WS)
```typescript
isWinner = (result === 'PLAYER1_WIN' && userTeam === 1) ||
           (result === 'PLAYER2_WIN' && userTeam === 2)
```

#### 복식 (MD, WD, XD)
```typescript
isWinner = (result === 'TEAM1_WIN' && userTeam === 1) ||
           (result === 'TEAM2_WIN' && userTeam === 2)
```

### 팀원 및 상대 분리

```typescript
teammates = participants.filter(p => p.team === userTeam && p.userId !== userId)
opponents = participants.filter(p => p.team !== userTeam)
```

### 통계 계산

```typescript
stats = {
  totalMatches: matches.length,
  completed: matches.filter(m => m.status === 'COMPLETED').length,
  wins: matches.filter(m => m.isWinner && m.status === 'COMPLETED').length,
  losses: matches.filter(m => !m.isWinner && m.status === 'COMPLETED').length,
  totalRatingGained: matches.reduce((sum, m) => sum + (m.rating.change || 0), 0),
  totalPointsEarned: matches.reduce((sum, m) => sum + (m.pointsEarned || 0), 0)
}
```

## TypeScript 타입

```typescript
// 매치 기록 항목
export interface MatchHistoryEntry {
  id: string;
  matchType: MatchType;
  status: MatchSessionStatus;
  result: MatchResult | null;
  team: 1 | 2;
  isWinner: boolean;
  score: {
    team1: number | null;
    team2: number | null;
    userTeam: number | null;
    opponentTeam: number | null;
  };
  rating: {
    before: number | null;
    after: number | null;
    change: number | null;
  };
  entryFee: {
    points: number;
    feathers: number;
  };
  pointsEarned: number;
  location: string | null;
  sessionDate: string;
  completedAt: string | null;
  teammates: Array<PlayerInfo>;
  opponents: Array<PlayerInfo>;
}

// 매치 통계
export interface MatchHistoryStats {
  totalMatches: number;
  completed: number;
  wins: number;
  losses: number;
  totalRatingGained: number;
  totalPointsEarned: number;
}

// API 응답
export interface MatchHistoryResponse {
  matches: MatchHistoryEntry[];
  stats: MatchHistoryStats;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}
```

## 날짜 포맷

```typescript
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 출력: "2025년 1월 8일 오전 10:00"
```

## 사용 예시

### 예시 1: 자신의 매치 기록 보기

```
1. 프로필 페이지 접속
2. "매치 기록" 버튼 클릭
3. 모든 매치 내역 확인
4. 필터로 특정 종목만 보기
```

### 예시 2: 다른 사용자 매치 기록 보기

```
1. 레이팅 페이지 접속
2. 리더보드에서 플레이어 클릭
3. 해당 사용자의 매치 기록 확인
4. 플레이어의 실력 추이 분석
```

### 예시 3: 최근 경기 분석

```
1. 매치 기록 페이지 접속
2. "완료" 필터 선택
3. 최근 경기들의 레이팅 변화 확인
4. 승률이 높은 종목 파악
```

## 성능 최적화

### 페이지네이션
- 기본 20개씩 로드
- 스크롤 시 추가 로드 가능
- `hasMore` 플래그로 더 보기 버튼 표시

### 인덱스
```sql
-- match_participants 테이블
CREATE INDEX idx_match_participants_user ON match_participants(user_id);
CREATE INDEX idx_match_participants_created ON match_participants(created_at DESC);

-- match_sessions 테이블
CREATE INDEX idx_match_sessions_type ON match_sessions(match_type);
CREATE INDEX idx_match_sessions_status ON match_sessions(status);
CREATE INDEX idx_match_sessions_date ON match_sessions(session_date DESC);
```

### 쿼리 최적화
- `.select()` 에서 필요한 필드만 조회
- `inner join` 으로 관련 데이터 한 번에 가져오기
- `order by created_at desc` 로 최신 순 정렬
- `range()` 로 페이지네이션 구현

## 모바일 대응

- 반응형 그리드 레이아웃
- 카드 스와이프로 상세 정보 확인
- 터치 친화적인 버튼 크기
- 작은 화면에서도 가독성 유지

## 향후 개선 사항

1. **상세 통계**
   - 종목별 승률 그래프
   - 시간대별 레이팅 변화 차트
   - 상대전적 분석

2. **필터 확장**
   - 날짜 범위 필터
   - 상대 플레이어 필터
   - 장소 필터

3. **공유 기능**
   - 매치 결과 SNS 공유
   - 통계 이미지 생성

4. **비교 기능**
   - 다른 플레이어와 비교
   - 평균 대비 내 위치

5. **추천 시스템**
   - 비슷한 레벨 매치 추천
   - 개선점 제안

## 테스트

### API 테스트
```bash
# 매치 기록 조회
curl http://localhost:3000/api/users/USER_ID/matches?limit=10

# 필터링 테스트
curl http://localhost:3000/api/users/USER_ID/matches?matchType=MS&status=COMPLETED

# 페이지네이션 테스트
curl http://localhost:3000/api/users/USER_ID/matches?limit=10&offset=10
```

### UI 테스트
1. 다양한 화면 크기에서 레이아웃 확인
2. 필터 변경 시 올바른 데이터 로드 확인
3. 클릭 동작 확인
4. 로딩 상태 표시 확인

## 문의

매치 기록 시스템 관련 문의사항이나 버그 리포트는 이슈로 등록해주세요.
