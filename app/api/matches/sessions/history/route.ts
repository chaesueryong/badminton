import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/matches/sessions/history - Get user's completed match history
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // Get all completed sessions where user participated
    const { data: sessions, error } = await supabase
      .from('match_sessions')
      .select(`
        *,
        participants:match_participants(
          *,
          user:users(id, nickname, profileImage)
        )
      `)
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching match history:', error);
      return NextResponse.json(
        { error: '매치 내역 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    // Filter sessions where current user is a participant
    const userSessions = sessions?.filter(session =>
      session.participants.some((p: any) => p.user_id === user.id)
    ) || [];

    return NextResponse.json({
      sessions: userSessions,
      current_user_id: user.id
    });
  } catch (error) {
    console.error('Error in GET /api/matches/sessions/history:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
