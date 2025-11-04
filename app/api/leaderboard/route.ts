import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch from leaderboard view
    let query = supabase
      .from('leaderboard')
      .select('*')
      .order('elo_rating', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by region if specified
    if (region) {
      query = query.eq('region', region);
    }

    const { data: leaderboard, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
