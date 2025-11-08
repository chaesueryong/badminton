import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST /api/matches/sessions/[sessionId]/join - Join a match session
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { sessionId } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { entryCurrency, team = 1, password = null } = body; // team: 1 or 2

    // Validate entry currency
    if (!['points', 'feathers'].includes(entryCurrency)) {
      return NextResponse.json(
        { error: '유효하지 않은 화폐 타입입니다' },
        { status: 400 }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('match_sessions')
      .select('*, participants:match_participants(id)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Verify password if session is password protected
    if (session.password) {
      if (!password) {
        return NextResponse.json(
          { error: '비밀번호가 필요합니다' },
          { status: 400 }
        );
      }
      if (password !== session.password) {
        return NextResponse.json(
          { error: '비밀번호가 일치하지 않습니다' },
          { status: 401 }
        );
      }
    }

    // Check if session is full
    const maxPlayers = session.match_type === 'MS' || session.match_type === 'WS' ? 2 : 4;
    if (session.participants.length >= maxPlayers) {
      return NextResponse.json(
        { error: '세션이 가득 찼습니다' },
        { status: 400 }
      );
    }

    // Check if user already joined
    const { data: existingParticipant } = await supabase
      .from('match_participants')
      .select('id')
      .eq('match_session_id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: '이미 참가한 세션입니다' },
        { status: 400 }
      );
    }

    // Get user's balance and VIP status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('points, feathers, is_vip, vip_until')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '사용자 정보를 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }

    // Check if user is VIP and VIP is not expired
    const isVip = userData.is_vip && userData.vip_until && new Date(userData.vip_until) > new Date();

    // VIP gets free entry
    const entryFee = isVip ? 0 : (entryCurrency === 'points'
      ? session.entry_fee_points
      : session.entry_fee_feathers);

    // Calculate betting amount if betting mode is active
    let betAmount = 0;
    let betCurrency: 'points' | 'feathers' | null = null;

    if (session.bet_currency_type !== 'NONE' && session.bet_amount_per_player > 0) {
      betAmount = session.bet_amount_per_player;
      betCurrency = session.bet_currency_type === 'POINTS' ? 'points' : 'feathers';
    }

    const balance = entryCurrency === 'points' ? userData.points : userData.feathers;
    const betBalance = betCurrency === 'points' ? userData.points : userData.feathers;

    // Check entry fee balance
    if (balance < entryFee) {
      return NextResponse.json(
        { error: `${entryCurrency === 'points' ? '포인트' : '깃털'}가 부족합니다` },
        { status: 400 }
      );
    }

    // Check betting balance (if same currency, need both entry fee + bet amount)
    if (betCurrency && betAmount > 0) {
      const totalRequired = entryCurrency === betCurrency ? entryFee + betAmount : betAmount;
      const checkBalance = betCurrency === 'points' ? userData.points : userData.feathers;

      if (checkBalance < totalRequired) {
        return NextResponse.json(
          { error: `${betCurrency === 'points' ? '포인트' : '깃털'}가 부족합니다 (입장료 + 베팅 금액 필요)` },
          { status: 400 }
        );
      }
    }

    // Deduct entry fee
    const updateField = entryCurrency === 'points' ? 'points' : 'feathers';
    let newBalance = balance - entryFee;

    // Deduct betting amount if same currency as entry fee
    if (betCurrency === entryCurrency && betAmount > 0) {
      newBalance -= betAmount;
    }

    const { error: deductError } = await supabase
      .from('users')
      .update({ [updateField]: newBalance })
      .eq('id', user.id);

    if (deductError) {
      console.error('Failed to deduct entry fee:', deductError);
      return NextResponse.json(
        { error: '입장료 차감에 실패했습니다' },
        { status: 500 }
      );
    }

    // Deduct betting amount if different currency than entry fee
    if (betCurrency && betCurrency !== entryCurrency && betAmount > 0) {
      const betUpdateField = betCurrency === 'points' ? 'points' : 'feathers';
      const { error: betDeductError } = await supabase
        .from('users')
        .update({ [betUpdateField]: betBalance - betAmount })
        .eq('id', user.id);

      if (betDeductError) {
        console.error('Failed to deduct bet amount:', betDeductError);
        // Rollback entry fee
        await supabase
          .from('users')
          .update({ [updateField]: balance })
          .eq('id', user.id);

        return NextResponse.json(
          { error: '베팅 금액 차감에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    // Add participant
    const { error: participantError } = await supabase
      .from('match_participants')
      .insert({
        match_session_id: sessionId,
        user_id: user.id,
        team: team,
        entry_fee_points_paid: entryCurrency === 'points' ? entryFee : 0,
        entry_fee_feathers_paid: entryCurrency === 'feathers' ? entryFee : 0,
        entry_fee_paid_at: new Date().toISOString(),
        bet_paid: betAmount > 0,
        bet_amount: betAmount,
        bet_currency_type: session.bet_currency_type
      });

    if (participantError) {
      console.error('Failed to add participant:', participantError);
      // Rollback: refund entry fee and bet amount
      await supabase
        .from('users')
        .update({ [updateField]: balance })
        .eq('id', user.id);

      // Rollback bet amount if different currency
      if (betCurrency && betCurrency !== entryCurrency && betAmount > 0) {
        const betUpdateField = betCurrency === 'points' ? 'points' : 'feathers';
        await supabase
          .from('users')
          .update({ [betUpdateField]: betBalance })
          .eq('id', user.id);
      }

      return NextResponse.json(
        { error: '세션 참가에 실패했습니다' },
        { status: 500 }
      );
    }

    // Record entry fee transaction
    await supabase.from('match_entry_transactions').insert({
      match_session_id: sessionId,
      user_id: user.id,
      amount: entryFee,
      currency_type: entryCurrency === 'points' ? 'POINTS' : 'FEATHERS',
      transaction_type: 'ENTRY_FEE'
    });

    // Record bet transaction if betting is active
    if (betAmount > 0 && betCurrency) {
      await supabase.from('match_entry_transactions').insert({
        match_session_id: sessionId,
        user_id: user.id,
        amount: betAmount,
        currency_type: betCurrency === 'points' ? 'POINTS' : 'FEATHERS',
        transaction_type: 'BET'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions/[sessionId]/join:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
