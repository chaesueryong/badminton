import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/matches/sessions/[sessionId]/complete - Complete a match and update ratings
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
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { result, team1Score, team2Score } = body;

    // Validate result
    if (!['PLAYER1_WIN', 'PLAYER2_WIN', 'TEAM1_WIN', 'TEAM2_WIN'].includes(result)) {
      return NextResponse.json(
        { error: 'Invalid result' },
        { status: 400 }
      );
    }

    // Get session details including creator info
    const { data: session, error: sessionError } = await supabase
      .from('match_sessions')
      .select('*, creator_id, creation_cost_points, creation_cost_feathers')
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
        { error: 'Match already completed' },
        { status: 400 }
      );
    }

    if (session.status === 'CANCELLED') {
      return NextResponse.json(
        { error: '취소된 게임입니다' },
        { status: 400 }
      );
    }

    // Check if current user is the creator (only creator can complete the match)
    if (session.creator_id !== user.id) {
      return NextResponse.json(
        { error: '세션 생성자만 게임을 종료할 수 있습니다' },
        { status: 403 }
      );
    }

    // Validate result matches match type
    const isSingles = session.match_type === 'MS' || session.match_type === 'WS';
    const isValidResult = isSingles
      ? result === 'PLAYER1_WIN' || result === 'PLAYER2_WIN'
      : result === 'TEAM1_WIN' || result === 'TEAM2_WIN';

    if (!isValidResult) {
      return NextResponse.json(
        { error: `${session.match_type} 경기에 유효하지 않은 결과입니다` },
        { status: 400 }
      );
    }

    // Set result and scores first (before calling complete function)
    const { error: updateError } = await supabase
      .from('match_sessions')
      .update({
        result: result,
        team1_score: team1Score,
        team2_score: team2Score
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      return NextResponse.json(
        { error: '매치 세션 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    // Call database function to process ratings, rewards, and complete the session
    // This function will also set status to COMPLETED
    const { error: completeError } = await supabase.rpc('complete_match_session', {
      p_match_session_id: sessionId
    });

    if (completeError) {
      console.error('Error completing match session:', completeError);
      return NextResponse.json(
        { error: '매치 완료 처리에 실패했습니다' },
        { status: 500 }
      );
    }

    // Refund creation cost to creator when game completes
    if (session.creator_id) {
      if (session.creation_cost_points > 0) {
        const { data: userData, error: getUserError } = await supabase
          .from('users')
          .select('points')
          .eq('id', session.creator_id)
          .single();

        if (!getUserError && userData) {
          await supabase
            .from('users')
            .update({ points: userData.points + session.creation_cost_points })
            .eq('id', session.creator_id);
        }
      }

      if (session.creation_cost_feathers > 0) {
        const { data: userData, error: getUserError } = await supabase
          .from('users')
          .select('feathers')
          .eq('id', session.creator_id)
          .single();

        if (!getUserError && userData) {
          await supabase
            .from('users')
            .update({ feathers: userData.feathers + session.creation_cost_feathers })
            .eq('id', session.creator_id);
        }
      }
    }

    // Get updated participants with rating changes
    const { data: updatedParticipants, error: participantsError } = await supabase
      .from('match_participants')
      .select(`
        *,
        user:users(id, name, nickname, profileImage)
      `)
      .eq('match_session_id', sessionId);

    if (participantsError) {
      console.error('Error fetching updated participants:', participantsError);
    }

    return NextResponse.json({
      success: true,
      message: '매치가 성공적으로 완료되었습니다',
      session: {
        id: sessionId,
        result,
        team1Score,
        team2Score
      },
      participants: updatedParticipants
    });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions/[sessionId]/complete:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
