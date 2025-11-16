import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAdminAuth, logAdminAction, createNotification } from '@/lib/adminAuth';

// PATCH /api/admin/reports/[reportId] - 신고 처리
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const supabase = await createClient();
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { reportId } = params;
    const { status, resolutionNote } = await request.json();

    const { data, error } = await supabase
      .from('reports')
      .update({
        status,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        resolution_note: resolutionNote,
      })
      .eq('id', reportId)
      .select('*, reporter:users!reporter_id(id)')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    await logAdminAction({
      adminId: user.id,
      action: 'resolve_report',
      targetType: 'report',
      targetId: reportId,
      details: { status, resolutionNote },
    });

    if (data.reporter) {
      await createNotification({
        userId: data.reporter.id,
        type: status === 'resolved' ? 'report_resolved' : 'report_dismissed',
        title: `신고가 ${status === 'resolved' ? '처리' : '기각'}되었습니다`,
        message: resolutionNote || `귀하의 신고가 ${status === 'resolved' ? '처리' : '기각'}되었습니다.`,
      });
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
