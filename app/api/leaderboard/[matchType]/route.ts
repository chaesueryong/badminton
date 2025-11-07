import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/leaderboard/[matchType] - Get leaderboard for specific match type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchType: string }> }
) {
  try {
    const supabase = await createClient();
    const { matchType } = await params;
    const searchParams = request.nextUrl.searchParams;

    const region = searchParams.get('region');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate match type
    if (!['MS', 'WS', 'MD', 'WD', 'XD', 'ALL'].includes(matchType)) {
      return NextResponse.json(
        { error: 'Invalid match type. Must be MS, WS, MD, WD, XD, or ALL' },
        { status: 400 }
      );
    }

    let ratingColumn: string;
    let gamesColumn: string;
    let winsColumn: string;

    if (matchType === 'ALL') {
      // For ALL, we'll sort by rating_ms as default and sort in memory later
      ratingColumn = 'rating_ms';
      gamesColumn = 'games_ms';
      winsColumn = 'wins_ms';
    } else {
      const typeMap: Record<string, { rating: string; games: string; wins: string }> = {
        MS: { rating: 'rating_ms', games: 'games_ms', wins: 'wins_ms' },
        WS: { rating: 'rating_ws', games: 'games_ws', wins: 'wins_ws' },
        MD: { rating: 'rating_md', games: 'games_md', wins: 'wins_md' },
        WD: { rating: 'rating_wd', games: 'games_wd', wins: 'wins_wd' },
        XD: { rating: 'rating_xd', games: 'games_xd', wins: 'wins_xd' }
      };

      const columns = typeMap[matchType];
      ratingColumn = columns.rating;
      gamesColumn = columns.games;
      winsColumn = columns.wins;
    }

    // Build query
    let query = supabase
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
      `);

    // Filter by region if specified
    if (region) {
      query = query.eq('region', region);
    }

    // Only include users who have played at least one game in ANY category
    // For ALL: games_ms + games_ws + games_md + games_wd + games_xd > 0
    // For specific type: games_XX > 0
    if (matchType !== 'ALL') {
      query = query.gt(gamesColumn, 0);
    }

    // For ALL type, we need to fetch all and filter/sort in memory
    // because PostgREST doesn't support GREATEST() in order
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Filter users who have played at least one game
    let filteredData = data || [];

    if (matchType === 'ALL') {
      // Filter users who have played at least one game in any category
      filteredData = filteredData.filter(user =>
        (user.games_ms + user.games_ws + user.games_md + user.games_wd + user.games_xd) > 0
      );

      // Sort by highest rating across all categories
      filteredData = filteredData.sort((a, b) => {
        const maxRatingA = Math.max(a.rating_ms || 1500, a.rating_ws || 1500, a.rating_md || 1500, a.rating_wd || 1500, a.rating_xd || 1500);
        const maxRatingB = Math.max(b.rating_ms || 1500, b.rating_ws || 1500, b.rating_md || 1500, b.rating_wd || 1500, b.rating_xd || 1500);
        return maxRatingB - maxRatingA; // Descending order
      });
    } else {
      // For specific match types, already filtered by query
      // Just sort by that type's rating
      filteredData = filteredData.sort((a, b) => {
        const typeKey = matchType.toLowerCase();
        const ratingA = (a as any)[`rating_${typeKey}`] || 1500;
        const ratingB = (b as any)[`rating_${typeKey}`] || 1500;
        return ratingB - ratingA; // Descending order
      });
    }

    // Apply pagination after sorting
    const paginatedData = filteredData.slice(offset, offset + limit);

    // Calculate additional stats
    const leaderboard = paginatedData?.map((user, index) => {
      let rating: number;
      let games: number;
      let wins: number;
      let peakRating: number;

      if (matchType === 'ALL') {
        rating = Math.max(
          user.rating_ms,
          user.rating_ws,
          user.rating_md,
          user.rating_wd,
          user.rating_xd
        );
        games = user.games_ms + user.games_ws + user.games_md + user.games_wd + user.games_xd;
        wins = user.wins_ms + user.wins_ws + user.wins_md + user.wins_wd + user.wins_xd;
        peakRating = Math.max(
          user.peak_rating_ms,
          user.peak_rating_ws,
          user.peak_rating_md,
          user.peak_rating_wd,
          user.peak_rating_xd
        );
      } else {
        const typeKey = matchType.toLowerCase();
        rating = (user as any)[`rating_${typeKey}`];
        games = (user as any)[`games_${typeKey}`];
        wins = (user as any)[`wins_${typeKey}`];
        peakRating = (user as any)[`peak_rating_${typeKey}`];
      }

      const winRate = games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';

      return {
        rank: offset + index + 1,
        userId: user.id,
        name: user.name,
        nickname: user.nickname,
        profileImage: user.profileImage,
        gender: user.gender,
        region: user.region,
        level: user.level,
        rating,
        peakRating,
        gamesPlayed: games,
        wins,
        losses: games - wins,
        winRate: parseFloat(winRate),
        // Include all ratings for reference
        ratings: {
          ms: user.rating_ms,
          ws: user.rating_ws,
          md: user.rating_md,
          wd: user.rating_wd,
          xd: user.rating_xd
        }
      };
    });

    return NextResponse.json({
      matchType,
      region: region || 'all',
      total: filteredData?.length || 0,
      limit,
      offset,
      leaderboard: leaderboard || []
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboard/[matchType]:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
