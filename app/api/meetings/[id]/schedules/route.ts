import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/meetings/:id/schedules - 모임의 모든 일정 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: schedules, error } = await supabase
      .from("meeting_schedules")
      .select("*")
      .eq("meetingId", params.id)
      .order("date", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json(schedules || []);
  } catch (error) {
    console.error("일정 조회 실패:", error);
    return NextResponse.json(
      { error: "일정 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/meetings/:id/schedules - 새 일정 생성
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
        { error: "일정 생성 권한이 없습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      date,
      startTime,
      endTime,
      location,
      address,
      maxParticipants,
      fee,
      notes,
    } = body;

    // 데이터 검증
    if (!date || !startTime || !endTime || !maxParticipants) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // 일정 생성
    const { data: schedule, error } = await supabase
      .from("meeting_schedules")
      .insert({
        meetingId: params.id,
        date,
        startTime,
        endTime,
        location: location || null,
        address: address || null,
        maxParticipants: parseInt(maxParticipants),
        fee: parseInt(fee) || 0,
        notes: notes || null,
        currentCount: 0,
        status: "OPEN",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("일정 생성 실패:", error);
    return NextResponse.json(
      { error: "일정 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
