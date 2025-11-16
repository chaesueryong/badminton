import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth, logAdminAction, createNotification } from '@/lib/adminAuth';

// GET /api/admin/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    // 어드민 권한 확인
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // active, suspended, inactive
    const search = searchParams.get('search'); // 이름 또는 이메일 검색
    const role = searchParams.get('role'); // user, admin

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 쿼리 빌더
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    // 필터링
    if (status) {
      query = query.eq('status', status);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,nickname.ilike.%${search}%`);
    }

    // 정렬 및 페이징
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Fetch users error:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json({
      users: data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
