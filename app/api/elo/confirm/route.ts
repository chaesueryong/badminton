import { supabase } from '@/lib/supabase';
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
    const { matchResultId } = body;

    if (!matchResultId) {
      return NextResponse.json({ error: 'Match result ID required' }, { status: 400 });
    }

    // Get match result
    const { data: matchResult, error: fetchError } = await (supabase as any)
      .from('match_results')
      .select('*')
      .eq('id', matchResultId)
      .single();

    if (fetchError || !matchResult) {
      return NextResponse.json({ error: 'Match result not found' }, { status: 404 });
    }

    // Check if user is one of the players
    if (user.id !== matchResult.player1_id && user.id !== matchResult.player2_id) {
      return NextResponse.json({ error: 'Unauthorized to confirm this match' }, { status: 403 });
    }

    // Check if already confirmed by both
    if (matchResult.player1_confirmed && matchResult.player2_confirmed) {
      return NextResponse.json({ message: 'Match already confirmed by both players' });
    }

    // Update confirmation
    const updateData: any = {};
    if (user.id === matchResult.player1_id) {
      updateData.player1_confirmed = true;
    } else {
      updateData.player2_confirmed = true;
    }

    const { data: updatedMatch, error: updateError } = await (supabase as any)
      .from('match_results')
      .update(updateData)
      .eq('id', matchResultId)
      .select()
      .single();

    if (updateError) {
      console.error('Error confirming match:', updateError);
      return NextResponse.json({ error: 'Failed to confirm match' }, { status: 500 });
    }

    // Check if both players have now confirmed
    const bothConfirmed = updatedMatch.player1_confirmed && updatedMatch.player2_confirmed;

    if (bothConfirmed) {
      // Award points to winner
      if (updatedMatch.result !== 'draw') {
        const winnerId =
          updatedMatch.result === 'player1_win'
            ? updatedMatch.player1_id
            : updatedMatch.player2_id;

        await (supabase as any).rpc('award_points', {
          p_user_id: winnerId,
          p_action_type: 'win_match',
          p_source_id: matchResultId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      confirmed: bothConfirmed,
      message: bothConfirmed
        ? 'Match confirmed! ELO ratings updated.'
        : 'Match confirmed. Waiting for opponent confirmation.',
    });
  } catch (error) {
    console.error('Error confirming match:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
