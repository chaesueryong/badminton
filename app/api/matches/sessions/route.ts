import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/matches/sessions - Get all match sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    const matchType = searchParams.get('matchType');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    const meetingId = searchParams.get('meetingId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('match_sessions')
      .select(`
        *,
        meeting:meetings(id, title, location),
        participants:match_participants(
          *,
          user:users(id, name, nickname, profileImage, gender)
        )
      `)
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchType) {
      query = query.eq('match_type', matchType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (meetingId) {
      query = query.eq('meeting_id', meetingId);
    }

    if (userId) {
      query = query.eq('match_participants.user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching match sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch match sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/matches/sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/matches/sessions - Create a new match session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      meetingId,
      matchType,
      creationCostPoints = 0, // Cost to create session (paid by creator)
      creationCostFeathers = 0,
      entryFeePoints = 100, // Entry fee in points (participants choose when joining)
      entryFeeFeathers = 10, // Entry fee in feathers (feathers are much more valuable)
      winnerPoints = 100,
      courtNumber,
      location,
      participants = [], // Array of { userId, team }
      betCurrencyType = 'NONE', // 'NONE', 'POINTS', or 'FEATHERS'
      betAmountPerPlayer = 0
    } = body;

    // Validate match type
    if (!['MS', 'WS', 'MD', 'WD', 'XD'].includes(matchType)) {
      return NextResponse.json(
        { error: 'Invalid match type' },
        { status: 400 }
      );
    }

    // Validate betting parameters
    if (!['NONE', 'POINTS', 'FEATHERS'].includes(betCurrencyType)) {
      return NextResponse.json(
        { error: 'Invalid bet currency type' },
        { status: 400 }
      );
    }

    if (betCurrencyType !== 'NONE' && betAmountPerPlayer <= 0) {
      return NextResponse.json(
        { error: 'Bet amount must be greater than 0 when betting is enabled' },
        { status: 400 }
      );
    }

    // Validate participants count based on match type
    // Allow session creation with just the creator (1 participant)
    const expectedParticipants = matchType === 'MS' || matchType === 'WS' ? 2 : 4;
    if (participants.length !== 1 && participants.length !== expectedParticipants) {
      return NextResponse.json(
        { error: `${matchType} requires 1 (creator only) or ${expectedParticipants} (full match) participants` },
        { status: 400 }
      );
    }

    // Validate gender for match types
    if (matchType === 'MS' || matchType === 'WS' || matchType === 'MD' || matchType === 'WD') {
      const requiredGender = matchType.includes('M') ? 'MALE' : 'FEMALE';

      // Check all participants' gender
      const { data: userGenders, error: genderError } = await supabase
        .from('users')
        .select('id, gender')
        .in('id', participants.map((p: any) => p.userId));

      if (genderError || !userGenders) {
        return NextResponse.json(
          { error: 'Failed to validate participants' },
          { status: 500 }
        );
      }

      const invalidGender = userGenders.some(u => u.gender !== requiredGender);
      if (invalidGender) {
        return NextResponse.json(
          { error: `All participants must be ${requiredGender} for ${matchType}` },
          { status: 400 }
        );
      }
    }

    // Deduct creation cost from creator
    const creatorId = participants[0].userId;
    if (creationCostPoints > 0) {
      const { data: userData, error: getUserError } = await supabase
        .from('users')
        .select('points')
        .eq('id', creatorId)
        .single();

      if (getUserError || !userData || userData.points < creationCostPoints) {
        return NextResponse.json(
          { error: 'Insufficient points for creation cost' },
          { status: 400 }
        );
      }

      const { error: deductError } = await supabase
        .from('users')
        .update({ points: userData.points - creationCostPoints })
        .eq('id', creatorId);

      if (deductError) {
        console.error('Failed to deduct points:', deductError);
        return NextResponse.json(
          { error: 'Failed to deduct creation cost' },
          { status: 500 }
        );
      }
    }

    if (creationCostFeathers > 0) {
      const { data: userData, error: getUserError } = await supabase
        .from('users')
        .select('feathers')
        .eq('id', creatorId)
        .single();

      if (getUserError || !userData || userData.feathers < creationCostFeathers) {
        return NextResponse.json(
          { error: 'Insufficient feathers for creation cost' },
          { status: 400 }
        );
      }

      const { error: deductError } = await supabase
        .from('users')
        .update({ feathers: userData.feathers - creationCostFeathers })
        .eq('id', creatorId);

      if (deductError) {
        console.error('Failed to deduct feathers:', deductError);
        return NextResponse.json(
          { error: 'Failed to deduct creation cost' },
          { status: 500 }
        );
      }
    }

    // Note: Entry fee is NOT deducted on session creation
    // It will be deducted when participants join the session
    // Participants choose currency (points or feathers) when joining

    // Create match session
    const { data: session, error: sessionError } = await supabase
      .from('match_sessions')
      .insert({
        meeting_id: meetingId,
        match_type: matchType,
        entry_fee_points: entryFeePoints, // Entry fee in points
        entry_fee_feathers: entryFeeFeathers, // Entry fee in feathers (different value)
        winner_points: winnerPoints,
        status: 'PENDING',
        court_number: courtNumber,
        location: location,
        bet_currency_type: betCurrencyType,
        bet_amount_per_player: betAmountPerPlayer,
        creation_cost_points: creationCostPoints,
        creation_cost_feathers: creationCostFeathers,
        creator_id: creatorId
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating match session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create match session' },
        { status: 500 }
      );
    }

    // Add participants
    const participantRecords = participants.map((p: any) => ({
      match_session_id: session.id,
      user_id: p.userId,
      team: p.team,
      bet_paid: false, // Bet not paid yet
      bet_amount: betCurrencyType !== 'NONE' ? betAmountPerPlayer : 0,
      bet_currency_type: betCurrencyType
    }));

    const { error: participantsError } = await supabase
      .from('match_participants')
      .insert(participantRecords);

    if (participantsError) {
      console.error('Error adding participants:', participantsError);
      // Rollback: delete the session
      await supabase.from('match_sessions').delete().eq('id', session.id);
      return NextResponse.json(
        { error: 'Failed to add participants' },
        { status: 500 }
      );
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
