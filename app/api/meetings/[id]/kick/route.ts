import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "대상 사용자 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const { id: meetingId } = params;

    // Check if requester is host or manager
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

    const isHost = meeting.hostId === user.id;

    if (!isHost) {
      const { data: requester } = await supabase
        .from("meeting_participants")
        .select("role")
        .eq("meetingId", meetingId)
        .eq("userId", user.id)
        .maybeSingle();

      if (!requester || requester.role !== "MANAGER") {
        return NextResponse.json(
          { error: "권한이 없습니다" },
          { status: 403 }
        );
      }
    }

    // Cannot kick the host
    if (targetUserId === meeting.hostId) {
      return NextResponse.json(
        { error: "호스트는 강퇴할 수 없습니다" },
        { status: 400 }
      );
    }

    // Find target participant
    const { data: participant } = await supabase
      .from("meeting_participants")
      .select("id")
      .eq("meetingId", meetingId)
      .eq("userId", targetUserId)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json(
        { error: "대상 사용자가 모임 멤버가 아닙니다" },
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
        .eq("userId", targetUserId)
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
    console.error("Kick member error:", error);
    return NextResponse.json(
      { error: error.message || "멤버 강퇴에 실패했습니다" },
      { status: 500 }
    );
  }
}
