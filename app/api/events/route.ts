import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/events - 일정 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get("clubId");
    const type = searchParams.get("type");
    const date = searchParams.get("date");

    let query = supabaseAdmin
      .from('events')
      .select(`
        *,
        club:clubs!club_id (
          id,
          name
        ),
        host:users!host_id (
          id,
          name,
          nickname
        ),
        gym:gyms!gym_id (
          id,
          name,
          region,
          address
        )
      `)
      .order('date', { ascending: true });

    // 필터 적용
    if (clubId) {
      query = query.eq('club_id', clubId);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query = query.gte('date', startDate.toISOString()).lt('date', endDate.toISOString());
    } else {
      // 기본적으로 미래 일정만 조회
      query = query.gte('date', new Date().toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("일정 목록 조회 실패:", error);
      return NextResponse.json(
        { error: "일정 목록 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    // 각 이벤트의 참가자 수 조회
    const eventsWithCount = await Promise.all(
      (events || []).map(async (event) => {
        const { count } = await supabaseAdmin
          .from('event_participants')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', event.id);

        return {
          ...event,
          clubId: event.club_id,
          hostId: event.host_id,
          gymId: event.gym_id,
          maxParticipants: event.max_participants,
          currentCount: event.current_count,
          isRecurring: event.is_recurring,
          recurringDay: event.recurring_day,
          startTime: event.start_time,
          endTime: event.end_time,
          createdAt: event.created_at,
          updatedAt: event.updated_at,
          _count: {
            participants: count || 0,
          },
        };
      })
    );

    return NextResponse.json(eventsWithCount);
  } catch (error) {
    console.error("일정 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "일정 목록 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/events - 일정 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clubId,
      title,
      description,
      type,
      date,
      startTime,
      endTime,
      location,
      address,
      gymId,
      maxParticipants,
      fee,
      hostId,
      isRecurring,
      recurringDay,
    } = body;

    if (!clubId || !title || !date || !startTime || !endTime || !location || !address || !maxParticipants || !hostId) {
      return NextResponse.json(
        { error: "필수 필드를 모두 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        club_id: clubId,
        title,
        description,
        type: type || "INSTANT",
        date: new Date(date).toISOString(),
        start_time: startTime,
        end_time: endTime,
        location,
        address,
        gym_id: gymId,
        max_participants: maxParticipants,
        fee: fee || 0,
        host_id: hostId,
        is_recurring: isRecurring || false,
        recurring_day: recurringDay,
      })
      .select(`
        *,
        club:clubs!club_id (*),
        host:users!host_id (
          id,
          name,
          nickname
        ),
        gym:gyms!gym_id (*)
      `)
      .single();

    if (error || !event) {
      console.error("일정 생성 실패:", error);
      return NextResponse.json(
        { error: "일정 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...event,
      clubId: event.club_id,
      hostId: event.host_id,
      gymId: event.gym_id,
      maxParticipants: event.max_participants,
      currentCount: event.current_count,
      isRecurring: event.is_recurring,
      recurringDay: event.recurring_day,
      startTime: event.start_time,
      endTime: event.end_time,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    }, { status: 201 });
  } catch (error) {
    console.error("일정 생성 실패:", error);
    return NextResponse.json(
      { error: "일정 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
