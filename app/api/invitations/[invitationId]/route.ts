import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/invitations/[invitationId] - Respond to invitation (accept/decline)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { invitationId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'accept' or 'decline' or 'cancel'

    if (!['accept', 'decline', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be accept, decline, or cancel' },
        { status: 400 }
      );
    }

    // Get invitation details
    const { data: invitation, error: inviteError } = await supabase
      .from('match_invitations')
      .select(`
        *,
        session:match_sessions(*)
      `)
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (action === 'cancel') {
      // Only inviter can cancel
      if (invitation.inviter_id !== user.id) {
        return NextResponse.json(
          { error: 'Only the inviter can cancel this invitation' },
          { status: 403 }
        );
      }
    } else {
      // Only invitee can accept/decline
      if (invitation.invitee_id !== user.id) {
        return NextResponse.json(
          { error: 'Only the invitee can respond to this invitation' },
          { status: 403 }
        );
      }
    }

    // Check if invitation is still pending
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Invitation has already been ${invitation.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if match session is still available
    if ((invitation.session as any).status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Match session is no longer available' },
        { status: 400 }
      );
    }

    // Update invitation status
    const newStatus = action === 'accept' ? 'ACCEPTED' : action === 'decline' ? 'DECLINED' : 'CANCELLED';

    const { data: updated, error: updateError } = await supabase
      .from('match_invitations')
      .update({ status: newStatus })
      .eq('id', invitationId)
      .select(`
        *,
        inviter:users!match_invitations_inviter_id_fkey(id, name, nickname, profileImage),
        invitee:users!match_invitations_invitee_id_fkey(id, name, nickname, profileImage),
        session:match_sessions(*)
      `)
      .single();

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return NextResponse.json(
        { error: 'Failed to update invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: updated,
      message: `Invitation ${newStatus.toLowerCase()}`
    });
  } catch (error) {
    console.error('Error in PATCH /api/invitations/[invitationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invitations/[invitationId] - Delete invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const supabase = await createClient();
    const { invitationId } = await params;

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get invitation to check ownership
    const { data: invitation, error: inviteError } = await supabase
      .from('match_invitations')
      .select('*')
      .eq('id', invitationId)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Only inviter can delete
    if (invitation.inviter_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the inviter can delete this invitation' },
        { status: 403 }
      );
    }

    // Delete invitation
    const { error: deleteError } = await supabase
      .from('match_invitations')
      .delete()
      .eq('id', invitationId);

    if (deleteError) {
      console.error('Error deleting invitation:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation deleted'
    });
  } catch (error) {
    console.error('Error in DELETE /api/invitations/[invitationId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
