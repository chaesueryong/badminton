import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth, logAdminAction, createNotification } from '@/lib/adminAuth';

// DELETE /api/admin/meetings/[meetingId] - 모임 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { meetingId: string } }
) {
  try {
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { meetingId } = params;

    // 모임 정보 조회
    const { data: meeting } = await supabase
      .from('Meeting')
      .select('hostId, title')
      .eq('id', meetingId)
      .single();

    // 모임 삭제
    const { error } = await supabase
      .from('Meeting')
      .delete()
      .eq('id', meetingId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete meeting' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      action: 'delete_meeting',
      targetType: 'meeting',
      targetId: meetingId,
    });

    // 호스트에게 알림
    if (meeting) {
      await createNotification({
        userId: meeting.hostId,
        type: 'meeting_cancelled',
        title: '모임이 삭제되었습니다',
        message: `귀하의 모임 "${meeting.title}"이(가) 관리자에 의해 삭제되었습니다.`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
