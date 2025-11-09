import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/users/[id]/matches - Get user's match history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { id: userId } = params;

    // Get current user - this is REQUIRED to maintain session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const matchType = searchParams.get('matchType'); // Filter by match type
    const status = searchParams.get('status'); // Filter by status
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's match participations
    let query = supabase
      .from('match_participants')
      .select(`
        id,
        team,
        entry_fee_points_paid,
        entry_fee_feathers_paid,
        rating_before,
        rating_after,
        rating_change,
        points_earned,
        created_at,
        session:match_sessions!inner(
          id,
          match_type,
          status,
          result,
          team1_score,
          team2_score,
          location,
          session_date,
          completed_at,
          participants:match_participants(
            id,
            team,
            rating_before,
            rating_after,
            rating_change,
            user:users(
              id,
              name,
              nickname,
              profileImage,
              gender
            )
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (matchType) {
      query = query.eq('session.match_type', matchType);
    }

    if (status) {
      query = query.eq('session.status', status);
    }

    const { data: participations, error } = await query;

    if (error) {
      console.error('Error fetching match history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch match history' },
        { status: 500 }
      );
    }

    // Process and enrich match data
    const matches = participations?.map((participation: any) => {
      const session = participation.session;
      const userTeam = participation.team;

      // Determine if user won
      let isWinner = false;
      if (session.result) {
        if (session.match_type === 'MS' || session.match_type === 'WS') {
          isWinner = (session.result === 'PLAYER1_WIN' && userTeam === 1) ||
                     (session.result === 'PLAYER2_WIN' && userTeam === 2);
        } else {
          isWinner = (session.result === 'TEAM1_WIN' && userTeam === 1) ||
                     (session.result === 'TEAM2_WIN' && userTeam === 2);
        }
      }

      // Get teammates and opponents
      const teammates = session.participants?.filter(
        (p: any) => p.team === userTeam && p.user.id !== userId
      );
      const opponents = session.participants?.filter(
        (p: any) => p.team !== userTeam
      );

      return {
        id: session.id,
        matchType: session.match_type,
        status: session.status,
        result: session.result,
        team: userTeam,
        isWinner,
        score: {
          team1: session.team1_score,
          team2: session.team2_score,
          userTeam: userTeam === 1 ? session.team1_score : session.team2_score,
          opponentTeam: userTeam === 1 ? session.team2_score : session.team1_score
        },
        rating: {
          before: participation.rating_before,
          after: participation.rating_after,
          change: participation.rating_change
        },
        entryFee: {
          points: participation.entry_fee_points_paid,
          feathers: participation.entry_fee_feathers_paid
        },
        pointsEarned: participation.points_earned,
        location: session.location,
        sessionDate: session.session_date,
        completedAt: session.completed_at,
        teammates: teammates?.map((p: any) => ({
          id: p.user.id,
          name: p.user.name,
          nickname: p.user.nickname,
          profileImage: p.user.profileImage,
          ratingBefore: p.rating_before,
          ratingAfter: p.rating_after,
          ratingChange: p.rating_change
        })) || [],
        opponents: opponents?.map((p: any) => ({
          id: p.user.id,
          name: p.user.name,
          nickname: p.user.nickname,
          profileImage: p.user.profileImage,
          ratingBefore: p.rating_before,
          ratingAfter: p.rating_after,
          ratingChange: p.rating_change
        })) || []
      };
    });

    // Calculate statistics
    const stats = {
      totalMatches: matches?.length || 0,
      completed: matches?.filter((m: any) => m.status === 'COMPLETED').length || 0,
      wins: matches?.filter((m: any) => m.isWinner && m.status === 'COMPLETED').length || 0,
      losses: matches?.filter((m: any) => !m.isWinner && m.status === 'COMPLETED').length || 0,
      totalRatingGained: matches?.reduce((sum: number, m: any) => sum + (m.rating.change || 0), 0) || 0,
      totalPointsEarned: matches?.reduce((sum: number, m: any) => sum + (m.pointsEarned || 0), 0) || 0
    };

    return NextResponse.json({
      matches: matches || [],
      stats,
      pagination: {
        limit,
        offset,
        hasMore: (matches?.length || 0) === limit
      }
    });
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
