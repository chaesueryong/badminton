import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/matches/sessions/[sessionId]/delete - Delete a match session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('match_sessions')
      .select(`
        *,
        participants:match_participants(user_id)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if current user is the creator (first participant)
    if (!session.participants || session.participants.length === 0) {
      return NextResponse.json(
        { error: 'Session has no participants' },
        { status: 400 }
      );
    }

    const creatorId = session.participants[0].user_id;
    if (creatorId !== user.id) {
      return NextResponse.json(
        { error: 'Only the creator can delete this session' },
        { status: 403 }
      );
    }

    // Check if session is still pending
    if (session.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only delete pending sessions' },
        { status: 400 }
      );
    }

    // Refund creation cost to creator
    if (session.creation_cost_points > 0) {
      const { data: userData, error: getUserError } = await supabase
        .from('users')
        .select('points')
        .eq('id', creatorId)
        .single();

      if (getUserError || !userData) {
        console.error('Failed to get user for refund:', getUserError);
        return NextResponse.json(
          { error: 'Failed to process refund' },
          { status: 500 }
        );
      }

      const { error: refundError } = await supabase
        .from('users')
        .update({ points: userData.points + session.creation_cost_points })
        .eq('id', creatorId);

      if (refundError) {
        console.error('Failed to refund points:', refundError);
        return NextResponse.json(
          { error: 'Failed to refund creation cost' },
          { status: 500 }
        );
      }
    }

    if (session.creation_cost_feathers > 0) {
      const { data: userData, error: getUserError } = await supabase
        .from('users')
        .select('feathers')
        .eq('id', creatorId)
        .single();

      if (getUserError || !userData) {
        console.error('Failed to get user for refund:', getUserError);
        return NextResponse.json(
          { error: 'Failed to process refund' },
          { status: 500 }
        );
      }

      const { error: refundError } = await supabase
        .from('users')
        .update({ feathers: userData.feathers + session.creation_cost_feathers })
        .eq('id', creatorId);

      if (refundError) {
        console.error('Failed to refund feathers:', refundError);
        return NextResponse.json(
          { error: 'Failed to refund creation cost' },
          { status: 500 }
        );
      }
    }

    // Note: No entry fee refund needed since it's not deducted on creation
    // Entry fee is only deducted when participants join

    // Delete participants first (foreign key constraint)
    await supabase
      .from('match_participants')
      .delete()
      .eq('match_session_id', sessionId);

    // Delete session
    const { error: deleteError } = await supabase
      .from('match_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Failed to delete session:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/matches/sessions/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
