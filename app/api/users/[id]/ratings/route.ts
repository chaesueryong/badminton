import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/[id]/ratings - Get user's rating statistics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: userId } = params;

    // Get user's rating data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        name,
        nickname,
        profileImage,
        gender,
        region,
        level,
        rating_ms,
        rating_ws,
        rating_md,
        rating_wd,
        rating_xd,
        peak_rating_ms,
        peak_rating_ws,
        peak_rating_md,
        peak_rating_wd,
        peak_rating_xd,
        games_ms,
        games_ws,
        games_md,
        games_wd,
        games_xd,
        wins_ms,
        wins_ws,
        wins_md,
        wins_wd,
        wins_xd
      `)
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get rating history
    const { data: history, error: historyError } = await supabase
      .from('rating_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('Error fetching rating history:', historyError);
    }

    // Calculate stats for each match type
    const matchTypes = ['ms', 'ws', 'md', 'wd', 'xd'];
    const stats = matchTypes.map(type => {
      const rating = (user as any)[`rating_${type}`];
      const peakRating = (user as any)[`peak_rating_${type}`];
      const games = (user as any)[`games_${type}`];
      const wins = (user as any)[`wins_${type}`];
      const losses = games - wins;
      const winRate = games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';

      return {
        matchType: type.toUpperCase(),
        rating,
        peakRating,
        gamesPlayed: games,
        wins,
        losses,
        winRate: parseFloat(winRate)
      };
    });

    // Calculate overall stats
    const totalGames = user.games_ms + user.games_ws + user.games_md + user.games_wd + user.games_xd;
    const totalWins = user.wins_ms + user.wins_ws + user.wins_md + user.wins_wd + user.wins_xd;
    const totalLosses = totalGames - totalWins;
    const overallWinRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';
    const highestRating = Math.max(user.rating_ms, user.rating_ws, user.rating_md, user.rating_wd, user.rating_xd);
    const highestPeakRating = Math.max(
      user.peak_rating_ms,
      user.peak_rating_ws,
      user.peak_rating_md,
      user.peak_rating_wd,
      user.peak_rating_xd
    );

    // Group history by match type
    const historyByType = history?.reduce((acc: any, record: any) => {
      const type = record.match_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(record);
      return acc;
    }, {});

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        nickname: user.nickname,
        profileImage: user.profileImage,
        gender: user.gender,
        region: user.region,
        level: user.level
      },
      overall: {
        highestRating,
        highestPeakRating,
        totalGames,
        totalWins,
        totalLosses,
        winRate: parseFloat(overallWinRate)
      },
      byMatchType: stats,
      recentHistory: history || [],
      historyByType: historyByType || {}
    });
  } catch (error) {
    console.error('Error in GET /api/users/[id]/ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
