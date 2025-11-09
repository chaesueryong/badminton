import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/matches/sessions/[sessionId] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = params;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { data: session, error } = await supabase
      .from('match_sessions')
      .select(`
        *,
        participants:match_participants(
          *,
          user:users(id, name, nickname, profileImage)
        )
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json(
        { error: '세션 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...session,
      current_user_id: user?.id || null
    });
  } catch (error) {
    console.error('Error in GET /api/matches/sessions/[sessionId]:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
