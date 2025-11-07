import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/matches/sessions/[sessionId]/cancel - Cancel a match and refund entry fees
export async function POST(
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
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Match session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel a completed match' },
        { status: 400 }
      );
    }

    if (session.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Match already cancelled' },
        { status: 400 }
      );
    }

    // Check if user is a participant (they can cancel their own matches)
    const { data: participant } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!participant) {
      // Check if user is admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || userData.role !== 'admin') {
        return NextResponse.json(
          { error: 'You do not have permission to cancel this match' },
          { status: 403 }
        );
      }
    }

    // Call database function to refund entry fees and cancel session
    const { error: refundError } = await supabase.rpc('refund_match_entry_fees', {
      p_match_session_id: sessionId
    });

    if (refundError) {
      console.error('Error refunding entry fees:', refundError);
      return NextResponse.json(
        { error: 'Failed to process refunds' },
        { status: 500 }
      );
    }

    // Get refund details
    const { data: refunds, error: refundsError } = await supabase
      .from('match_entry_transactions')
      .select(`
        *,
        user:users(id, name, nickname)
      `)
      .eq('match_session_id', sessionId)
      .eq('transaction_type', 'REFUND');

    if (refundsError) {
      console.error('Error fetching refund details:', refundsError);
    }

    return NextResponse.json({
      success: true,
      message: 'Match cancelled and entry fees refunded',
      refunds: refunds || []
    });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions/[sessionId]/cancel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
