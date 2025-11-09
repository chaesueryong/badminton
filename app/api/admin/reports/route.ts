import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/adminAuth';

// GET /api/admin/reports - 신고 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('reports')
      .select('*, reporter:users!reporter_id(name, email)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (targetType) query = query.eq('target_type', targetType);

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({
      reports: data,
      pagination: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/reports - 신고 생성 (사용자용)
export async function POST(request: NextRequest) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reason, description } = body;

    const { data, error } = await (supabase as any)
      .from('reports')
      .insert({
        target_type: targetType,
        target_id: targetId,
        reporter_id: session.user.id,
        reason,
        description,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ report: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
