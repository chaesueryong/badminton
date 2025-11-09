import { supabase } from '@/lib/supabase';
import { calculateNewEloRatings, getKFactor } from '@/lib/elo';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      player1Id,
      player2Id,
      player1Score,
      player2Score,
      meetingId,
      matchType = 'casual',
    } = body;

    // Validate input
    if (!player1Id || !player2Id || player1Score === undefined || player2Score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // User must be one of the players
    if (user.id !== player1Id && user.id !== player2Id) {
      return NextResponse.json({ error: 'Unauthorized to submit this result' }, { status: 403 });
    }

    // Determine result
    let result: 'player1_win' | 'player2_win' | 'draw';
    if (player1Score > player2Score) {
      result = 'player1_win';
    } else if (player2Score > player1Score) {
      result = 'player2_win';
    } else {
      result = 'draw';
    }

    // Get current ELO ratings and games played for both players
    const { data: players, error: playersError } = await (supabase as any)
      .from('users')
      .select('id, elo_rating, games_played')
      .in('id', [player1Id, player2Id]);

    if (playersError || !players || players.length !== 2) {
      return NextResponse.json({ error: 'Failed to fetch player data' }, { status: 500 });
    }

    const player1Data = players.find((p: any) => p.id === player1Id);
    const player2Data = players.find((p: any) => p.id === player2Id);

    if (!player1Data || !player2Data) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Calculate K-factors based on experience
    const player1KFactor = getKFactor(player1Data.elo_rating, player1Data.games_played);
    const player2KFactor = getKFactor(player2Data.elo_rating, player2Data.games_played);

    // Use average K-factor for fair calculation
    const avgKFactor = Math.round((player1KFactor + player2KFactor) / 2);

    // Calculate new ELO ratings
    const eloCalculation = calculateNewEloRatings(
      player1Data.elo_rating,
      player2Data.elo_rating,
      result,
      avgKFactor
    );

    // Create match result record
    const { data: matchResult, error: matchError } = await (supabase as any)
      .from('match_results')
      .insert({
        player1_id: player1Id,
        player2_id: player2Id,
        player1_score: player1Score,
        player2_score: player2Score,
        result,
        player1_elo_before: player1Data.elo_rating,
        player1_elo_after: eloCalculation.player1EloAfter,
        player1_elo_change: eloCalculation.player1EloChange,
        player2_elo_before: player2Data.elo_rating,
        player2_elo_after: eloCalculation.player2EloAfter,
        player2_elo_change: eloCalculation.player2EloChange,
        match_type: matchType,
        meeting_id: meetingId,
        // Automatically confirm for the submitting user
        player1_confirmed: user.id === player1Id,
        player2_confirmed: user.id === player2Id,
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating match result:', matchError);
      return NextResponse.json({ error: 'Failed to create match result' }, { status: 500 });
    }

    // If both players confirmed (same person submitted), award points
    if (matchResult.player1_confirmed && matchResult.player2_confirmed) {
      // This would trigger the database trigger
      // Award points to winner
      if (result !== 'draw') {
        const winnerId = result === 'player1_win' ? player1Id : player2Id;
        // Award points via function
        await (supabase as any).rpc('award_points', {
          p_user_id: winnerId,
          p_action_type: 'win_match',
          p_source_id: matchResult.id,
        });
      }
    }

    return NextResponse.json({
      success: true,
      matchResult,
      message:
        matchResult.player1_confirmed && matchResult.player2_confirmed
          ? 'Match result recorded and ELO updated'
          : 'Match result submitted. Waiting for opponent confirmation.',
    });
  } catch (error) {
    console.error('Error submitting match result:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
