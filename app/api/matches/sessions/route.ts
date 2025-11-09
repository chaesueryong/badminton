import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GameSettings } from '@/config/game-settings';

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
        { error: '매치 세션 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/matches/sessions:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
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
      entryFeePoints = GameSettings.sessionEntry.points, // Entry fee from config
      entryFeeFeathers = GameSettings.sessionEntry.feathers, // Entry fee from config
      winnerPoints = GameSettings.match.winnerPoints, // Winner points from config
      courtNumber,
      location,
      participants = [], // Array of { userId, team }
      betCurrencyType = 'NONE', // 'NONE', 'POINTS', or 'FEATHERS'
      betAmountPerPlayer = 0,
      password = null, // 6-digit numeric password
      isRanked = true // Whether this is a ranked match (affects rating)
    } = body;

    // Validate match type
    if (!['MS', 'WS', 'MD', 'WD', 'XD'].includes(matchType)) {
      return NextResponse.json(
        { error: '유효하지 않은 경기 종목입니다' },
        { status: 400 }
      );
    }

    // Validate betting parameters
    if (!['NONE', 'POINTS', 'FEATHERS'].includes(betCurrencyType)) {
      return NextResponse.json(
        { error: '유효하지 않은 베팅 화폐 타입입니다' },
        { status: 400 }
      );
    }

    if (betCurrencyType !== 'NONE' && betAmountPerPlayer <= 0) {
      return NextResponse.json(
        { error: '베팅을 활성화하려면 베팅 금액이 0보다 커야 합니다' },
        { status: 400 }
      );
    }

    // Validate password
    if (password !== null && (typeof password !== 'string' || !/^\d{6}$/.test(password))) {
      return NextResponse.json(
        { error: '비밀번호는 6자리 숫자여야 합니다' },
        { status: 400 }
      );
    }

    // Validate participants count based on match type (can be 0 for session creation only)
    const expectedParticipants = matchType === 'MS' || matchType === 'WS' ? 2 : 4;
    if (participants.length > 0 && participants.length !== expectedParticipants) {
      return NextResponse.json(
        { error: `${matchType}는 ${expectedParticipants}명의 참가자가 필요합니다` },
        { status: 400 }
      );
    }

    // Validate gender for match types (only if participants provided)
    if (participants.length > 0 && (matchType === 'MS' || matchType === 'WS' || matchType === 'MD' || matchType === 'WD')) {
      const requiredGender = matchType.includes('M') ? 'MALE' : 'FEMALE';
      const genderLabel = requiredGender === 'MALE' ? '남성' : '여성';

      // Check all participants' gender
      const { data: userGenders, error: genderError } = await supabase
        .from('users')
        .select('id, gender')
        .in('id', participants.map((p: any) => p.userId));

      if (genderError || !userGenders) {
        return NextResponse.json(
          { error: '참가자 검증에 실패했습니다' },
          { status: 500 }
        );
      }

      const invalidGender = userGenders.some(u => u.gender !== requiredGender);
      if (invalidGender) {
        return NextResponse.json(
          { error: `${matchType}는 모든 참가자가 ${genderLabel}이어야 합니다` },
          { status: 400 }
        );
      }
    }

    // Check VIP status
    const creatorId = user.id;
    const { data: creatorData, error: creatorError } = await supabase
      .from('users')
      .select('points, feathers, is_vip, vip_until')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creatorData) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Check if user is VIP and VIP is not expired
    const isVip = creatorData.is_vip && creatorData.vip_until && new Date(creatorData.vip_until) > new Date();

    // Deduct creation cost from creator (current user) - VIP gets it for free
    if (!isVip && creationCostPoints > 0) {
      if (creatorData.points < creationCostPoints) {
        return NextResponse.json(
          { error: '세션 생성을 위한 포인트가 부족합니다' },
          { status: 400 }
        );
      }

      const { error: deductError } = await supabase
        .from('users')
        .update({ points: creatorData.points - creationCostPoints })
        .eq('id', creatorId);

      if (deductError) {
        console.error('Failed to deduct points:', deductError);
        return NextResponse.json(
          { error: '생성 비용 차감에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    if (!isVip && creationCostFeathers > 0) {
      if (creatorData.feathers < creationCostFeathers) {
        return NextResponse.json(
          { error: '세션 생성을 위한 깃털이 부족합니다' },
          { status: 400 }
        );
      }

      const { error: deductError } = await supabase
        .from('users')
        .update({ feathers: creatorData.feathers - creationCostFeathers })
        .eq('id', creatorId);

      if (deductError) {
        console.error('Failed to deduct feathers:', deductError);
        return NextResponse.json(
          { error: '생성 비용 차감에 실패했습니다' },
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
        creator_id: creatorId,
        password: password,
        is_ranked: isRanked
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating match session:', sessionError);
      return NextResponse.json(
        { error: '매치 세션 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // Add participants (only if provided)
    if (participants.length > 0) {
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
          { error: '참가자 추가에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
