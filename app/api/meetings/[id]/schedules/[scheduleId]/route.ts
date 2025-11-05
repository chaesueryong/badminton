import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/meetings/:id/schedules/:scheduleId - 특정 일정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: schedule, error } = await supabase
      .from("meeting_schedules")
      .select(`
        *,
        participants:schedule_participants(
          id,
          userId,
          status,
          joinedAt,
          user:users(id, name, nickname, level, profileImage)
        )
      `)
      .eq("id", params.scheduleId)
      .eq("meetingId", params.id)
      .single();

    if (error || !schedule) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("일정 조회 실패:", error);
    return NextResponse.json(
      { error: "일정 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/meetings/:id/schedules/:scheduleId - 일정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
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

    // 모임 호스트 확인
    const { data: meeting } = await supabase
      .from("meetings")
      .select("hostId")
      .eq("id", params.id)
      .single();

    if (!meeting) {
      return NextResponse.json(
        { error: "모임을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (meeting.hostId !== user.id) {
      return NextResponse.json(
        { error: "일정 삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 일정 삭제
    const { error: deleteError } = await supabase
      .from("meeting_schedules")
      .delete()
      .eq("id", params.scheduleId)
      .eq("meetingId", params.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("일정 삭제 실패:", error);
    return NextResponse.json(
      { error: "일정 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
