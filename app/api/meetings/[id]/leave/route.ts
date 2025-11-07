import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const { id: meetingId } = params;

    // Check if user is the host
    const { data: meeting } = await supabase
      .from("meetings")
      .select("hostId")
      .eq("id", meetingId)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (meeting.hostId === user.id) {
      return NextResponse.json(
        { error: "모임 호스트는 탈퇴할 수 없습니다" },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const { data: participant } = await supabase
      .from("meeting_participants")
      .select("id")
      .eq("meetingId", meetingId)
      .eq("userId", user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json(
        { error: "참여 중인 모임이 아닙니다" },
        { status: 404 }
      );
    }

    // Remove from all schedule participants
    const { data: schedules } = await supabase
      .from("meeting_schedules")
      .select("id")
      .eq("meetingId", meetingId);

    if (schedules && schedules.length > 0) {
      await supabase
        .from("schedule_participants")
        .delete()
        .eq("userId", user.id)
        .in("scheduleId", schedules.map(s => s.id));
    }

    // Remove from meeting participants
    const { error: deleteError } = await supabase
      .from("meeting_participants")
      .delete()
      .eq("id", participant.id);

    if (deleteError) {
      throw deleteError;
    }

    // Update meeting current count
    await supabase.rpc("decrement_meeting_count", {
      meeting_id: meetingId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Meeting leave error:", error);
    return NextResponse.json(
      { error: error.message || "모임 탈퇴에 실패했습니다" },
      { status: 500 }
    );
  }
}
