# 매치 초대 시스템 가이드

## 개요

레이팅 매치 세션에 사용자를 닉네임 검색을 통해 초대할 수 있는 시스템이 구현되었습니다. 이를 통해 원하는 플레이어와 함께 매치를 진행할 수 있습니다.

## 주요 기능

### 1. 두 가지 매치 생성 방식

#### 초대 방식 (Invitation Mode)
- 세션 생성자만 먼저 참가
- 다른 플레이어를 닉네임으로 검색하여 초대
- 초대받은 사람이 수락하면 참가 확정
- 초대 메시지 포함 가능

#### 즉시 시작 (Immediate Mode)
- 모든 참가자를 직접 선택
- 모든 플레이어가 즉시 참가 확정
- 기존 방식과 동일

### 2. 초대 관리

#### 초대장 발송
- 닉네임 검색으로 사용자 찾기
- 팀 선택 (팀 1 또는 팀 2)
- 선택적 메시지 추가
- 24시간 유효기간

#### 초대 응답
- 수락: 자동으로 매치에 참가
- 거절: 초대 거부
- 자동 만료: 24시간 후 자동 취소

#### 초대 취소
- 발송자가 응답 전 취소 가능
- 취소된 초대는 더 이상 유효하지 않음

### 3. 닉네임 검색

- 실시간 검색 (300ms 디바운스)
- 이름 또는 닉네임으로 검색
- 검색 결과 최대 10명
- 성별 필터링 자동 적용

## 데이터베이스 구조

### `match_invitations` 테이블

