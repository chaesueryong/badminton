# 레이팅 시스템 접근성 개선

## 개요

레이팅 시스템(매치, 초대, 레이팅 리더보드)에 대한 모바일 및 웹 접근성을 대폭 개선했습니다.

## 주요 변경사항

### 1. 데스크톱 네비게이션 개선

**위치**: [components/Navbar.tsx](components/Navbar.tsx:149-169)

- **"랭킹" → "레이팅"으로 이름 변경**: 더 직관적인 이름 사용
- **위치 변경**: 커뮤니티 바로 다음으로 이동하여 더 눈에 띄게 배치
- **활성 상태 개선**: `/ratings` 및 `/matches`로 시작하는 모든 경로에서 활성화 표시

```typescript
<Link href="/ratings"
  className={`... ${pathname?.startsWith('/ratings') || pathname?.startsWith('/matches') ? 'active' : ''}`}
>
  <Trophy /> 레이팅
</Link>
```

### 2. 모바일 하단 네비게이션 재구성

**위치**: [components/Navbar.tsx](components/Navbar.tsx:287-350)

#### 변경 전 (5개 탭)
- 홈
- 내모임
- **매칭** ⬅️ 사용 빈도 낮음
- 커뮤니티
- 프로필

#### 변경 후 (5개 탭)
- 홈
- 내모임
- **레이팅** ⬅️ 새로 추가! (핵심 기능)
- 커뮤니티
- **더보기** ⬅️ 프로필 대체, 더 많은 기능 접근

**레이팅 탭 활성화 조건**:
- `/ratings` - 레이팅 리더보드
- `/matches` - 매치 생성, 매치 상세, 매치 기록
- `/invitations` - 초대 관리

```typescript
<Link href="/ratings"
  className={`${pathname?.startsWith('/ratings') || pathname?.startsWith('/matches') || pathname?.startsWith('/invitations') ? 'active' : ''}`}
>
  <Trophy /> 레이팅
</Link>
```

### 3. 모바일 "더보기" 메뉴 추가

**위치**: [components/Navbar.tsx](components/Navbar.tsx:352-444)

프로필을 5번째 탭에서 더보기 메뉴 버튼으로 교체하여 더 많은 기능에 빠르게 접근할 수 있도록 개선:

#### 더보기 메뉴 항목
1. **매치 생성** (`/matches/create`) - 새 매치 만들기
2. **매치 초대** (`/invitations`) - 초대 관리
3. **매칭** (`/matching`) - 기존 매칭 기능
4. **리워드** (`/rewards`) - 포인트 획득
5. **상점** (`/shop`) - 깃털 구매
6. **로그아웃** - 로그아웃 버튼

**특징**:
- 화면 하단에서 올라오는 모달 형태
- 배경 딤 처리로 포커스 집중
- 각 항목 클릭 시 자동으로 메뉴 닫힘

### 4. 플로팅 액션 버튼 (FAB)

**파일**: [components/FloatingActionButton.tsx](components/FloatingActionButton.tsx)

#### 기능
- **위치**: 화면 우측 하단 고정
- **목적**: 빠른 매치 생성 접근
- **표시 조건**: 레이팅 관련 페이지에서만 표시
  - `/ratings` - 레이팅 리더보드
  - `/matches` - 매치 관련 페이지
  - `/invitations` - 초대 관리

#### 디자인
- 그라데이션 파란색 원형 버튼
- Plus 아이콘
- 호버 시 "매치 생성" 툴팁 표시
- 모바일: 하단 네비게이션 위에 위치 (bottom: 20)
- 데스크톱: 우측 하단 (bottom: 8, right: 8)

```typescript
export default function FloatingActionButton() {
  const pathname = usePathname();
  const showOnPages = ['/ratings', '/matches', '/invitations'];
  const shouldShow = showOnPages.some(page => pathname?.startsWith(page));

  if (!shouldShow) return null;

  return (
    <Link href="/matches/create" className="fixed bottom-20 right-4 md:bottom-8 md:right-8 ...">
      <Plus /> + 툴팁
    </Link>
  );
}
```

#### 적용된 페이지
- [app/ratings/page.tsx](app/ratings/page.tsx:254) - 레이팅 리더보드
- [app/invitations/page.tsx](app/invitations/page.tsx:353) - 초대 관리
- [app/matches/history/[id]/page.tsx](app/matches/history/[id]/page.tsx:393) - 매치 기록

### 5. URL 구조 통일

**변경사항**: 동적 라우트 파라미터 이름 통일

#### 문제점
- Next.js는 같은 레벨에서 다른 동적 파라미터 이름을 허용하지 않음
- 기존: `app/api/users/[userId]` vs `app/api/users/[id]`
- 기존: `app/matches/history/[userId]` vs `app/profile/[id]`

#### 해결방법
모든 사용자 ID 파라미터를 `[id]`로 통일:

**변경된 파일**:
1. `app/api/users/[userId]/matches` → `app/api/users/[id]/matches`
   - [route.ts](app/api/users/[id]/matches/route.ts:4-11) - 파라미터명 변경

2. `app/matches/history/[userId]` → `app/matches/history/[id]`
   - [page.tsx](app/matches/history/[id]/page.tsx:70-76) - 파라미터명 변경

**코드 예시**:
```typescript
// Before
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
}

// After
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params; // 내부적으로는 userId로 사용
}
```

## 사용자 흐름 개선

### 모바일 사용자 흐름

