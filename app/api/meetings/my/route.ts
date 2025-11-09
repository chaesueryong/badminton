import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않았습니다" },
        { status: 401 }
      );
    }

    // 내가 참여 중인 모임 조회
    const { data: participatingMeetings, error: participatingError } = await supabase
      .from('meeting_participants')
      .select(`
        meetingId,
        meetings (
          id,
          title,
          region,
          location,
          date,
          currentCount,
          maxParticipants,
          levelMin,
          levelMax,
          fee,
          status,
          hostId
        )
      `)
      .eq('userId', user.id);

    if (participatingError) {
      console.error('참여 모임 조회 오류:', participatingError);
    }

    // 내가 호스팅하는 모임 조회
    const { data: hostedMeetings, error: hostedError } = await supabase
      .from('meetings')
      .select('*, host:users!hostId(id, name, nickname, level, profileImage)')
      .eq('hostId', user.id);

    if (hostedError) {
      console.error('호스팅 모임 조회 오류:', hostedError);
    }

    // 모임 데이터 병합 및 중복 제거
    const allMeetings = new Map();

    // 호스팅 모임 추가
    hostedMeetings?.forEach(meeting => {
      if (meeting && meeting.id) {
        allMeetings.set(meeting.id, {
          ...meeting,
          isHost: true,
          isParticipant: false
        });
      }
    });

    // 참여 모임 추가 (호스팅 모임과 중복되지 않은 것만)
    participatingMeetings?.forEach((participation: any) => {
      const meeting = participation?.meetings;
      if (meeting && typeof meeting === 'object' && !Array.isArray(meeting) && meeting.id && !allMeetings.has(meeting.id)) {
        allMeetings.set(meeting.id, {
          ...meeting,
          isHost: false,
          isParticipant: true
        });
      }
    });

    const meetings = Array.from(allMeetings.values()).sort((a, b) => {
      // 날짜순으로 정렬 (최신 순)
      const dateA = a?.date ? new Date(a.date).getTime() : 0;
      const dateB = b?.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("내 모임 조회 실패:", error);
    return NextResponse.json(
      { error: "모임 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}