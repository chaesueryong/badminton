import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/events/:id - 일정 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        club:clubs!club_id (*),
        host:users!host_id (
          id,
          name,
          nickname,
          level,
          profile_image
        ),
        gym:gyms!gym_id (*)
      `)
      .eq('id', params.id)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 참가자 정보 조회
    const { data: participants } = await supabase
      .from('event_participants')
      .select(`
        *,
        user:users!user_id (
          id,
          name,
          nickname,
          level,
          profile_image
        )
      `)
      .eq('event_id', params.id);

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
      host: event.host ? {
        ...event.host,
        profileImage: event.host.profile_image,
      } : null,
      participants: participants?.map((p: any) => ({
        ...p,
        eventId: p.event_id,
        userId: p.user_id,
        createdAt: p.created_at,
        user: p.user ? {
          ...p.user,
          profileImage: p.user.profile_image,
        } : null,
      })) || [],
    });
  } catch (error) {
    console.error("일정 상세 조회 실패:", error);
    return NextResponse.json(
      { error: "일정 상세 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/events/:id - 일정 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // camelCase를 snake_case로 변환
    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.type) updateData.type = body.type;
    if (body.date) updateData.date = new Date(body.date);
    if (body.startTime) updateData.start_time = body.startTime;
    if (body.endTime) updateData.end_time = body.endTime;
    if (body.location) updateData.location = body.location;
    if (body.address) updateData.address = body.address;
    if (body.gymId) updateData.gym_id = body.gymId;
    if (body.maxParticipants) updateData.max_participants = body.maxParticipants;
    if (body.fee !== undefined) updateData.fee = body.fee;
    if (body.status) updateData.status = body.status;
    if (body.isRecurring !== undefined) updateData.is_recurring = body.isRecurring;
    if (body.recurringDay) updateData.recurring_day = body.recurringDay;

    const { data: event, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        club:clubs!club_id (*),
        host:users!host_id (
          id,
          name,
          nickname
        )
      `)
      .single();

    if (error || !event) {
      console.error("일정 수정 실패:", error);
      return NextResponse.json(
        { error: "일정 수정에 실패했습니다" },
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
    });
  } catch (error) {
    console.error("일정 수정 실패:", error);
    return NextResponse.json(
      { error: "일정 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/events/:id - 일정 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error("일정 삭제 실패:", error);
      return NextResponse.json(
        { error: "일정 삭제에 실패했습니다" },
        { status: 500 }
      );
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
