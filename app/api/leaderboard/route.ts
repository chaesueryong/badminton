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

    // Fetch from users table
    let query = supabase
      .from('users')
      .select('id, nickname, profileImage, region, level, rating, totalGames, wins')
      .order('rating', { ascending: false })
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

    // 승률 계산 및 필드 매핑
    const formattedLeaderboard = (leaderboard || []).map((entry, index) => ({
      ...entry,
      win_rate: entry.totalGames > 0 ? (entry.wins / entry.totalGames) * 100 : 0,
      rank: offset + index + 1,
      elo_rating: entry.rating || 1500,
      games_played: entry.totalGames || 0,
      losses: (entry.totalGames || 0) - (entry.wins || 0),
      draws: 0,
    }));

    return NextResponse.json({ leaderboard: formattedLeaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
