# 🚨 긴급: Onboarding 마이그레이션 적용 필요

## 즉시 실행해야 할 작업

### 1. Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택 (ufditvjedsirkxvkvilb)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2. 다음 SQL 실행

```sql
-- Add onboarding_completed column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Update existing users who have nickname to have completed onboarding
UPDATE users
SET onboarding_completed = TRUE
WHERE nickname IS NOT NULL AND nickname != '';

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Indicates whether the user has completed the onboarding process';
```

### 3. 실행 확인

다음 쿼리로 마이그레이션이 성공적으로 적용되었는지 확인:

```sql
-- 컬럼이 추가되었는지 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name = 'onboarding_completed';

-- 사용자별 온보딩 상태 확인
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = TRUE THEN 1 END) as completed,
  COUNT(CASE WHEN onboarding_completed = FALSE THEN 1 END) as not_completed
FROM users;

-- 닉네임이 있는데 온보딩이 false인 사용자가 있는지 확인 (없어야 정상)
SELECT COUNT(*) as should_be_zero
FROM users
WHERE nickname IS NOT NULL
AND nickname != ''
AND onboarding_completed = FALSE;
```

## 왜 이 작업이 필요한가?

현재 코드에서 다음 기능들이 `onboarding_completed` 컬럼에 의존합니다:

1. **middleware.ts**: 온보딩을 완료하지 않은 사용자를 `/onboarding`으로 리다이렉트
2. **AuthContext.tsx**: 새 사용자 생성 시 `onboarding_completed: false`로 설정
3. **complete-profile API**: 프로필 완료 시 `onboarding_completed: true`로 업데이트

**이 컬럼이 없으면:**
- ❌ 새 사용자가 로그인할 때 에러 발생
- ❌ 온보딩 페이지 접근 제어 불가
- ❌ 사용자가 온보딩을 건너뛸 수 있음

## 적용 후 테스트

1. 새 계정으로 소셜 로그인 시도
2. 자동으로 `/onboarding` 페이지로 이동하는지 확인
3. 온보딩 완료 전에 다른 페이지 접근 시도 (차단되어야 함)
4. 온보딩 완료 후 정상적으로 사이트 이용 가능한지 확인

## 문제 발생 시

만약 에러가 발생하면:

```sql
-- 롤백 (주의: 데이터 손실)
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
```

단, 이미 운영 중인 경우 롤백하지 말고 문제를 해결하는 것이 좋습니다.

---

**작성일:** 2025-11-22
**우선순위:** 🔴 매우 높음
**예상 소요시간:** 5분