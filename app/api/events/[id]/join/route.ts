import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST /api/events/:id/join - 일정 참가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 일정 확인
    const { data: event, error: eventError } = await (supabaseAdmin as any)
      .from('events')
      .select('*')
      .eq('id', params.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 상태 확인
    if (event.status !== "OPEN") {
      return NextResponse.json(
        { error: "참가할 수 없는 일정입니다" },
        { status: 400 }
      );
    }

    // 정원 확인
    if (event.current_count >= event.max_participants) {
      return NextResponse.json(
        { error: "정원이 가득 찼습니다" },
        { status: 400 }
      );
    }

    // 중복 참가 확인
    const { data: existingParticipant } = await supabaseAdmin
      .from('event_participants')
      .select('id')
      .eq('event_id', params.id)
      .eq('user_id', userId)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: "이미 참가한 일정입니다" },
        { status: 400 }
      );
    }

    // 참가자 추가
    const { data: participant, error: participantError } = await (supabaseAdmin as any)
      .from('event_participants')
      .insert({
        event_id: params.id,
        user_id: userId,
      })
      .select()
      .single();

    if (participantError || !participant) {
      console.error("참가자 추가 실패:", participantError);
      return NextResponse.json(
        { error: "일정 참가에 실패했습니다" },
        { status: 500 }
      );
    }

    // 현재 인원 업데이트
    await (supabaseAdmin as any).rpc('increment_event_participants', { event_id: params.id });

    return NextResponse.json({
      ...participant,
      eventId: participant.event_id,
      userId: participant.user_id,
      createdAt: participant.created_at,
    }, { status: 201 });
  } catch (error) {
    console.error("일정 참가 실패:", error);
    return NextResponse.json(
      { error: "일정 참가에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/:id/join - 일정 참가 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 참가자 찾기
    const { data: participant, error: findError } = await (supabaseAdmin as any)
      .from('event_participants')
      .select('id')
      .eq('event_id', params.id)
      .eq('user_id', userId)
      .single();

    if (findError || !participant) {
      return NextResponse.json(
        { error: "참가하지 않은 일정입니다" },
        { status: 404 }
      );
    }

    // 참가자 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('event_participants')
      .delete()
      .eq('id', participant.id);

    if (deleteError) {
      console.error("참가자 삭제 실패:", deleteError);
      return NextResponse.json(
        { error: "일정 참가 취소에 실패했습니다" },
        { status: 500 }
      );
    }

    // 현재 인원 업데이트
    await (supabaseAdmin as any).rpc('decrement_event_participants', { event_id: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("일정 참가 취소 실패:", error);
    return NextResponse.json(
      { error: "일정 참가 취소에 실패했습니다" },
      { status: 500 }
    );
  }
}
