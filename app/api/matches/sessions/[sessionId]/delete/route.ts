import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE /api/matches/sessions/[sessionId]/delete - Delete a match session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
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
      .select('*')
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
        { error: '세션 생성자만 삭제할 수 있습니다' },
        { status: 403 }
      );
    }

    // Check if session is still pending
    if (session.status !== 'PENDING') {
      return NextResponse.json(
        { error: '대기 중인 세션만 삭제할 수 있습니다' },
        { status: 400 }
      );
    }

    // Check if creator is VIP
    const { data: creatorData } = await supabase
      .from('users')
      .select('is_vip, vip_until, points, feathers')
      .eq('id', user.id)
      .single();

    const isVip = creatorData?.is_vip && creatorData?.vip_until && new Date(creatorData.vip_until) > new Date();

    // Refund creation cost to creator (only if not VIP - VIP didn't pay)
    if (!isVip && session.creation_cost_points > 0) {
      if (!creatorData) {
        return NextResponse.json(
          { error: '환불 처리에 실패했습니다' },
          { status: 500 }
        );
      }

      const { error: refundError } = await supabase
        .from('users')
        .update({ points: creatorData.points + session.creation_cost_points })
        .eq('id', user.id);

      if (refundError) {
        console.error('Failed to refund points:', refundError);
        return NextResponse.json(
          { error: '생성 비용 환불에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    if (!isVip && session.creation_cost_feathers > 0) {
      if (!creatorData) {
        return NextResponse.json(
          { error: '환불 처리에 실패했습니다' },
          { status: 500 }
        );
      }

      const { error: refundError } = await supabase
        .from('users')
        .update({ feathers: creatorData.feathers + session.creation_cost_feathers })
        .eq('id', user.id);

      if (refundError) {
        console.error('Failed to refund feathers:', refundError);
        return NextResponse.json(
          { error: '생성 비용 환불에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    // Refund entry fees and betting amounts to all participants using database function
    console.log('Calling refund function for session:', sessionId);
    const { data: refundData, error: refundError } = await supabase.rpc('refund_session_participants', {
      p_match_session_id: sessionId
    });

    if (refundError) {
      console.error('Failed to refund participants:', refundError);
      console.error('Refund error details:', JSON.stringify(refundError, null, 2));
      return NextResponse.json(
        { error: '참가자 환불에 실패했습니다', details: refundError.message },
        { status: 500 }
      );
    }

    console.log('Refund completed successfully:', refundData);

    // Delete participants first (foreign key constraint)
    await supabase
      .from('match_participants')
      .delete()
      .eq('match_session_id', sessionId);

    // Delete session
    const { error: deleteError } = await supabase
      .from('match_sessions')
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Failed to delete session:', deleteError);
      return NextResponse.json(
        { error: '세션 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/matches/sessions/[sessionId]/delete:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
