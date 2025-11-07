import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET /api/invitations - Get user's invitations (sent and received)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const searchParams = request.nextUrl.searchParams;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const type = searchParams.get('type') || 'received'; // 'sent' or 'received'
    const status = searchParams.get('status'); // 'PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED'

    let query = supabase
      .from('match_invitations')
      .select(`
        *,
        inviter:users!match_invitations_inviter_id_fkey(id, name, nickname, profileImage),
        invitee:users!match_invitations_invitee_id_fkey(id, name, nickname, profileImage),
        session:match_sessions(
          *,
          participants:match_participants(
            *,
            user:users(id, name, nickname, profileImage)
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (type === 'sent') {
      query = query.eq('inviter_id', user.id);
    } else {
      query = query.eq('invitee_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json(invitations || []);
  } catch (error) {
    console.error('Error in GET /api/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
