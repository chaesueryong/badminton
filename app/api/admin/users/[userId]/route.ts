import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth, logAdminAction, createNotification } from '@/lib/adminAuth';

// PATCH /api/admin/users/[userId] - 사용자 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    // 어드민 권한 확인
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = params;
    const body = await request.json();
    const { status, role } = body;

    // 업데이트할 데이터
    const updates: any = {};
    if (status) updates.status = status;
    if (role) updates.role = role;

    // 사용자 상태 업데이트
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update user error:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // 어드민 로그 기록
    await logAdminAction({
      adminId: user.id,
      action: status === 'suspended' ? 'suspend_user' : 'update_user_status',
      targetType: 'user',
      targetId: userId,
      details: { oldStatus: data.status, newStatus: status, role },
    });

    // 사용자에게 알림 전송
    if (status === 'suspended') {
      await createNotification({
        userId,
        type: 'account_suspended',
        title: '계정이 정지되었습니다',
        message: '귀하의 계정이 관리자에 의해 정지되었습니다. 문의사항이 있으시면 고객센터로 연락주세요.',
      });
    } else if (status === 'active') {
      await createNotification({
        userId,
        type: 'account_activated',
        title: '계정이 활성화되었습니다',
        message: '귀하의 계정이 다시 활성화되었습니다.',
      });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('Patch user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[userId] - 사용자 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient();
    // 어드민 권한 확인
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = params;

    // 자기 자신은 삭제할 수 없음
    if (user.id === userId) {
      return NextResponse.json({ error: 'Cannot delete own account' }, { status: 400 });
    }

    // 사용자 삭제
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Delete user error:', error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // 어드민 로그 기록
    await logAdminAction({
      adminId: user.id,
      action: 'delete_user',
      targetType: 'user',
      targetId: userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
