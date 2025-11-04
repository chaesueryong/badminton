# 배드민턴 커뮤니티

배드민턴 모임을 위한 풀스택 웹 애플리케이션입니다.

## 📚 문서

- [아키텍처 가이드](./ARCHITECTURE_GUIDE.md) - 프로젝트 구조 및 기술 스택
- [Supabase 설정](./SUPABASE_SETUP.md) - Supabase 초기 설정
- [결제 설정](./PAYMENT_SETUP.md) - TossPayments 연동

## 주요 기능

### ✅ 구현 완료

#### 인증 시스템
- 회원가입/로그인 (NextAuth.js + Supabase Auth)
- 세션 관리
- 프로필 페이지
- Supabase Auth API 통합

#### 모임 관리
- 모임 생성/조회/상세보기
- 모임 참가/취소
- 지역/레벨/날짜별 필터링

#### 체육관
- 체육관 목록/상세 페이지
- 시설 정보 조회
- 리뷰 시스템 UI

#### 커뮤니티
- 게시판 목록/작성 페이지
- 카테고리별 분류 (자유, 공지, 후기, 질문, 거래, 레슨, 대회)
- 댓글 시스템 UI

#### 매칭 & 메시징
- 파트너 매칭 목록
- 1:1 메시징 UI
- 사용자 통계 (경기수, 승률, 포인트)

#### Supabase 통합
- **Supabase Auth** - 인증 시스템
- **Supabase Storage** - 이미지 업로드
- **Supabase Realtime** - 실시간 메시징
- **PostgreSQL** - Supabase 관리형 DB
- **Row Level Security (RLS)** - 보안 정책

#### 소셜 로그인
- **Google OAuth** - 구글 로그인
- **Kakao OAuth** - 카카오 로그인
- Supabase Auth Providers 통합

#### 알림 시스템
- 웹 푸시 알림
- 이메일 알림 (Supabase Edge Functions)
- 실시간 알림 UI
- 알림 템플릿

#### 결제 시스템
- **토스페이먼츠** 연동
- 카드 결제
- 결제 승인/취소
- 결제 내역 관리

#### 기타
- 반응형 디자인
- 네비게이션 바 (세션 상태 표시)
- Prisma 데이터베이스 스키마
- 이미지 업로드 컴포넌트

### 🎯 프로덕션 준비 완료
- ✅ 모든 핵심 기능 구현
- ✅ Supabase 완전 통합
- ✅ RLS 보안 정책
- ✅ 소셜 로그인
- ✅ 결제 시스템
- ✅ 알림 시스템
- ✅ 실시간 메시징

### 🚀 선택적 개발
- 관리자 대시보드
- 고급 통계 및 분석
- 모바일 앱 (React Native)
- PWA 지원
- SEO 최적화

## 기술 스택

### Frontend
- **Next.js 14** - React 풀스택 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링

### Backend & Database
- **Next.js API Routes** - 서버리스 API
- **Supabase** - BaaS (Backend as a Service)
- **Prisma** - ORM
- **PostgreSQL** - 데이터베이스 (Supabase 관리형)

### Authentication & Storage
- **Supabase Auth** - 인증 시스템
- **Supabase Storage** - 파일 저장소
- **Supabase Realtime** - 실시간 통신
- **NextAuth.js** - 추가 인증 옵션
- **bcryptjs** - 비밀번호 해싱

### Developer Tools
- **Supabase MCP** - Claude Code와 Supabase 연동
- **Model Context Protocol** - AI 기반 데이터베이스 관리

## 시작하기

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Supabase 계정 (무료)

### 설치

1. 저장소 클론
```bash
git clone <repository-url>
cd badminton
```

2. 의존성 설치
```bash
npm install --legacy-peer-deps
```

3. Supabase 프로젝트 생성
- https://supabase.com 접속
- 새 프로젝트 생성
- 자세한 설정은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) 참조

4. 환경 변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일을 열어 Supabase 정보 입력:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

5. 데이터베이스 마이그레이션
```bash
npx prisma generate
npx prisma db push
```

6. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### Supabase MCP 연동 (선택사항)

프로젝트에는 Supabase MCP 서버가 설정되어 있어, Claude Code를 통해 자연어로 데이터베이스를 관리할 수 있습니다.

#### 사용 방법

1. `.env.local` 파일에 Supabase 정보가 설정되어 있는지 확인
2. Claude Code에서 자동으로 MCP 서버 연결
3. 사용 예시:
   ```
   "users 테이블 구조를 보여줘"
   "meetings 테이블에 새로운 컬럼 추가해줘"
   "데이터베이스 마이그레이션 생성해줘"
   ```

#### MCP 서버 확인

```bash
# Claude Code에서 실행
/mcp list
```

