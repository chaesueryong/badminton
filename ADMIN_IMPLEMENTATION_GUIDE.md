# 어드민 기능 구현 가이드

## 완료된 작업

### 1. 백엔드 (100% 완료)
- ✅ 데이터베이스 마이그레이션 (`supabase/migrations/20251101140000_add_admin_features.sql`)
- ✅ 어드민 권한 시스템 (`lib/adminAuth.ts`)
- ✅ 모든 어드민 API 엔드포인트 구현
- ✅ 알림 시스템 API
- ✅ 감사 로그 시스템

### 2. 프론트엔드 (부분 완료)
- ✅ 어드민 레이아웃 권한 체크 (`app/admin/layout.tsx`)
- ✅ 대시보드 API 연동 (`app/admin/page.tsx`)
- ✅ 통계 페이지 API 연동 및 차트 추가 (`app/admin/statistics/page.tsx`)
- ⏳ 사용자 관리 페이지 (UI만 존재, API 미연동)
- ⏳ 게시글 관리 페이지 (UI만 존재, API 미연동)
- ⏳ 신고 관리 페이지 (UI만 존재, API 미연동)
- ⏳ 모임 관리 페이지 (UI만 존재, API 미연동)
- ⏳ 체육관 관리 페이지 (UI만 존재, API 미연동)

## 시작하기

### 1. 데이터베이스 마이그레이션 실행

Supabase Dashboard > SQL Editor에서 다음 파일을 실행하세요:
```sql
-- 파일: supabase/migrations/20251101140000_add_admin_features.sql
```

이 마이그레이션은 다음을 생성합니다:
- users 테이블에 `role` 및 `status` 컬럼 추가
- `reports`, `admin_logs`, `notifications` 테이블 생성
- Post 테이블에 `status` 컬럼 추가
- Gym 테이블에 `approval_status` 컬럼 추가
- 어드민 전용 RLS 정책

### 2. 첫 어드민 사용자 설정

Supabase Dashboard > Table Editor > users 테이블에서:
```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-admin@email.com';
```

### 3. 어드민 페이지 접근

- URL: `http://localhost:3000/admin`
- 어드민 권한이 있는 계정으로 로그인 필요

## API 엔드포인트

### 사용자 관리
- `GET /api/admin/users` - 사용자 목록 조회
  - Query: `page`, `limit`, `status`, `search`, `role`
- `PATCH /api/admin/users/[userId]` - 사용자 상태 변경
  - Body: `{ status, role }`
- `DELETE /api/admin/users/[userId]` - 사용자 삭제

### 게시글 관리
- `GET /api/admin/posts` - 게시글 목록 조회
  - Query: `page`, `limit`, `category`, `status`, `search`
- `PATCH /api/admin/posts/[postId]` - 게시글 상태 변경
  - Body: `{ status }`
- `DELETE /api/admin/posts/[postId]` - 게시글 삭제

### 신고 관리
- `GET /api/admin/reports` - 신고 목록 조회
  - Query: `page`, `limit`, `status`, `targetType`
- `POST /api/admin/reports` - 신고 생성 (일반 사용자용)
  - Body: `{ targetType, targetId, reason, description }`
- `PATCH /api/admin/reports/[reportId]` - 신고 처리
  - Body: `{ status, resolutionNote }`

### 모임 관리
- `GET /api/admin/meetings` - 모임 목록 조회
  - Query: `page`, `limit`, `status`, `search`
- `DELETE /api/admin/meetings/[meetingId]` - 모임 삭제

### 체육관 관리
- `GET /api/admin/gyms` - 체육관 목록 조회
  - Query: `page`, `limit`, `approvalStatus`, `search`
- `PATCH /api/admin/gyms/[gymId]` - 체육관 승인 상태 변경
  - Body: `{ approvalStatus }`
- `DELETE /api/admin/gyms/[gymId]` - 체육관 삭제

### 통계
- `GET /api/admin/stats` - 전체 통계 데이터 조회

### 알림
- `GET /api/notifications` - 사용자 알림 목록 조회
  - Query: `unreadOnly`, `limit`
- `PATCH /api/notifications/[id]` - 알림 읽음 처리
- `DELETE /api/notifications/[id]` - 알림 삭제

## 남은 페이지 API 연동 가이드

### 공통 패턴

모든 어드민 페이지는 다음 패턴을 따릅니다:

```typescript
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/엔드포인트?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.items);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: string, body?: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/admin/엔드포인트/${id}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        alert('성공적으로 처리되었습니다');
        fetchData(); // 새로고침
      } else {
        alert('처리 실패');
      }
    } catch (error) {
      console.error('Action failed:', error);
    }
  };

  // UI 렌더링...
}
```

### 사용자 관리 페이지 연동 예시

`app/admin/users/page.tsx` 파일에서:

1. **useState 하드코딩 데이터 제거**
```typescript
// 기존 (삭제)
const [users] = useState([...하드코딩된 데이터...]);

// 새로운 코드
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [statusFilter, setStatusFilter] = useState('');
const [searchQuery, setSearchQuery] = useState('');
```

