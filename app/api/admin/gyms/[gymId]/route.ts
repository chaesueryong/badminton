import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth, logAdminAction } from '@/lib/adminAuth';

// PATCH /api/admin/gyms/[gymId] - 체육관 승인 상태 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { gymId } = params;
    const { approvalStatus } = await request.json();

    const { data, error } = await supabase
      .from('Gym')
      .update({ approval_status: approvalStatus })
      .eq('id', gymId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update gym' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      action: approvalStatus === 'approved' ? 'approve_gym' : 'reject_gym',
      targetType: 'gym',
      targetId: gymId,
      details: { approvalStatus },
    });

    return NextResponse.json({ gym: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/gyms/[gymId] - 체육관 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { gymId: string } }
) {
  try {
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { gymId } = params;

    const { error } = await supabase
      .from('Gym')
      .delete()
      .eq('id', gymId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete gym' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      action: 'delete_gym',
      targetType: 'gym',
      targetId: gymId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
