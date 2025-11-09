import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/matches/sessions/[sessionId]/start - Start a match session (creator only)
export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('match_sessions')
      .select('*, participants:match_participants(id, user:users(id, nickname))')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Check if current user is the creator
    if (session.creator_id !== user.id) {
      return NextResponse.json(
        { error: '세션 생성자만 게임을 시작할 수 있습니다' },
        { status: 403 }
      );
    }

    // Check if session is in PENDING status
    if (session.status !== 'PENDING') {
      return NextResponse.json(
        { error: '대기 중인 세션만 시작할 수 있습니다' },
        { status: 400 }
      );
    }

    // Check if session has enough participants
    const maxPlayers = session.match_type === 'MS' || session.match_type === 'WS' ? 2 : 4;
    if (session.participants.length < maxPlayers) {
      return NextResponse.json(
        { error: `${maxPlayers}명의 참가자가 필요합니다` },
        { status: 400 }
      );
    }

    // Update session status to IN_PROGRESS
    const { error: updateError } = await supabase
      .from('match_sessions')
      .update({
        status: 'IN_PROGRESS',
        session_date: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Failed to start session:', updateError);
      return NextResponse.json(
        { error: '게임 시작에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions/[sessionId]/start:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