```sql
CREATE TABLE match_invitations (
  id TEXT PRIMARY KEY,
  match_session_id TEXT REFERENCES match_sessions(id),
  inviter_id TEXT REFERENCES users(id),
  invitee_id TEXT REFERENCES users(id),
  team INTEGER CHECK (team IN (1, 2)),
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED')),
  message TEXT,
  created_at TIMESTAMP,
  responded_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

### 주요 필드

- `inviter_id`: 초대를 보낸 사람
- `invitee_id`: 초대를 받은 사람
- `team`: 초대받은 사람이 배정될 팀 (1 or 2)
- `status`: 초대 상태
  - `PENDING`: 대기 중
  - `ACCEPTED`: 수락됨
  - `DECLINED`: 거절됨
  - `CANCELLED`: 취소됨
- `expires_at`: 만료 시간 (기본 24시간)

### 자동 처리 트리거

초대 수락 시 자동으로:
1. `match_participants` 테이블에 참가자 추가
2. `responded_at` 타임스탬프 기록
3. 세션 상태 검증 (PENDING만 허용)

## API 엔드포인트

### 초대 발송

#### `POST /api/matches/sessions/[sessionId]/invite`
매치 세션에 사용자 초대

**Request Body:**
```json
{
  "inviteeId": "user-id",
  "team": 1,
  "message": "같이 경기하실래요?"
}
```

**Response:**
```json
{
  "id": "invitation-id",
  "match_session_id": "session-id",
  "inviter_id": "inviter-id",
  "invitee_id": "invitee-id",
  "team": 1,
  "status": "PENDING",
  "message": "같이 경기하실래요?",
  "created_at": "2025-01-01T00:00:00Z",
  "expires_at": "2025-01-02T00:00:00Z"
}
```

#### `GET /api/matches/sessions/[sessionId]/invite`
세션의 모든 초대 목록 조회

**Response:**
```json
[
  {
    "id": "invitation-id",
    "status": "PENDING",
    "inviter": { "id": "...", "nickname": "..." },
    "invitee": { "id": "...", "nickname": "..." },
    ...
  }
]
```

### 초대 조회

#### `GET /api/invitations?type=received&status=PENDING`
사용자의 초대 목록 조회

**Query Parameters:**
- `type`: `received` (받은 초대) 또는 `sent` (보낸 초대)
- `status`: 초대 상태 필터 (선택사항)

**Response:**
```json
[
  {
    "id": "invitation-id",
    "match_session_id": "session-id",
    "team": 1,
    "status": "PENDING",
    "message": "같이 경기하실래요?",
    "created_at": "2025-01-01T00:00:00Z",
    "expires_at": "2025-01-02T00:00:00Z",
    "inviter": {
      "id": "inviter-id",
      "name": "홍길동",
      "nickname": "배드킹",
      "profileImage": "..."
    },
    "session": {
      "match_type": "MS",
      "entry_fee_points": 100,
      "winner_points": 150,
      "location": "서울 체육관",
      ...
    }
  }
]
```

### 초대 응답

#### `PATCH /api/invitations/[invitationId]`
초대에 응답 (수락/거절/취소)

**Request Body:**
```json
{
  "action": "accept"  // "accept", "decline", or "cancel"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": { ... },
  "message": "Invitation accepted"
}
```

#### `DELETE /api/invitations/[invitationId]`
초대 삭제 (발송자만 가능)

**Response:**
```json
{
  "success": true,
  "message": "Invitation deleted"
}
```

## UI 페이지

### `/matches/create`
매치 세션 생성 페이지 (업데이트됨)

**새로운 기능:**
- 참가 방식 선택 토글
  - 초대 방식: 플레이어 초대 후 수락 대기
  - 즉시 시작: 모든 참가자 직접 선택
- 닉네임 실시간 검색
- 팀별 초대 대상자 관리
- 초대 메시지 작성

**사용 흐름:**
1. 경기 종목 선택 (MS, WS, MD, WD, XD)
2. 참가 방식 선택
3. 입장료 및 보상 설정
4. 닉네임으로 플레이어 검색
5. 팀 1/팀 2에 배정
6. 초대 메시지 작성 (선택)
7. "세션 생성 & 초대" 버튼 클릭

### `/invitations`
초대 관리 페이지 (신규)

**기능:**
- 받은 초대 / 보낸 초대 탭
- 초대 목록 표시
  - 상대방 정보 (프로필, 닉네임)
  - 매치 정보 (종목, 팀, 장소)
  - 입장료 및 보상
  - 초대 메시지
  - 남은 시간
- 초대 응답 버튼
  - 받은 초대: 수락 / 거절
  - 보낸 초대: 취소 / 매치 보기
- 만료된 초대 자동 비활성화

## 권한 및 검증

### 초대 발송 권한
- 매치 참가자만 초대 가능
- 이미 참가 중인 사용자 초대 불가
- 중복 초대 불가
- 성별 제한 검증 (MS/MD: 남성만, WS/WD: 여성만)

### 초대 응답 권한
- 수락/거절: 초대받은 사람만
- 취소: 초대 보낸 사람만
- 삭제: 초대 보낸 사람만

### 상태 검증
- PENDING 상태의 초대만 응답 가능
- 만료된 초대 응답 불가
- PENDING 상태의 세션에만 참가 가능

## Row Level Security (RLS)

### 조회 권한
```sql
-- 자신이 보낸 초대 조회
CREATE POLICY "Users can view their sent invitations"
  ON match_invitations FOR SELECT
  USING (auth.uid()::text = inviter_id);

-- 자신이 받은 초대 조회
CREATE POLICY "Users can view their received invitations"
  ON match_invitations FOR SELECT
  USING (auth.uid()::text = invitee_id);
```

### 수정 권한
```sql
-- 초대받은 사람이 응답
CREATE POLICY "Users can respond to their invitations"
  ON match_invitations FOR UPDATE
  USING (auth.uid()::text = invitee_id);

-- 초대 보낸 사람이 취소
CREATE POLICY "Users can cancel their invitations"
  ON match_invitations FOR UPDATE
  USING (auth.uid()::text = inviter_id);
```

## 사용 시나리오

### 시나리오 1: 친구와 복식 경기

```
1. 사용자 A가 매치 생성
   → 종목: 남자 복식 (MD)
   → 참가 방식: 초대 방식
   → 입장료: 100 포인트
   → 승자 보상: 150 포인트

2. 사용자 A가 닉네임 검색
   → "배드킹" 검색
   → 팀 1에 추가 (파트너)

3. 상대팀 초대
   → "슈퍼스매시" 검색 → 팀 2 추가
   → "강타왕" 검색 → 팀 2 추가

4. 초대 메시지 작성
   → "오늘 저녁 7시 체육관에서 같이 경기하실래요?"