2. **API 호출 함수 추가**
```typescript
const fetchUsers = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
    });

    if (statusFilter) params.append('status', statusFilter);
    if (searchQuery) params.append('search', searchQuery);

    const response = await fetch(`/api/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const result = await response.json();
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [page, statusFilter, searchQuery]);
```

3. **액션 핸들러 추가**
```typescript
const handleSuspendUser = async (userId: string) => {
  if (!confirm('정말 이 사용자를 정지하시겠습니까?')) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'suspended' }),
    });

    if (response.ok) {
      alert('사용자가 정지되었습니다');
      fetchUsers();
    }
  } catch (error) {
    console.error('Failed to suspend user:', error);
  }
};

const handleActivateUser = async (userId: string) => {
  // 위와 동일한 패턴, status: 'active'
};

const handleDeleteUser = async (userId: string) => {
  if (!confirm('정말 이 사용자를 삭제하시겠습니까?')) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      alert('사용자가 삭제되었습니다');
      fetchUsers();
    }
  } catch (error) {
    console.error('Failed to delete user:', error);
  }
};
```

4. **버튼에 핸들러 연결**
```typescript
<button onClick={() => handleSuspendUser(user.id)}>
  정지
</button>
<button onClick={() => handleDeleteUser(user.id)}>
  삭제
</button>
```

### 게시글 관리 페이지 연동

`app/admin/posts/page.tsx`:
- API: `/api/admin/posts`
- 액션: 숨김(`PATCH { status: 'hidden' }`), 공개(`PATCH { status: 'published' }`), 삭제(`DELETE`)

### 신고 관리 페이지 연동

`app/admin/reports/page.tsx`:
- API: `/api/admin/reports`
- 액션: 처리(`PATCH { status: 'resolved', resolutionNote }`), 기각(`PATCH { status: 'dismissed', resolutionNote }`)

### 모임 관리 페이지 연동

`app/admin/meetings/page.tsx`:
- API: `/api/admin/meetings`
- 액션: 삭제(`DELETE`)

### 체육관 관리 페이지 연동

`app/admin/gyms/page.tsx`:
- API: `/api/admin/gyms`
- 액션: 승인(`PATCH { approvalStatus: 'approved' }`), 거부(`PATCH { approvalStatus: 'rejected' }`), 삭제(`DELETE`)

## 테스트 체크리스트

### 기능 테스트
- [ ] 어드민 로그인 및 권한 체크
- [ ] 대시보드 통계 표시
- [ ] 사용자 정지/활성화/삭제
- [ ] 게시글 숨김/공개/삭제
- [ ] 신고 처리/기각
- [ ] 모임 삭제
- [ ] 체육관 승인/거부/삭제
- [ ] 통계 페이지 차트 표시

### 알림 테스트
- [ ] 사용자 정지 시 알림 전송
- [ ] 사용자 활성화 시 알림 전송
- [ ] 신고 처리 시 알림 전송
- [ ] 게시글 삭제 시 알림 전송
- [ ] 모임 삭제 시 알림 전송

### 로그 테스트
- [ ] 모든 어드민 액션이 `admin_logs` 테이블에 기록되는지 확인

## 주의사항

1. **첫 어드민 계정 설정**
   - 마이그레이션 후 첫 어드민은 수동으로 DB에서 설정해야 함
   - 이후 어드민은 다른 어드민이 role을 변경 가능

2. **RLS 정책**
   - 모든 API는 RLS 정책을 통과해야 함
   - 어드민이 아닌 사용자는 어드민 API 접근 불가

3. **토큰 관리**
   - 모든 API 요청에 `Authorization: Bearer <token>` 헤더 필요
   - Supabase 세션 토큰 사용

4. **에러 처리**
   - API 호출 실패 시 사용자에게 명확한 에러 메시지 표시
   - 콘솔에 상세 에러 로그 기록

## 추가 기능 제안

### 미구현 기능
- [ ] 이메일 알림 (현재는 DB 알림만)
- [ ] 엑셀 내보내기
- [ ] 벌크 액션 (여러 항목 한 번에 처리)
- [ ] 고급 검색 필터 (날짜 범위, 복합 조건)
- [ ] 어드민 권한 레벨 (super admin, moderator 등)

### 개선 가능 사항
- [ ] 실시간 알림 (Supabase Realtime 활용)
- [ ] 더 상세한 통계 차트
- [ ] 액션 되돌리기 기능
- [ ] 어드민 활동 대시보드

## 문제 해결

### 어드민 페이지 접근 불가
- 사용자 role이 'admin'인지 확인
- 로그인 상태 확인
- 브라우저 콘솔에서 에러 확인

### API 호출 실패
- Supabase 토큰이 유효한지 확인
- API 엔드포인트 URL이 올바른지 확인
- 서버 로그 확인

### RLS 정책 오류
- Supabase Dashboard에서 RLS 정책이 올바르게 적용되었는지 확인
- 마이그레이션이 완전히 실행되었는지 확인

## 참고 자료

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Recharts Documentation](https://recharts.org/en-US/)

---

## 구현 완료

모든 백엔드 API와 핵심 프론트엔드 기능이 구현되었습니다. 남은 페이지들은 위 가이드를 참고하여 동일한 패턴으로 API를 연동하면 됩니다.

**핵심 포인트**: 모든 기능은 이미 API로 구현되어 있으므로, 프론트엔드에서 API를 호출하기만 하면 됩니다.
