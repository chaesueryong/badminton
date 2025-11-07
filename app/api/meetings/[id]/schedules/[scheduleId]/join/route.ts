import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
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

    const { id: meetingId, scheduleId } = params;

    // Check if user is blacklisted
    const { data: isBlacklisted } = await supabase.rpc("is_user_blacklisted", {
      p_meeting_id: meetingId,
      p_user_id: user.id,
    });

    if (isBlacklisted) {
      return NextResponse.json(
        { error: "이 모임에 참여할 수 없습니다" },
        { status: 403 }
      );
    }

    // Check if user is the host or a meeting participant
    const { data: meeting } = await supabase
      .from("meetings")
      .select("hostId")
      .eq("id", meetingId)
      .single();

    const isHost = meeting?.hostId === user.id;

    if (!isHost) {
      // If not host, check if user is a meeting participant
      const { data: participant } = await supabase
        .from("meeting_participants")
        .select("id")
        .eq("meetingId", meetingId)
        .eq("userId", user.id)
        .eq("status", "APPROVED")
        .maybeSingle();

      if (!participant) {
        return NextResponse.json(
          { error: "모임 멤버만 일정에 참여할 수 있습니다" },
          { status: 403 }
        );
      }
    }

    // Check if schedule exists and has space
    const { data: schedule, error: scheduleError } = await supabase
      .from("meeting_schedules")
      .select("currentCount, maxParticipants, status")
      .eq("id", scheduleId)
      .eq("meetingId", meetingId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (schedule.status !== "OPEN") {
      return NextResponse.json(
        { error: "마감된 일정입니다" },
        { status: 400 }
      );
    }

    // 정원 확인
    if (schedule.currentCount >= schedule.maxParticipants) {
      return NextResponse.json(
        { error: "참가 인원이 가득 찼습니다" },
        { status: 400 }
      );
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from("schedule_participants")
      .select("id")
      .eq("scheduleId", scheduleId)
      .eq("userId", user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "이미 참여 중인 일정입니다" },
        { status: 400 }
      );
    }

    // Add participant
    const { error: insertError } = await supabase
      .from("schedule_participants")
      .insert({
        scheduleId,
        userId: user.id,
        status: "CONFIRMED",
      });

    if (insertError) {
      throw insertError;
    }

    // Update schedule current count
    const { error: updateError } = await supabase
      .from("meeting_schedules")
      .update({
        currentCount: schedule.currentCount + 1,
      })
      .eq("id", scheduleId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Schedule join error:", error);
    return NextResponse.json(
      { error: error.message || "일정 참여에 실패했습니다" },
      { status: 500 }
    );
  }
}