자세한 설정은 [Supabase MCP 문서](https://supabase.com/docs/guides/getting-started/mcp)를 참조하세요.

## 프로젝트 구조

```
badminton/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 페이지
│   │   ├── login/               # 로그인
│   │   └── signup/              # 회원가입
│   ├── api/                     # API 엔드포인트
│   │   ├── auth/                # 인증 API
│   │   ├── meetings/            # 모임 API
│   │   └── posts/               # 게시글 API
│   ├── community/               # 커뮤니티 페이지
│   ├── gyms/                    # 체육관 페이지
│   ├── matching/                # 파트너 매칭
│   ├── meetings/                # 모임 페이지
│   ├── messages/                # 메시지
│   ├── profile/                 # 프로필
│   ├── globals.css              # 글로벌 스타일
│   ├── layout.tsx               # 루트 레이아웃
│   └── page.tsx                 # 홈페이지
├── components/                   # 재사용 컴포넌트
│   ├── Navbar.tsx               # 네비게이션 바
│   └── SessionProvider.tsx      # 세션 프로바이더
├── lib/                         # 유틸리티
│   └── prisma.ts                # Prisma 클라이언트
├── prisma/                      # 데이터베이스
│   └── schema.prisma            # 스키마 정의
└── public/                      # 정적 파일
```

## 데이터베이스 스키마

### 주요 모델
- **User** - 사용자 정보 및 프로필
- **Meeting** - 배드민턴 모임
- **MeetingParticipant** - 모임 참가자
- **Gym** - 체육관 정보
- **Post** - 게시글
- **Comment** - 댓글
- **Message** - 1:1 메시지

자세한 스키마는 `prisma/schema.prisma` 참조

## API 엔드포인트

### 모임 (Meetings)

#### GET /api/meetings
모임 목록 조회
- Query: `region`, `level`, `date`

#### POST /api/meetings
모임 생성
- Body: `title`, `description`, `date`, `startTime`, `endTime`, `location`, `address`, `maxParticipants`, `level`, `fee`

#### GET /api/meetings/:id
모임 상세 조회

#### POST /api/meetings/:id/join
모임 참가

#### DELETE /api/meetings/:id/join
모임 참가 취소

## 개발 가이드

### 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint
```

### 데이터베이스 명령어

```bash
# Prisma 클라이언트 생성
npm run postinstall
# 또는
npx prisma generate

# 데이터베이스에 스키마 푸시 (개발용)
npm run db:push

# Prisma Studio 실행 (데이터베이스 GUI)
npm run db:studio

# 마이그레이션 배포 (프로덕션)
npm run db:migrate
```

## 배포

### 🚀 빠른 배포

#### 1. Supabase 프로젝트 생성

- 개발 환경: `badminton-dev`
- 운영 환경: `badminton-prod`

#### 2. 환경 변수 설정

```bash
# 로컬 개발
cp .env.development .env.local
# .env.local 파일을 열어 실제 값 입력
```

### 필수 환경 변수

**개발 환경** (`.env.local`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase Anon Key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `DATABASE_URL` - PostgreSQL 연결 URL (Pooler)
- `DIRECT_URL` - PostgreSQL 직접 연결 URL
- `NEXTAUTH_URL` - 애플리케이션 URL
- `NEXTAUTH_SECRET` - NextAuth 시크릿 키

**운영 환경**:
- 위와 동일하지만 운영 프로젝트 정보 사용
- `NEXTAUTH_SECRET`은 강력한 랜덤 문자열 생성 (`openssl rand -base64 32`)

## 구현된 페이지

### 인증
- `/login` - 로그인
- `/signup` - 회원가입
- `/profile` - 마이 프로필

### 모임
- `/meetings` - 모임 목록
- `/meetings/create` - 모임 만들기
- `/meetings/:id` - 모임 상세

### 체육관
- `/gyms` - 체육관 목록
- `/gyms/:id` - 체육관 상세

### 커뮤니티
- `/community` - 게시판 목록
- `/community/write` - 글쓰기
- `/community/:id` - 게시글 상세 (예정)

### 매칭 & 메시징
- `/matching` - 파트너 매칭
- `/messages` - 1:1 메시지

## 다음 단계

### 우선순위 높음
- [ ] 실제 데이터베이스 연결 및 테스트
- [ ] 모든 API 엔드포인트 완성
- [ ] 세션 기반 권한 체크
- [ ] 에러 핸들링 개선

### 우선순위 중간
- [ ] 소셜 로그인 (카카오, 구글, 네이버)
- [ ] 파일 업로드 (프로필 사진, 게시글 이미지)
- [ ] 페이지네이션
- [ ] 검색 기능 강화

### 추가 기능
- [ ] 실시간 메시징 (WebSocket)
- [ ] 알림 시스템
- [ ] 결제 연동
- [ ] 관리자 대시보드
- [ ] 모바일 앱 (React Native)

## 라이센스

MIT

## 기여

PR과 이슈는 언제나 환영합니다!
