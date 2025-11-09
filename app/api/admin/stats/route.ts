import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/stats - 통계 데이터 조회
export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // admin role 확인 (새 roles 테이블 사용)
    const { data: userRoles, error: userError } = await supabase
      .from('user_roles')
      .select('role_id, roles(name)')
      .eq('user_id', session.user.id);

    if (userError || !userRoles || userRoles.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Check if user has admin or moderator role
    const hasAdminAccess = userRoles.some((ur: any) =>
      ur.roles?.name === 'admin' || ur.roles?.name === 'moderator'
    );
    if (!hasAdminAccess) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 사용자 통계
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: suspendedUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'suspended');

    // 게시글 통계
    const { count: totalPosts } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true });

    const { count: publishedPosts } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: hiddenPosts } = await supabase
      .from('Post')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'hidden');

    // 모임 통계
    const { count: totalMeetings } = await supabase
      .from('Meeting')
      .select('*', { count: 'exact', head: true });

    const { count: recruitingMeetings } = await supabase
      .from('Meeting')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'recruiting');

    // 체육관 통계
    const { count: totalGyms } = await supabase
      .from('Gym')
      .select('*', { count: 'exact', head: true });

    const { count: approvedGyms } = await supabase
      .from('Gym')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'approved');

    const { count: pendingGyms } = await supabase
      .from('Gym')
      .select('*', { count: 'exact', head: true })
      .eq('approval_status', 'pending');

    // 신고 통계
    const { count: totalReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    const { count: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: resolvedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        suspended: suspendedUsers || 0,
        inactive: (totalUsers || 0) - (activeUsers || 0) - (suspendedUsers || 0),
      },
      posts: {
        total: totalPosts || 0,
        published: publishedPosts || 0,
        hidden: hiddenPosts || 0,
      },
      meetings: {
        total: totalMeetings || 0,
        recruiting: recruitingMeetings || 0,
        closed: (totalMeetings || 0) - (recruitingMeetings || 0),
      },
      gyms: {
        total: totalGyms || 0,
        approved: approvedGyms || 0,
        pending: pendingGyms || 0,
        rejected: (totalGyms || 0) - (approvedGyms || 0) - (pendingGyms || 0),
      },
      reports: {
        total: totalReports || 0,
        pending: pendingReports || 0,
        resolved: resolvedReports || 0,
        dismissed: (totalReports || 0) - (pendingReports || 0) - (resolvedReports || 0),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
