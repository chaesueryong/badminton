import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/clubs/:id - 클럽 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select(`
        *,
        manager:users!manager_id (
          id,
          name,
          nickname,
          level,
          profile_image
        )
      `)
      .eq('id', params.id)
      .single();

    if (clubError || !club) {
      return NextResponse.json(
        { error: "클럽을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 멤버 조회
    const { data: members } = await supabase
      .from('club_members')
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
      .eq('club_id', params.id)
      .order('created_at', { ascending: true });

    // 미래 이벤트 조회
    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('club_id', params.id)
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(5);

    return NextResponse.json({
      ...club,
      managerId: club.manager_id,
      maxMembers: club.max_members,
      createdAt: club.created_at,
      updatedAt: club.updated_at,
      manager: club.manager ? {
        ...club.manager,
        profileImage: club.manager.profile_image,
      } : null,
      members: members?.map((member: any) => ({
        ...member,
        clubId: member.club_id,
        userId: member.user_id,
        createdAt: member.created_at,
        user: member.user ? {
          ...member.user,
          profileImage: member.user.profile_image,
        } : null,
      })) || [],
      events: events?.map((event: any) => ({
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
      })) || [],
    });
  } catch (error) {
    console.error("클럽 상세 조회 실패:", error);
    return NextResponse.json(
      { error: "클럽 상세 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/clubs/:id - 클럽 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // camelCase를 snake_case로 변환
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.description) updateData.description = body.description;
    if (body.region) updateData.region = body.region;
    if (body.level) updateData.level = body.level;
    if (body.maxMembers) updateData.max_members = body.maxMembers;
    if (body.location) updateData.location = body.location;
    if (body.regularSchedule) updateData.regular_schedule = body.regularSchedule;
    if (body.images) updateData.images = body.images;
    if (body.tags) updateData.tags = body.tags;

    const { data: club, error } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        manager:users!manager_id (
          id,
          name,
          nickname
        )
      `)
      .single();

    if (error || !club) {
      console.error("클럽 수정 실패:", error);
      return NextResponse.json(
        { error: "클럽 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...club,
      managerId: club.manager_id,
      maxMembers: club.max_members,
      regularSchedule: club.regular_schedule,
      createdAt: club.created_at,
      updatedAt: club.updated_at,
    });
  } catch (error) {
    console.error("클럽 수정 실패:", error);
    return NextResponse.json(
      { error: "클럽 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/:id - 클럽 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error("클럽 삭제 실패:", error);
      return NextResponse.json(
        { error: "클럽 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("클럽 삭제 실패:", error);
    return NextResponse.json(
      { error: "클럽 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
