# 구독 시스템 개선사항

## 구현된 기능

이 업데이트는 프리미엄 및 VIP 구독 시스템의 주요 문제들을 해결합니다.

### 1. 자동 만료 처리 ✅

**문제**: 만료된 구독이 DB에 `is_active = true`로 계속 남아있음

**해결**:
- 매일 새벽 1시에 자동으로 만료된 구독을 비활성화하는 스케줄러 추가
- `pg_cron` 확장 기능 사용
- `cleanup_expired_subscriptions()` 함수 실행

### 2. 보안 강화 (RLS) ✅

**문제**: `premium_memberships` 테이블에 Row Level Security가 없어서 다른 사용자 데이터 접근 가능

**해결**:
- RLS 정책 추가:
  - 사용자는 자신의 구독만 조회 가능
  - 사용자는 자신의 구독만 생성 가능
  - 사용자는 자신의 구독만 수정 가능

### 3. 실시간 만료 확인 ✅

**해결**:
- 트리거를 통해 업데이트 시 자동으로 만료 체크
- 만료된 구독은 즉시 `is_active = false`로 변경

### 4. 성능 최적화 ✅

**해결**:
- 인덱스 추가:
  - `idx_premium_memberships_user_active`
  - `idx_premium_memberships_end_date`
  - `idx_vip_memberships_user_active`
  - `idx_vip_memberships_end_date`

### 5. 관리자 API 추가 ✅

새로운 엔드포인트:
- `GET /api/admin/cleanup-subscriptions` - 만료 예정 구독 확인
- `POST /api/admin/cleanup-subscriptions` - 수동으로 만료 처리 실행

### 6. 개선된 구독 상태 API ✅

업데이트된 엔드포인트:
- `GET /api/subscription/status` - Premium과 VIP 모두 확인, 남은 일수 계산

## 마이그레이션 적용 방법

### 로컬 개발 환경

```bash
# Supabase에 연결 (한 번만 실행)
npx supabase link --project-ref YOUR_PROJECT_REF

# 마이그레이션 적용
npx supabase db push

# 또는 직접 SQL 실행
psql -h YOUR_DB_HOST -U YOUR_DB_USER -d YOUR_DB_NAME -f supabase/migrations/20251109000004_fix_subscription_expiration.sql
```

### Supabase 대시보드에서 직접 실행

1. Supabase Dashboard 접속
2. SQL Editor 열기
3. `supabase/migrations/20251109000004_fix_subscription_expiration.sql` 파일 내용 복사
4. 실행

## 주요 함수

### 1. `deactivate_expired_premium_memberships()`
만료된 Premium 구독을 비활성화합니다.

```sql
SELECT deactivate_expired_premium_memberships();
-- Returns: 비활성화된 구독 수
```

### 2. `deactivate_expired_vip_memberships()`
만료된 VIP 구독을 비활성화합니다.

```sql
SELECT deactivate_expired_vip_memberships();
-- Returns: 비활성화된 구독 수
```

### 3. `cleanup_expired_subscriptions()`
모든 만료된 구독을 한 번에 정리합니다.

```sql
SELECT cleanup_expired_subscriptions();
-- Returns: (premium_count, vip_count)
```

## 스케줄 설정

마이그레이션을 적용하면 자동으로 다음 스케줄이 생성됩니다:

```sql
-- 매일 새벽 1시에 실행
SELECT cron.schedule(
  'cleanup-expired-subscriptions',
  '0 1 * * *',
  $$SELECT cleanup_expired_subscriptions();$$
);
```

### 스케줄 관리

```sql
-- 스케줄 확인
SELECT * FROM cron.job;

-- 스케줄 삭제
SELECT cron.unschedule('cleanup-expired-subscriptions');

-- 스케줄 재생성 (다른 시간으로)
SELECT cron.schedule(
  'cleanup-expired-subscriptions',
  '0 3 * * *', -- 새벽 3시
  $$SELECT cleanup_expired_subscriptions();$$
);
```

## 테스트 방법

### 1. 만료 처리 테스트

```bash
# 1. 만료 예정 구독 확인
curl http://localhost:3000/api/admin/cleanup-subscriptions

# 2. 수동으로 만료 처리 실행
curl -X POST http://localhost:3000/api/admin/cleanup-subscriptions
```

