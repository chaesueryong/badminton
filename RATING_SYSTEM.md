# 레이팅 시스템 가이드

## 개요

배드민턴 매칭 플랫폼에 경기 종목별 레이팅 시스템이 추가되었습니다. ELO 기반 레이팅 알고리즘을 사용하여 플레이어의 실력을 평가하고, 입장료 시스템과 보상 시스템을 통해 게임화된 경험을 제공합니다.

## 주요 기능

### 1. 경기 종목별 독립 레이팅

각 경기 종목마다 독립적인 레이팅이 관리됩니다:

- **MS (Men's Singles)**: 남자 단식
- **WS (Women's Singles)**: 여자 단식
- **MD (Men's Doubles)**: 남자 복식
- **WD (Women's Doubles)**: 여자 복식
- **XD (Mixed Doubles)**: 혼합 복식

각 사용자는 종목별로:
- 현재 레이팅 (기본 1500점)
- 최고 레이팅
- 경기 수
- 승리 수
를 가집니다.

### 2. 입장료 시스템

매치 세션 참가 시:
- **포인트** 또는 **깃털**로 입장료 지불
- 입장료는 매치 생성 시 설정
- 세션이 취소되면 자동 환불

### 3. 승자 보상

매치 완료 시:
- 승자/승자팀은 **포인트** 획득
- 레이팅 점수 상승
- 전적(승/패) 기록

### 4. 레이팅 계산

#### 단식 (MS, WS)
- 1:1 대결
- 상대방의 레이팅과 비교하여 계산
- 강한 상대를 이기면 더 많은 점수 획득

#### 복식 (MD, WD, XD)
- 2:2 팀 대결
- 팀의 평균 레이팅으로 계산
- 각 플레이어의 레이팅이 개별적으로 변동

#### ELO 공식
```
Expected Score = 1 / (1 + 10^((Opponent Rating - Player Rating) / 400))
Rating Change = K × (Actual Score - Expected Score)
```
- K-factor: 32 (기본값)
- Actual Score: 승리 = 1, 패배 = 0

### 5. 레이팅 티어

| 티어 | 레이팅 범위 | 아이콘 |
|------|------------|--------|
| Bronze | 0 - 1199 | 🥉 |
| Silver | 1200 - 1399 | 🥈 |
| Gold | 1400 - 1599 | 🥇 |
| Platinum | 1600 - 1799 | 💎 |
| Diamond | 1800 - 1999 | 💠 |
| Master | 2000 - 2199 | 👑 |
| Grandmaster | 2200+ | 🏆 |

## 데이터베이스 구조

### 주요 테이블

#### `match_sessions`
매치 세션 정보
- 경기 종목 (match_type)
- 입장료 설정 (entry_fee_points, entry_fee_feathers)
- 승자 보상 (winner_points)
- 매치 결과 (result, team1_score, team2_score)
- 상태 (status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED)

#### `match_participants`
매치 참가자 정보
- 팀 배정 (team: 1 or 2)
- 입장료 지불 내역
- 레이팅 변동 (rating_before, rating_after, rating_change)
- 포인트 획득 (points_earned)

#### `rating_history`
레이팅 변동 이력
- 경기 종목별 레이팅 변화 추적
- 승/패 기록

#### `match_entry_transactions`
입장료 거래 내역
- 입장료 차감
- 환불 내역

### 사용자 테이블 확장

`users` 테이블에 추가된 필드:
```sql
-- 레이팅
rating_ms, rating_ws, rating_md, rating_wd, rating_xd INTEGER DEFAULT 1500

-- 최고 레이팅
peak_rating_ms, peak_rating_ws, peak_rating_md, peak_rating_wd, peak_rating_xd INTEGER DEFAULT 1500

-- 경기 수
games_ms, games_ws, games_md, games_wd, games_xd INTEGER DEFAULT 0

-- 승리 수
wins_ms, wins_ws, wins_md, wins_wd, wins_xd INTEGER DEFAULT 0
```

## API 엔드포인트

### 매치 세션 관리

#### `POST /api/matches/sessions`
새 매치 세션 생성
```json
{
  "matchType": "MS" | "WS" | "MD" | "WD" | "XD",
  "entryFeePoints": 100,
  "entryFeeFeathers": 0,
  "winnerPoints": 100,
  "location": "서울 체육관",
  "courtNumber": 1,
  "participants": [
    { "userId": "user1", "team": 1 },
    { "userId": "user2", "team": 2 }
  ]
}
```

#### `GET /api/matches/sessions`
매치 세션 목록 조회
- Query params: `matchType`, `status`, `userId`, `meetingId`, `limit`, `offset`

#### `POST /api/matches/sessions/[sessionId]/join`
매치 세션 참가 및 입장료 지불
```json
{
  "paymentMethod": "points" | "feathers"
}
```

#### `POST /api/matches/sessions/[sessionId]/complete`
매치 완료 및 결과 기록
```json
{
  "result": "PLAYER1_WIN" | "PLAYER2_WIN" | "TEAM1_WIN" | "TEAM2_WIN",
  "team1Score": 21,
  "team2Score": 15
}
```

#### `POST /api/matches/sessions/[sessionId]/cancel`
매치 취소 및 입장료 환불

### 리더보드

#### `GET /api/leaderboard/[matchType]`
경기 종목별 리더보드 조회
- Path param: `MS` | `WS` | `MD` | `WD` | `XD` | `ALL`
- Query params: `region`, `limit`, `offset`

Response:
```json
{
  "matchType": "MS",
  "region": "all",
  "total": 100,
  "limit": 50,
  "offset": 0,
  "leaderboard": [
    {
      "rank": 1,
      "userId": "...",
      "name": "홍길동",
      "nickname": "배드킹",
      "rating": 1850,
      "peakRating": 1900,
      "gamesPlayed": 50,
      "wins": 35,
      "losses": 15,
      "winRate": 70.0
    }
  ]
}
```

### 사용자 레이팅 정보

#### `GET /api/users/[userId]/ratings`
사용자의 레이팅 통계 조회

Response:
```json
{
  "user": { ... },
  "overall": {
    "highestRating": 1850,
    "totalGames": 120,
    "totalWins": 75,
    "winRate": 62.5
  },
  "byMatchType": [
    {
      "matchType": "MS",
      "rating": 1850,
      "peakRating": 1900,
      "gamesPlayed": 50,
      "wins": 35,
      "winRate": 70.0
    }
  ],
  "recentHistory": [ ... ]
}
```

## UI 페이지

### `/ratings`
레이팅 리더보드 페이지
- 경기 종목별 필터링
- 지역별 필터링
- 랭킹, 티어, 전적 표시

### `/matches/create`
매치 세션 생성 페이지
- 경기 종목 선택
- 입장료 설정 (포인트/깃털)
- 승자 보상 포인트 설정
- 플레이어 검색 및 팀 배정

### `/profile/[userId]` (기존 페이지 확장)
사용자 프로필에 레이팅 정보 표시
- 종목별 레이팅 및 전적
- 레이팅 변동 그래프
- 최근 매치 기록

## 데이터베이스 함수

### `calculate_rating_change()`
레이팅 변동 계산
```sql
SELECT calculate_rating_change(1500, 1600, true, 32);
-- Returns: +23 (assuming player with 1500 rating beats 1600 rating opponent)
```

### `get_team_avg_rating()`
팀 평균 레이팅 계산 (복식용)

### `complete_match_session()`
매치 완료 처리
- 레이팅 업데이트
- 포인트 지급
- 전적 기록
- 히스토리 생성

### `refund_match_entry_fees()`
입장료 환불 처리
- 포인트/깃털 환불
- 거래 기록
- 세션 상태 업데이트

## 사용 흐름

### 매치 생성 및 진행

1. **매치 생성**
   ```
   호스트가 /matches/create 에서 매치 세션 생성
   → 경기 종목, 입장료, 보상 설정
   → 플레이어 선택 및 팀 배정
   ```

2. **참가 및 입장료 지불**
   ```
   각 참가자가 입장료 지불
   → POST /api/matches/sessions/[sessionId]/join
   → 포인트 또는 깃털 차감
   ```

3. **경기 진행**
   ```
   매치 상태: PENDING → IN_PROGRESS
   → 실제 경기 진행
   ```

4. **결과 기록**
   ```
   결과 입력
   → POST /api/matches/sessions/[sessionId]/complete
   → 레이팅 계산 및 업데이트
   → 포인트 보상 지급
   ```

5. **완료**
   ```
   매치 상태: COMPLETED
   → 리더보드 업데이트
   → 레이팅 히스토리 기록
   ```

### 취소 흐름

```
매치 취소
→ POST /api/matches/sessions/[sessionId]/cancel
→ 입장료 자동 환불
→ 매치 상태: CANCELLED
```

## 타입 정의

TypeScript 타입은 `/types/rating.ts`에 정의되어 있습니다:
- `MatchType`
- `MatchSession`
- `MatchParticipant`
- `RatingHistory`
- `LeaderboardEntry`
- `UserRatingProfile`
- etc.

## 테스트

### 매치 세션 생성 테스트
```bash
curl -X POST http://localhost:3000/api/matches/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "matchType": "MS",
    "entryFeePoints": 100,
    "winnerPoints": 150,
    "participants": [
      {"userId": "user1_id", "team": 1},
      {"userId": "user2_id", "team": 2}
    ]
  }'
```

### 리더보드 조회 테스트
```bash
curl http://localhost:3000/api/leaderboard/MS?limit=10
```

## 향후 개선 사항

1. **시즌 시스템**
   - 시즌별 레이팅 리셋
   - 시즌 리워드

2. **매치메이킹**
   - 레이팅 기반 자동 매칭
   - 밸런스 팀 구성

3. **토너먼트 모드**
   - 토너먼트 생성 및 관리
   - 브라켓 시스템

4. **레이팅 보호**
   - 신규 유저 레이팅 보호 기간
   - 연속 패배 보호

5. **통계 대시보드**
   - 상세 통계 페이지
   - 레이팅 변동 그래프
   - 최근 경기 분석

## 문의

시스템 관련 문의사항이나 버그 리포트는 이슈로 등록해주세요.
