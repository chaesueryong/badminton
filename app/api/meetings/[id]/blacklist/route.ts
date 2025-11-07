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

    const body = await request.json();
    const { userId: targetUserId, reason } = body;

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

    // Cannot blacklist the host
    if (targetUserId === meeting.hostId) {
      return NextResponse.json(
        { error: "호스트는 블랙리스트에 추가할 수 없습니다" },
        { status: 400 }
      );
    }

    // Check if already blacklisted
    const { data: existing } = await supabase
      .from("meeting_blacklist")
      .select("id")
      .eq("meetingId", meetingId)
      .eq("userId", targetUserId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "이미 블랙리스트에 추가된 사용자입니다" },
        { status: 400 }
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

    // Remove from meeting participants if exists
    const { data: participant } = await supabase
      .from("meeting_participants")
      .select("id")
      .eq("meetingId", meetingId)
      .eq("userId", targetUserId)
      .maybeSingle();

    if (participant) {
      await supabase
        .from("meeting_participants")
        .delete()
        .eq("id", participant.id);

      // Update meeting current count
      await supabase.rpc("decrement_meeting_count", {
        meeting_id: meetingId,
      });
    }

    // Add to blacklist
    const { error: insertError } = await supabase
      .from("meeting_blacklist")
      .insert({
        meetingId,
        userId: targetUserId,
        reason: reason || null,
        blacklistedBy: user.id,
      });

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Blacklist error:", error);
    return NextResponse.json(
      { error: error.message || "블랙리스트 추가에 실패했습니다" },
      { status: 500 }
    );
  }
}

// Remove from blacklist
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

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

    // Remove from blacklist
    const { error: deleteError } = await supabase
      .from("meeting_blacklist")
      .delete()
      .eq("meetingId", meetingId)
      .eq("userId", targetUserId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Remove from blacklist error:", error);
    return NextResponse.json(
      { error: error.message || "블랙리스트 제거에 실패했습니다" },
      { status: 500 }
    );
  }
}