### 2. 구독 상태 확인

```bash
# 현재 사용자의 구독 상태 확인
curl http://localhost:3000/api/subscription/status
```

응답 예시:
```json
{
  "premium": {
    "active": true,
    "membership": {
      "id": "...",
      "startDate": "2024-11-09T00:00:00.000Z",
      "endDate": "2024-12-09T00:00:00.000Z",
      "daysRemaining": 30,
      "purchasedWith": "points",
      "amountPaid": 5000
    }
  },
  "vip": {
    "active": false,
    "membership": null
  },
  "hasAnyActiveSubscription": true
}
```

## 데이터베이스 뷰

편리한 조회를 위한 뷰가 추가되었습니다:

```sql
-- 활성화된 Premium 구독만 조회
SELECT * FROM active_premium_memberships;

-- 활성화된 VIP 구독만 조회
SELECT * FROM active_vip_memberships;
```

## 문제 해결

### pg_cron 확장이 없는 경우

```sql
-- 확장 설치 (관리자 권한 필요)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 확장 확인
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

### 스케줄이 실행되지 않는 경우

```sql
-- cron 로그 확인
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cleanup-expired-subscriptions')
ORDER BY start_time DESC
LIMIT 10;
```

### 수동으로 만료 처리

```sql
-- SQL로 직접 실행
SELECT cleanup_expired_subscriptions();

-- 또는 API로 실행
-- POST /api/admin/cleanup-subscriptions
```

## 마이그레이션 롤백

만약 문제가 발생하면 다음과 같이 롤백할 수 있습니다:

```sql
-- 스케줄 삭제
SELECT cron.unschedule('cleanup-expired-subscriptions');

-- 트리거 삭제
DROP TRIGGER IF EXISTS premium_expiration_check ON premium_memberships;
DROP TRIGGER IF EXISTS vip_expiration_check ON vip_memberships;

-- 함수 삭제
DROP FUNCTION IF EXISTS deactivate_expired_premium_memberships();
DROP FUNCTION IF EXISTS deactivate_expired_vip_memberships();
DROP FUNCTION IF EXISTS cleanup_expired_subscriptions();
DROP FUNCTION IF EXISTS check_subscription_expiration();

-- 뷰 삭제
DROP VIEW IF EXISTS active_premium_memberships;
DROP VIEW IF EXISTS active_vip_memberships;

-- RLS 정책 삭제
DROP POLICY IF EXISTS "Users can view own premium memberships" ON premium_memberships;
DROP POLICY IF EXISTS "Users can insert own premium memberships" ON premium_memberships;
DROP POLICY IF EXISTS "Users can update own premium memberships" ON premium_memberships;

-- RLS 비활성화
ALTER TABLE premium_memberships DISABLE ROW LEVEL SECURITY;

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_premium_memberships_user_active;
DROP INDEX IF EXISTS idx_premium_memberships_end_date;
DROP INDEX IF EXISTS idx_vip_memberships_user_active;
DROP INDEX IF EXISTS idx_vip_memberships_end_date;
```

## 주의사항

1. **pg_cron 확장**: Supabase Pro 플랜 이상에서 사용 가능합니다. Free 플랜에서는 수동 API 호출이나 외부 cron 사용이 필요합니다.

2. **시간대**: UTC 기준으로 스케줄이 설정됩니다. 한국 시간(KST) 기준으로 조정하려면:
   ```sql
   -- 한국 시간 새벽 1시 = UTC 오후 4시 (전날)
   SELECT cron.schedule(
     'cleanup-expired-subscriptions',
     '0 16 * * *',
     $$SELECT cleanup_expired_subscriptions();$$
   );
   ```

3. **백업**: 마이그레이션 전에 데이터베이스 백업을 권장합니다.

## 향후 개선 사항

- [ ] 만료 7일 전 알림 이메일 발송
- [ ] 자동 갱신 기능 구현
- [ ] 구독 관리 대시보드
- [ ] 결제 연동 (Toss Payments, Stripe 등)
- [ ] 구독 히스토리 추적

## 관련 파일

- **마이그레이션**: `supabase/migrations/20251109000004_fix_subscription_expiration.sql`
- **API 엔드포인트**:
  - `app/api/admin/cleanup-subscriptions/route.ts`
  - `app/api/subscription/status/route.ts`
