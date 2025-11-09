import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; scheduleId: string } }
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const { scheduleId } = params;

    // Check if user is participant
    const { data: participant, error: findError } = await supabase
      .from("schedule_participants")
      .select("id")
      .eq("scheduleId", scheduleId)
      .eq("userId", user.id)
      .maybeSingle();

    if (findError || !participant) {
      return NextResponse.json(
        { error: "참여 중인 일정이 아닙니다" },
        { status: 404 }
      );
    }

    // Get schedule info
    const { data: schedule } = await supabase
      .from("meeting_schedules")
      .select("currentCount")
      .eq("id", scheduleId)
      .single();

    if (!schedule) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Remove participant
    const { error: deleteError } = await supabase
      .from("schedule_participants")
      .delete()
      .eq("id", participant.id);

    if (deleteError) {
      throw deleteError;
    }

    // Update schedule current count
    const { error: updateError } = await supabase
      .from("meeting_schedules")
      .update({
        currentCount: Math.max(0, schedule.currentCount - 1),
      })
      .eq("id", scheduleId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Schedule leave error:", error);
    return NextResponse.json(
      { error: error.message || "일정 취소에 실패했습니다" },
      { status: 500 }
    );
  }
}
