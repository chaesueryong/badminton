# Supabase 소셜 로그인 문제 해결 가이드

## 에러: "인증에 실패했습니다"

이 에러는 주로 다음과 같은 이유로 발생합니다:

### 1. Redirect URL 설정 확인

Supabase Dashboard에서 설정해야 할 Redirect URLs:

1. **Supabase Dashboard 접속**
   - https://app.supabase.com
   - 프로젝트 선택

2. **Authentication > URL Configuration으로 이동**

3. **Redirect URLs에 다음 URL들을 추가:**
   ```
   http://localhost:3000/auth/callback
   https://badmate.club/auth/callback
   https://www.badmate.club/auth/callback
   ```

4. **Site URL 설정:**
   - Development: `http://localhost:3000`
   - Production: `https://badmate.club`

### 2. OAuth Provider 설정 확인

#### Google 로그인 설정:
1. **Supabase Dashboard > Authentication > Providers**
2. **Google Provider 활성화**
3. **Google Cloud Console 설정:**
   - Authorized redirect URIs에 추가:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```

#### Kakao 로그인 설정:
1. **Kakao Developers Console**
2. **내 애플리케이션 > 앱 설정 > 플랫폼**
3. **Redirect URI 등록:**
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

### 3. 환경 변수 확인

`.env.local` 파일에 다음 변수들이 올바르게 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=https://badmate.club
```

### 4. 로그 확인

서버 로그를 확인하여 구체적인 에러 메시지 확인:

#### 로컬 개발 환경:
```bash
npm run dev
```
콘솔에서 "Auth exchange error:" 로그 확인

#### 프로덕션 환경:
Docker 로그 확인:
```bash
docker logs badminton-prod
```

### 5. 일반적인 에러와 해결 방법

| 에러 메시지 | 원인 | 해결 방법 |
|------------|------|----------|
| `invalid_request` | Redirect URL 불일치 | Supabase Dashboard에서 Redirect URL 추가 |
| `access_denied` | 사용자가 권한 거부 | 정상 동작 (사용자가 취소함) |
| `invalid_grant` | Code가 만료되거나 이미 사용됨 | 페이지 새로고침 후 재시도 |
| `unauthorized_client` | OAuth Client 설정 오류 | Google/Kakao Console에서 Client ID 확인 |

### 6. 테스트 방법

1. **시크릿 모드에서 테스트**
   - 캐시와 쿠키를 피하기 위해 시크릿 모드 사용

2. **로그 확인**
   - 브라우저 개발자 도구 > Console
   - 서버 로그

3. **네트워크 탭 확인**
   - 개발자 도구 > Network
   - `/auth/callback` 요청 확인
   - 리다이렉트 체인 확인

### 7. 추가 디버깅

에러가 계속되면 다음 정보를 수집:

1. 브라우저 콘솔의 에러 메시지
2. 서버 로그의 "Auth exchange error" 메시지
3. URL 파라미터의 실제 에러 메시지
4. Supabase Dashboard의 Auth Logs

## 빠른 체크리스트

- [ ] Supabase Dashboard에 Redirect URL 등록됨
- [ ] Google/Kakao Console에 Redirect URI 등록됨
- [ ] 환경 변수가 올바르게 설정됨
- [ ] OAuth Provider가 Supabase에서 활성화됨
- [ ] 서버가 재시작됨 (환경 변수 변경 후)
- [ ] HTTPS 사용 (프로덕션 환경)
