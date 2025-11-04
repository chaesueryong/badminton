import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// POST /api/meetings/:id/join - 모임 참가
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 모임 확인
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("*, participants:meeting_participants(*)")
      .eq("id", params.id)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 모집 상태 확인
    if (meeting.status !== "OPEN") {
      return NextResponse.json(
        { error: "모집이 마감된 모임입니다" },
        { status: 400 }
      );
    }

    // 정원 확인
    if (meeting.currentCount >= meeting.maxParticipants) {
      return NextResponse.json(
        { error: "정원이 가득 찼습니다" },
        { status: 400 }
      );
    }

    // 중복 참가 확인
    const existingParticipant = meeting.participants.find(
      (p: any) => p.userId === user.id
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: "이미 참가한 모임입니다" },
        { status: 400 }
      );
    }

    // 참가자 추가
    const { data: participant, error: participantError } = await supabase
      .from("meeting_participants")
      .insert({
        id: crypto.randomUUID(),
        meetingId: params.id,
        userId: user.id,
        status: "CONFIRMED",
      })
      .select()
      .single();

    if (participantError) {
      throw participantError;
    }

    // 현재 인원 업데이트
    await supabase
      .from("meetings")
      .update({
        currentCount: meeting.currentCount + 1,
      })
      .eq("id", params.id);

    return NextResponse.json(participant, { status: 201 });
  } catch (error: any) {
    console.error("모임 참가 실패:", error);
    console.error("에러 상세:", error.message, error.code, error.details);
    return NextResponse.json(
      { error: "모임 참가에 실패했습니다", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/:id/join - 모임 참가 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    // 참가자 찾기
    const { data: participant, error: findError } = await supabase
      .from("meeting_participants")
      .select("*")
      .eq("meetingId", params.id)
      .eq("userId", user.id)
      .single();

    if (findError || !participant) {
      return NextResponse.json(
        { error: "참가하지 않은 모임입니다" },
        { status: 404 }
      );
    }

    // 참가자 삭제
    const { error: deleteError } = await supabase
      .from("meeting_participants")
      .delete()
      .eq("id", participant.id);

    if (deleteError) {
      throw deleteError;
    }

    // 현재 인원 업데이트
    const { data: meeting } = await supabase
      .from("meetings")
      .select("currentCount")
      .eq("id", params.id)
      .single();

    if (meeting) {
      await supabase
        .from("meetings")
        .update({
          currentCount: meeting.currentCount - 1,
        })
        .eq("id", params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("모임 참가 취소 실패:", error);
    return NextResponse.json(
      { error: "모임 참가 취소에 실패했습니다" },
      { status: 500 }
    );
  }
}
