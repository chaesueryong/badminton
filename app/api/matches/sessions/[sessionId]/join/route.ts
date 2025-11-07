import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/matches/sessions/[sessionId]/join - Join a match session and pay entry fee
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

    const body = await request.json();
    const { paymentMethod = 'points' } = body; // 'points' or 'feathers'

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

    if (session.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Cannot join a match that has already started or completed' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const { data: existingParticipant } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!existingParticipant) {
      return NextResponse.json(
        { error: 'You are not registered for this match session' },
        { status: 400 }
      );
    }

    // Check if already paid
    if (existingParticipant.entry_fee_paid_at) {
      return NextResponse.json(
        { error: 'Entry fee already paid' },
        { status: 400 }
      );
    }

    // Get user's current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points, feathers')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let pointsPaid = 0;
    let feathersPaid = 0;

    // Process payment based on method
    if (paymentMethod === 'points') {
      if (session.entry_fee_points > 0) {
        if (userData.points < session.entry_fee_points) {
          return NextResponse.json(
            { error: 'Insufficient points' },
            { status: 400 }
          );
        }

        // Deduct points
        const { error: deductError } = await supabase
          .from('users')
          .update({ points: userData.points - session.entry_fee_points })
          .eq('id', user.id);

        if (deductError) {
          console.error('Error deducting points:', deductError);
          return NextResponse.json(
            { error: 'Failed to process payment' },
            { status: 500 }
          );
        }

        pointsPaid = session.entry_fee_points;
      }
    } else if (paymentMethod === 'feathers') {
      if (session.entry_fee_feathers > 0) {
        if (userData.feathers < session.entry_fee_feathers) {
          return NextResponse.json(
            { error: 'Insufficient feathers' },
            { status: 400 }
          );
        }

        // Deduct feathers
        const { error: deductError } = await supabase
          .from('users')
          .update({ feathers: userData.feathers - session.entry_fee_feathers })
          .eq('id', user.id);

        if (deductError) {
          console.error('Error deducting feathers:', deductError);
          return NextResponse.json(
            { error: 'Failed to process payment' },
            { status: 500 }
          );
        }

        feathersPaid = session.entry_fee_feathers;
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Update participant record
    const { error: updateError } = await supabase
      .from('match_participants')
      .update({
        entry_fee_points_paid: pointsPaid,
        entry_fee_feathers_paid: feathersPaid,
        entry_fee_paid_at: new Date().toISOString()
      })
      .eq('id', existingParticipant.id);

    if (updateError) {
      console.error('Error updating participant:', updateError);
      // Rollback payment
      if (pointsPaid > 0) {
        await supabase
          .from('users')
          .update({ points: userData.points })
          .eq('id', user.id);
      }
      if (feathersPaid > 0) {
        await supabase
          .from('users')
          .update({ feathers: userData.feathers })
          .eq('id', user.id);
      }
      return NextResponse.json(
        { error: 'Failed to update participant' },
        { status: 500 }
      );
    }

    // Record transaction
    const { error: transactionError } = await supabase
      .from('match_entry_transactions')
      .insert({
        user_id: user.id,
        match_session_id: sessionId,
        match_participant_id: existingParticipant.id,
        transaction_type: 'ENTRY_FEE',
        currency_type: paymentMethod === 'points' ? 'POINTS' : 'FEATHERS',
        amount: -(pointsPaid || feathersPaid)
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    }

    return NextResponse.json({
      success: true,
      pointsPaid,
      feathersPaid,
      message: 'Entry fee paid successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions/[sessionId]/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
