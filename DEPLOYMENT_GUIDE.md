# 🚀 배드메이트 배포 가이드

배포 및 운영에 필요한 모든 설정을 정리한 문서입니다.

## 📋 목차
1. [GitHub Actions 자동 배포](#1-github-actions-자동-배포)
2. [수동 배포](#2-수동-배포)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [Docker 운영](#4-docker-운영)
5. [트러블슈팅](#5-트러블슈팅)
6. [Supabase 설정](#6-supabase-설정)
7. [검색 엔진 등록](#7-검색-엔진-등록)
6. [모니터링 설정](#6-모니터링-설정)

---

## 1. 환경 변수 설정

### ✅ Vercel/배포 플랫폼 환경 변수 설정

배포 플랫폼(Vercel 등)의 환경 변수 설정 페이지에서 다음을 추가:

```bash
# 필수 환경 변수
NEXT_PUBLIC_SITE_URL=https://badmate.club
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# NextAuth (사용 중이라면)
NEXTAUTH_URL=https://badmate.club
NEXTAUTH_SECRET=your-nextauth-secret

# Toss Payments (결제 기능 사용 시)
TOSS_SECRET_KEY=your-toss-secret-key
```

### 📝 체크리스트
- [ ] `NEXT_PUBLIC_SITE_URL`을 `https://badmate.club`으로 설정
- [ ] Supabase URL과 키 설정
- [ ] NextAuth 시크릿 설정
- [ ] 배포 후 환경 변수 적용 확인

---

## 2. 이미지 파일 준비

### ✅ 필요한 이미지 파일들

다음 경로에 이미지 파일들을 추가해야 합니다:

```
/public/
├── og-image.jpg          # 1200x630px (Open Graph용)
├── logo.png              # 로고 이미지
├── favicon.ico           # 16x16, 32x32px
├── apple-touch-icon.png  # 180x180px
├── icon-192x192.png      # 192x192px (PWA)
└── icon-512x512.png      # 512x512px (PWA)
```

### 📐 이미지 규격

| 파일명 | 크기 | 용도 |
|--------|------|------|
| `og-image.jpg` | 1200×630px | 소셜 미디어 공유 |
| `logo.png` | 512×512px | 로고 |
| `favicon.ico` | 16×16, 32×32px | 브라우저 탭 아이콘 |
| `apple-touch-icon.png` | 180×180px | iOS 홈 화면 아이콘 |
| `icon-192x192.png` | 192×192px | Android 아이콘 |
| `icon-512x512.png` | 512×512px | Android 고해상도 아이콘 |

### 💡 이미지 생성 도구
- [Canva](https://www.canva.com) - 무료 디자인 도구
- [Figma](https://www.figma.com) - 프로페셔널 디자인 도구
- [Favicon Generator](https://favicon.io) - 파비콘 생성

### 📝 체크리스트
- [ ] og-image.jpg 생성 및 추가
- [ ] 로고 파일 생성 및 추가
- [ ] 파비콘 생성 및 추가
- [ ] PWA 아이콘 생성 및 추가
- [ ] 이미지 최적화 (압축)

---

## 3. Supabase 설정

### ✅ OAuth 리다이렉트 URL 설정

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Authentication → URL Configuration**
   ```
   Site URL: https://badmate.club

   Redirect URLs:
   - https://badmate.club/auth/callback
   - http://localhost:3000/auth/callback (개발용)
   ```

3. **소셜 로그인 제공자 설정**

   #### Google OAuth
   - [ ] Google Cloud Console에서 OAuth 클라이언트 ID 생성
   - [ ] 승인된 리디렉션 URI에 `https://badmate.club/auth/callback` 추가
   - [ ] Supabase에 Client ID, Client Secret 입력

   #### Kakao OAuth
   - [ ] Kakao Developers에서 앱 생성
   - [ ] Redirect URI에 `https://badmate.club/auth/callback` 추가
   - [ ] Supabase에 REST API Key, Client Secret 입력

### 📝 체크리스트
- [ ] Site URL 설정
- [ ] Redirect URLs 추가
- [ ] Google OAuth 설정
- [ ] Kakao OAuth 설정
- [ ] 로그인 테스트

---

## 4. 검색 엔진 등록

### ✅ Google Search Console

1. **사이트 등록**
   - https://search.google.com/search-console 접속
   - "속성 추가" 클릭
   - URL: `https://badmate.club` 입력

2. **소유권 확인**
   - HTML 태그 방법 또는 DNS 레코드 방법 선택
   - 확인 코드를 `app/layout.tsx`의 `verification.google`에 추가
   ```typescript
   verification: {
     google: "여기에-구글-확인-코드-입력",
   }
   ```

3. **Sitemap 제출**
   - 좌측 메뉴 "Sitemaps" 클릭
   - `https://badmate.club/sitemap.xml` 입력 후 제출

### ✅ Naver 웹마스터 도구

1. **사이트 등록**
   - https://searchadvisor.naver.com 접속
   - "웹마스터 도구" → "사이트 등록"
   - URL: `https://badmate.club` 입력

2. **소유권 확인**
   - HTML 태그 확인 선택
   - 확인 코드를 `app/layout.tsx`의 `verification.other`에 추가
   ```typescript
   verification: {
     google: "구글-확인-코드",
     other: {
       "naver-site-verification": "여기에-네이버-확인-코드-입력",
     },
   }
   ```

3. **사이트맵 제출**
   - "요청" → "사이트맵 제출"
   - `https://badmate.club/sitemap.xml` 입력

### 📝 체크리스트
- [ ] Google Search Console 등록
- [ ] Google 소유권 확인
- [ ] Google Sitemap 제출
- [ ] Naver 웹마스터 등록
- [ ] Naver 소유권 확인
- [ ] Naver 사이트맵 제출

---

## 5. SEO 검증

### ✅ 필수 검증 항목

#### 메타 태그 확인
```bash
# 브라우저에서 F12 → Elements 탭에서 확인
<meta name="description" content="...">
<meta property="og:title" content="...">
<meta property="og:image" content="...">
```

#### 사이트맵 확인
- 브라우저에서 `https://badmate.club/sitemap.xml` 접속
- 페이지 목록이 정상적으로 표시되는지 확인

#### robots.txt 확인
- 브라우저에서 `https://badmate.club/robots.txt` 접속
- 크롤러 규칙이 정상적으로 표시되는지 확인

### ✅ 온라인 도구로 검증

1. **구조화된 데이터 테스트**
   - https://search.google.com/test/rich-results
   - URL 입력 후 테스트
   - JSON-LD 스키마가 올바르게 인식되는지 확인

2. **Open Graph 미리보기**
   - https://www.opengraph.xyz
   - URL 입력 후 미리보기 확인
   - 이미지, 제목, 설명이 올바른지 확인

3. **페이지 속도 테스트**
   - https://pagespeed.web.dev
   - 모바일/데스크톱 성능 점수 확인
   - Core Web Vitals 지표 확인

### 📝 체크리스트
- [ ] 메타 태그 정상 확인
- [ ] sitemap.xml 접근 가능
- [ ] robots.txt 접근 가능
- [ ] 구조화된 데이터 테스트 통과
- [ ] Open Graph 미리보기 정상
- [ ] 페이지 속도 90점 이상

---

## 6. 모니터링 설정

### ✅ Google Analytics (선택사항)

1. **Google Analytics 계정 생성**
   - https://analytics.google.com
   - 새 속성 만들기

2. **측정 ID 받기**
   - 데이터 스트림 생성
   - 측정 ID (G-XXXXXXXXXX) 복사

3. **Next.js에 GA 추가**
   ```typescript
   // app/layout.tsx에 추가
   <Script
     src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
     strategy="afterInteractive"
   />
   <Script id="google-analytics" strategy="afterInteractive">
     {`
       window.dataLayer = window.dataLayer || [];
       function gtag(){dataLayer.push(arguments);}
       gtag('js', new Date());
       gtag('config', 'G-XXXXXXXXXX');
     `}
   </Script>
   ```

### ✅ 에러 모니터링 (선택사항)

**Sentry 설정**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 📝 체크리스트
- [ ] Google Analytics 설정
- [ ] 방문자 추적 확인
- [ ] 에러 모니터링 설정 (선택)

---

## 🎯 최종 확인 사항

### 배포 전 체크리스트
- [ ] 모든 환경 변수 설정 완료
- [ ] 이미지 파일 모두 준비
- [ ] Supabase OAuth 설정 완료
- [ ] 로그인 기능 테스트 완료

### 배포 후 체크리스트
- [ ] https://badmate.club 접속 확인
- [ ] 소셜 로그인 테스트
- [ ] 모든 페이지 정상 작동 확인
- [ ] 모바일 화면 확인
- [ ] Search Console 등록
- [ ] Naver 웹마스터 등록

---

## 📞 문제 해결

### 자주 발생하는 문제

#### 1. 소셜 로그인 실패
**원인:** Redirect URI 불일치
**해결:** Supabase와 OAuth 제공자(Google, Kakao)의 Redirect URI가 정확히 일치하는지 확인

#### 2. 환경 변수가 적용되지 않음
**원인:** 배포 후 재빌드 필요
**해결:** Vercel에서 "Redeploy" 클릭

#### 3. 이미지가 표시되지 않음
**원인:** 파일 경로 오류
**해결:** `/public/` 폴더에 파일이 있는지 확인, 파일명 대소문자 확인

#### 4. sitemap.xml 404 에러
**원인:** 빌드 오류
**해결:** `npm run build` 실행 후 에러 확인, `app/sitemap.ts` 문법 확인

---

## 📚 추가 리소스

- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Supabase 인증 가이드](https://supabase.com/docs/guides/auth)
- [Google Search Console 도움말](https://support.google.com/webmasters)
- [Naver 웹마스터 가이드](https://searchadvisor.naver.com/guide)

---

## ✅ 완료 후

모든 작업이 완료되면 이 파일을 업데이트하여 날짜를 기록하세요.

```
배포 완료 날짜: YYYY-MM-DD
마지막 업데이트: YYYY-MM-DD
담당자:
```

---

**문서 버전:** 1.0
**마지막 수정:** 2025-01-XX
**작성자:** Claude (AI Assistant)
