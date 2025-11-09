import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/matches/sessions/[sessionId]/invite - Send invitation to a user
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { inviteeId, team, message } = body;

    if (!inviteeId || !team) {
      return NextResponse.json(
        { error: 'Missing required fields: inviteeId, team' },
        { status: 400 }
      );
    }

    // Validate team number
    if (![1, 2].includes(team)) {
      return NextResponse.json(
        { error: 'Team must be 1 or 2' },
        { status: 400 }
      );
    }

    // Check if match session exists and is still pending
    const { data: session, error: sessionError } = await supabase
      .from('match_sessions')
      .select('*, participants:match_participants(*)')
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
        { error: 'Can only invite to pending match sessions' },
        { status: 400 }
      );
    }

    // Check if current user is a participant
    const isParticipant = session.participants?.some(
      (p: any) => p.user_id === user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You must be a participant to invite others' },
        { status: 403 }
      );
    }

    // Check if invitee is already a participant
    const isAlreadyParticipant = session.participants?.some(
      (p: any) => p.user_id === inviteeId
    );

    if (isAlreadyParticipant) {
      return NextResponse.json(
        { error: 'User is already a participant in this match' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvite } = await supabase
      .from('match_invitations')
      .select('*')
      .eq('match_session_id', sessionId)
      .eq('invitee_id', inviteeId)
      .eq('status', 'PENDING')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this user' },
        { status: 400 }
      );
    }

    // Check if invitee exists
    const { data: invitee, error: inviteeError } = await supabase
      .from('users')
      .select('id, name, nickname, gender')
      .eq('id', inviteeId)
      .single();

    if (inviteeError || !invitee) {
      return NextResponse.json(
        { error: 'Invitee not found' },
        { status: 404 }
      );
    }

    // Validate gender for gender-specific matches
    if ((session.match_type === 'MS' || session.match_type === 'MD') && invitee.gender !== 'MALE') {
      return NextResponse.json(
        { error: 'This match requires male participants' },
        { status: 400 }
      );
    }
    if ((session.match_type === 'WS' || session.match_type === 'WD') && invitee.gender !== 'FEMALE') {
      return NextResponse.json(
        { error: 'This match requires female participants' },
        { status: 400 }
      );
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('match_invitations')
      .insert({
        match_session_id: sessionId,
        inviter_id: user.id,
        invitee_id: inviteeId,
        team: team,
        message: message || null
      })
      .select(`
        *,
        inviter:users!match_invitations_inviter_id_fkey(id, name, nickname, profileImage),
        invitee:users!match_invitations_invitee_id_fkey(id, name, nickname, profileImage),
        session:match_sessions(*)
      `)
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/matches/sessions/[sessionId]/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/matches/sessions/[sessionId]/invite - Get all invitations for a session
export async function GET(
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get invitations for this session
    const { data: invitations, error } = await supabase
      .from('match_invitations')
      .select(`
        *,
        inviter:users!match_invitations_inviter_id_fkey(id, name, nickname, profileImage),
        invitee:users!match_invitations_invitee_id_fkey(id, name, nickname, profileImage)
      `)
      .eq('match_session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json(invitations || []);
  } catch (error) {
    console.error('Error in GET /api/matches/sessions/[sessionId]/invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
