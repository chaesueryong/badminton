import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('rewards_catalog')
      .select('*')
      .eq('enabled', true)
      .order('points_cost', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by category if specified
    if (category) {
      query = query.eq('reward_type', category);
    }

    const { data: rewards, error } = await query;

    if (error) {
      console.error('Error fetching rewards:', error);
      return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
    }

    return NextResponse.json({ rewards: rewards || [] });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