5. 세션 생성 & 초대 발송
   → 3명에게 초대장 발송됨

6. 초대받은 사용자들 응답
   → /invitations 페이지에서 확인
   → 수락 버튼 클릭
   → 자동으로 매치 참가 확정

7. 모두 수락 후 입장료 지불
   → 각자 100 포인트 지불

8. 경기 진행 및 결과 기록
```

### 시나리오 2: 단식 경기

```
1. 사용자 B가 매치 생성
   → 종목: 남자 단식 (MS)
   → 참가 방식: 초대 방식

2. 상대 검색 및 초대
   → "프로배드민턴" 검색
   → 팀 2에 추가
   → 초대 발송

3. 상대가 수락
   → 즉시 매치 준비 완료

4. 양측 입장료 지불 후 경기 시작
```

## 알림 및 만료

### 자동 만료
```sql
-- 24시간 후 자동 만료
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE match_invitations
  SET status = 'CANCELLED'
  WHERE status = 'PENDING'
  AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

### 시간 표시
- 남은 시간 실시간 표시
- 1시간 미만: "N분 남음"
- 1시간 이상: "N시간 M분 남음"
- 만료: "만료됨" (응답 불가)

## TypeScript 타입

```typescript
// 초대 상태
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

// 초대
export interface MatchInvitation {
  id: string;
  match_session_id: string;
  inviter_id: string;
  invitee_id: string;
  team: 1 | 2;
  status: InvitationStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
  expires_at: string;
}

// 상세 정보 포함 초대
export interface MatchInvitationDetailed extends MatchInvitation {
  inviter: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
  };
  invitee: {
    id: string;
    name: string;
    nickname: string;
    profileImage: string | null;
  };
  session: MatchSession;
}

// 초대 생성 요청
export interface CreateInvitationRequest {
  inviteeId: string;
  team: 1 | 2;
  message?: string;
}

// 초대 응답 요청
export interface RespondInvitationRequest {
  action: 'accept' | 'decline' | 'cancel';
}
```

## 에러 처리

### 일반적인 에러

| 에러 | 원인 | 해결 |
|------|------|------|
| "User is already a participant" | 이미 참가 중인 사용자 초대 | 다른 사용자 선택 |
| "An invitation is already pending" | 이미 초대장 발송됨 | 응답 대기 또는 취소 후 재발송 |
| "Invitation has expired" | 24시간 경과 | 새로운 초대 발송 필요 |
| "Match session is no longer available" | 세션이 시작됨 또는 취소됨 | 새로운 세션 생성 |
| "This match requires male participants" | 성별 제한 위반 | 올바른 성별의 사용자 선택 |
| "Insufficient points/feathers" | 입장료 부족 | 포인트/깃털 충전 필요 |

## 향후 개선 사항

1. **푸시 알림**
   - 초대 발송 시 실시간 알림
   - 초대 수락/거절 시 발송자에게 알림
   - 만료 임박 알림

2. **초대 템플릿**
   - 자주 쓰는 초대 메시지 저장
   - 빠른 초대 기능

3. **일괄 초대**
   - 여러 사람에게 동시 초대
   - 친구 그룹 초대

4. **초대 통계**
   - 수락률 표시
   - 자주 함께 경기하는 사람 추천

5. **자동 매칭**
   - 레이팅 기반 자동 상대 추천
   - 원클릭 초대

## 테스트

### 초대 발송 테스트
```bash
curl -X POST http://localhost:3000/api/matches/sessions/SESSION_ID/invite \
  -H "Content-Type: application/json" \
  -d '{
    "inviteeId": "USER_ID",
    "team": 1,
    "message": "같이 경기하실래요?"
  }'
```

### 초대 수락 테스트
```bash
curl -X PATCH http://localhost:3000/api/invitations/INVITATION_ID \
  -H "Content-Type: application/json" \
  -d '{"action": "accept"}'
```

### 초대 목록 조회 테스트
```bash
curl http://localhost:3000/api/invitations?type=received&status=PENDING
```

## 문의

초대 시스템 관련 문의사항이나 버그 리포트는 이슈로 등록해주세요.
