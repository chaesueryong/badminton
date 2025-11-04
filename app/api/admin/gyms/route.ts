import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAdminAuth } from '@/lib/adminAuth';

// GET /api/admin/gyms - 체육관 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { user, isAdmin } = await checkAdminAuth();
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const approvalStatus = searchParams.get('approvalStatus');
    const search = searchParams.get('search');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('Gym')
      .select('*', { count: 'exact' });

    if (approvalStatus) query = query.eq('approval_status', approvalStatus);
    if (search) query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%`);

    query = query.order('createdAt', { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 });
    }

    return NextResponse.json({
      gyms: data,
      pagination: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
