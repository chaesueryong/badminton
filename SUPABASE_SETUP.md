# Supabase 설정 가이드

이 문서는 배드민턴 커뮤니티 애플리케이션에 Supabase를 연동하는 방법을 설명합니다.

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 가입 및 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New project" 클릭
5. 프로젝트 정보 입력:
   - Name: `badminton-community`
   - Database Password: 안전한 비밀번호 생성 (저장 필수!)
   - Region: Northeast Asia (Seoul) 선택
   - Pricing Plan: Free tier 선택

## 2. 환경 변수 설정

### 2.1 Supabase 대시보드에서 API 키 확인

1. Supabase 프로젝트 대시보드 → Settings → API
2. 다음 정보 복사:
   - Project URL: `https://[your-project-ref].supabase.co`
   - `anon` public: Anonymous Key
   - `service_role` secret: Service Role Key

### 2.2 환경 변수 파일 설정

`.env.local` 파일 생성 (`.env.example` 복사):

```bash
cp .env.example .env.local
```

`.env.local` 파일에 다음 값 입력:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project-ref.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="생성한-시크릿-키"
```

### 2.3 NEXTAUTH_SECRET 생성

터미널에서 실행:

```bash
openssl rand -base64 32
```

또는 Node.js로:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. 데이터베이스 스키마 마이그레이션

### 3.1 Prisma 클라이언트 생성

```bash
npx prisma generate
```

### 3.2 데이터베이스에 스키마 적용

```bash
npx prisma db push
```

이 명령은 Supabase PostgreSQL에 모든 테이블을 생성합니다.

### 3.3 Prisma Studio로 확인 (선택사항)

```bash
npx prisma studio
```

브라우저에서 http://localhost:5555 접속하여 데이터베이스 확인

## 4. Supabase 설정

### 4.1 Authentication 설정

1. Supabase 대시보드 → Authentication → Settings
2. Site URL: `http://localhost:3000` 입력
3. Redirect URLs 추가:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`

### 4.2 Email 확인 비활성화 (개발 환경)

1. Authentication → Settings
2. "Enable email confirmations" 체크 해제 (개발 중에만)
3. 프로덕션 환경에서는 반드시 활성화!

### 4.3 Row Level Security (RLS) 설정

Supabase 대시보드 → Table Editor에서 각 테이블의 RLS 활성화:

#### users 테이블

```sql
-- 읽기: 인증된 사용자는 모든 사용자 정보 읽기 가능
CREATE POLICY "Anyone can view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- 업데이트: 본인 정보만 수정 가능
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);
```

#### meetings 테이블

```sql
-- 읽기: 모두 가능
CREATE POLICY "Anyone can view meetings"
ON meetings FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create meetings"
ON meetings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "hostId");

-- 업데이트: 호스트만
CREATE POLICY "Hosts can update own meetings"
ON meetings FOR UPDATE
TO authenticated
USING (auth.uid() = "hostId");

-- 삭제: 호스트만
CREATE POLICY "Hosts can delete own meetings"
ON meetings FOR DELETE
TO authenticated
USING (auth.uid() = "hostId");
```

#### posts 테이블

```sql
-- 읽기: 모두 가능
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
TO authenticated
USING (true);

-- 생성: 인증된 사용자만
CREATE POLICY "Authenticated users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "authorId");

-- 업데이트: 작성자만
CREATE POLICY "Authors can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = "authorId");

-- 삭제: 작성자만
CREATE POLICY "Authors can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = "authorId");
```

#### messages 테이블

```sql
-- 읽기: 발신자 또는 수신자만
CREATE POLICY "Users can view own messages"
ON messages FOR SELECT
TO authenticated
USING (auth.uid() = "senderId" OR auth.uid() = "receiverId");

-- 생성: 인증된 사용자 (발신자만)
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "senderId");

-- 업데이트: 수신자만 (읽음 처리)
CREATE POLICY "Recipients can update messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = "receiverId");
```

## 5. Storage 설정

### 5.1 Storage Buckets 생성

1. Supabase 대시보드 → Storage
2. 다음 버킷 생성:
   - `profiles` - 프로필 이미지
   - `posts` - 게시글 이미지
   - `gyms` - 체육관 이미지

### 5.2 Storage Policy 설정

각 버킷에 대해:

```sql
-- 읽기: 모두 가능
CREATE POLICY "Anyone can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- 업로드: 인증된 사용자만
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profiles');

-- 삭제: 본인이 업로드한 파일만
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profiles' AND owner = auth.uid());
```

## 6. Realtime 설정

### 6.1 Realtime 활성화

1. Supabase 대시보드 → Database → Replication
2. `messages` 테이블에 대해 "Replication" 활성화

## 7. 개발 서버 실행

```bash
npm install --legacy-peer-deps
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 8. 테스트

### 8.1 회원가입 테스트

1. http://localhost:3000/signup 접속
2. 테스트 계정 생성
3. Supabase 대시보드 → Authentication → Users에서 확인

### 8.2 데이터베이스 확인

1. Supabase 대시보드 → Table Editor
2. `users` 테이블에 데이터 확인

### 8.3 Storage 테스트

1. 프로필 페이지에서 이미지 업로드
2. Supabase 대시보드 → Storage → profiles에서 확인

## 9. 프로덕션 배포

### 9.1 환경 변수 설정

프로덕션 환경에 다음 환경 변수를 설정합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL` (배포된 URL)
- `NEXTAUTH_SECRET`

### 9.2 Supabase 프로덕션 설정

1. Authentication → Settings
   - Site URL: 배포된 URL 입력
   - Redirect URLs: 배포된 URL 추가
2. Email Confirmations 활성화

## 10. 문제 해결

### 연결 오류

```
Error: Can't reach database server
```

**해결:**
- DATABASE_URL과 DIRECT_URL이 올바른지 확인
- Supabase 프로젝트가 활성화되어 있는지 확인
- 방화벽 설정 확인

### 인증 오류

```
Error: Invalid Supabase URL or key
```

**해결:**
- `.env.local` 파일의 Supabase URL과 키 확인
- 개발 서버 재시작

### 스키마 마이그레이션 실패

```
Error: Migration failed
```

**해결:**
```bash
npx prisma migrate reset
npx prisma db push
```

## 11. 유용한 명령어

```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 스키마 업데이트
npx prisma db push

# Prisma Studio 실행
npx prisma studio

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 12. 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
