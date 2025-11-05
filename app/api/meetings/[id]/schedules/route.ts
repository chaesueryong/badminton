import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET /api/meetings/:id/schedules - 모임 일정 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 모임 일정 조회 (meeting_schedules 테이블에서)
    const { data: schedules, error } = await supabase
      .from("meeting_schedules")
      .select(`
        *,
        participants:schedule_participants(userId)
      `)
      .eq("meetingId", params.id)
      .order("date", { ascending: true });

    if (error) {
      console.error("일정 조회 에러:", error);
      // 테이블이 없는 경우 빈 배열 반환
      return NextResponse.json([]);
    }

    // 일정이 없으면 빈 배열 반환
    return NextResponse.json(schedules || []);
  } catch (error) {
    console.error("모임 일정 조회 실패:", error);
    // 에러가 발생해도 빈 배열 반환 (페이지가 깨지지 않도록)
    return NextResponse.json([]);
  }
}

// POST /api/meetings/:id/schedules - 모임 일정 추가
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

    // 모임 확인 및 호스트 검증
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
        { error: "일정을 추가할 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Request body 파싱
    const body = await request.json();

    // 새 일정 생성
    const { data: newSchedule, error: createError } = await supabase
      .from("meeting_schedules")
      .insert({
        meetingId: params.id,
        date: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        address: body.address,
        maxParticipants: body.maxParticipants || 20,
        currentCount: 0,
        status: "OPEN",
        fee: body.fee || 0,
        notes: body.notes
      })
      .select()
      .single();

    if (createError) {
      console.error("일정 생성 에러:", createError);
      return NextResponse.json(
        { error: "일정 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(newSchedule);
  } catch (error) {
    console.error("모임 일정 추가 실패:", error);
    return NextResponse.json(
      { error: "일정 추가에 실패했습니다" },
      { status: 500 }
    );
  }
}