#### 1. 레이팅 확인 → 매치 생성
```
1. 하단 네비게이션에서 "레이팅" 탭 클릭
2. 레이팅 리더보드 확인
3. 우측 하단 FAB 클릭 → 매치 생성 페이지로 이동
```

#### 2. 초대 관리 → 초대 수락 → 매치 상세
```
1. 하단 네비게이션에서 "레이팅" 탭 클릭 (초대 알림 확인)
2. 또는 "더보기" → "매치 초대" 클릭
3. 초대 목록에서 초대 수락
4. 매치 상세 페이지로 자동 이동
```

#### 3. 빠른 매치 생성
```
1. 하단 네비게이션에서 "더보기" 탭 클릭
2. "매치 생성" 클릭
3. 매치 정보 입력 및 플레이어 초대
```

### 데스크톱 사용자 흐름

#### 1. 레이팅 확인 및 매치 생성
```
1. 상단 네비게이션에서 "레이팅" 클릭
2. 리더보드 확인
3. 우측 하단 FAB 클릭 → 매치 생성
```

#### 2. 초대 관리
```
1. 상단 네비게이션에서 "레이팅" 클릭
2. 우측 상단 알림 아이콘에서 초대 확인
3. 또는 직접 /invitations로 이동
```

## 성능 최적화

### 1. 조건부 렌더링
- FAB는 필요한 페이지에서만 렌더링
- pathname 기반으로 효율적인 조건 체크

### 2. 이벤트 핸들링
- 더보기 메뉴: 배경 클릭 시 자동 닫힘
- 각 메뉴 항목 클릭 시 메뉴 상태 업데이트

### 3. 스타일 최적화
- Tailwind CSS 유틸리티 클래스 사용
- 호버/액티브 상태 transition 적용
- 모바일 전용 스타일 분리 (md: breakpoint)

## 접근성 (A11y)

### 1. ARIA 속성
- FAB에 `aria-label="매치 생성"` 추가
- 버튼 역할 명확화

### 2. 키보드 네비게이션
- 모든 인터랙티브 요소 Tab으로 접근 가능
- Enter/Space로 활성화

### 3. 시각적 피드백
- 활성 상태 명확한 색상 변화 (파란색)
- 호버 상태 시각적 피드백
- 로딩 상태 표시

### 4. 터치 친화적 디자인
- 버튼 최소 크기 준수 (44x44px)
- 충분한 터치 영역
- 스와이프 제스처 고려

## 반응형 디자인

### 모바일 (< 768px)
- 하단 네비게이션: 5개 탭
- FAB 위치: `bottom-20 right-4`
- 더보기 메뉴: 전체 화면 너비

### 데스크톱 (≥ 768px)
- 상단 네비게이션: 수평 메뉴
- FAB 위치: `bottom-8 right-8`
- 더보기 메뉴: 숨김 (필요 없음)

## 테스트 체크리스트

### 기능 테스트
- [x] 모바일 하단 네비게이션 "레이팅" 탭 작동
- [x] 모바일 "더보기" 메뉴 열기/닫기
- [x] FAB 클릭 시 매치 생성 페이지 이동
- [x] 데스크톱 "레이팅" 메뉴 작동
- [x] URL 파라미터 통일로 라우팅 정상 작동

### 시각적 테스트
- [ ] 모든 화면 크기에서 레이아웃 확인
- [ ] 활성 상태 스타일 확인
- [ ] 호버 효과 확인
- [ ] FAB 툴팁 표시 확인

### 접근성 테스트
- [ ] 키보드만으로 모든 기능 접근 가능
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 충분성 확인

## 향후 개선 사항

1. **알림 배지**
   - 초대 알림 개수를 "레이팅" 탭에 배지로 표시
   - 새 매치 결과 알림

2. **제스처 네비게이션**
   - 스와이프로 탭 전환
   - 풀 다운으로 새로고침

3. **오프라인 지원**
   - 매치 기록 캐싱
   - 네트워크 오류 처리 개선

4. **애니메이션**
   - 더보기 메뉴 슬라이드 업 애니메이션
   - FAB 펄스 효과

5. **개인화**
   - 자주 사용하는 기능 바로가기
   - 사용자별 네비게이션 순서 커스터마이징

## 관련 문서

- [MATCH_HISTORY.md](MATCH_HISTORY.md) - 매치 기록 시스템
- [RATING_SYSTEM.md](docs/RATING_SYSTEM.md) - 레이팅 시스템 (만약 존재한다면)

## 기술 스택

- **Next.js 14**: App Router, Server Components
- **React 18**: Client Components, Hooks
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **Lucide React**: 아이콘 라이브러리
- **TypeScript**: 타입 안정성

## 결론

이번 개선으로 레이팅 시스템의 모바일 및 웹 접근성이 크게 향상되었습니다:

✅ **모바일**: 하단 네비게이션에 "레이팅" 탭 추가 (1탭으로 즉시 접근)
✅ **데스크톱**: 상단 네비게이션에 "레이팅" 메뉴 추가
✅ **FAB**: 레이팅 관련 페이지에서 빠른 매치 생성
✅ **더보기 메뉴**: 매치 생성, 초대 관리 등 추가 기능 접근
✅ **URL 통일**: 모든 동적 라우트 파라미터 표준화

사용자는 이제 2-3번의 탭/클릭만으로 레이팅 시스템의 모든 기능에 접근할 수 있습니다!
