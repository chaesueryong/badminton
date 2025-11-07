import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/matches/sessions/my-sessions - Get current user's created sessions
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch sessions where user is creator and status is PENDING
    const { data: sessions, error } = await supabase
      .from('match_sessions')
      .select(`
        id,
        match_type,
        status,
        entry_fee_points,
        entry_fee_feathers,
        bet_currency_type,
        bet_amount_per_player,
        session_date,
        created_at,
        participants:match_participants(
          user:users(
            id,
            name,
            nickname,
            profileImage
          )
        )
      `)
      .eq('creator_id', user.id)
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessions: sessions || [],
      userId: user.id
    });
  } catch (error) {
    console.error('Error in GET /api/matches/sessions/my-sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
