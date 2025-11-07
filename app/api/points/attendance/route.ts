import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// GET: 출석 정보 조회
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 한국 시간 기준 오늘 날짜 (UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60; // 9시간을 분으로
    const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000);
    const today = kstTime.toISOString().split("T")[0];

    // 출석 기록 조회
    const { data: attendanceRecords, error } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("userId", userId)
      .order("checkDate", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Error fetching attendance:", error);
      return NextResponse.json(
        { error: "Failed to fetch attendance" },
        { status: 500 }
      );
    }

    // 오늘 출석 체크 여부
    const hasCheckedToday = attendanceRecords?.some(
      (record) => record.checkDate === today
    );

    // 연속 출석일 계산
    let streak = 0;
    if (attendanceRecords && attendanceRecords.length > 0) {
      const sortedRecords = [...attendanceRecords].sort(
        (a, b) =>
          new Date(b.checkDate + "T00:00:00").getTime() - new Date(a.checkDate + "T00:00:00").getTime()
      );

      // 한국 시간 기준 오늘 또는 어제부터 시작
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
      const kstToday = new Date(now.getTime() + kstOffset);
      const todayStr = kstToday.toISOString().split("T")[0];

      // 오늘 출석했으면 오늘부터, 안했으면 어제부터 시작
      let expectedDateStr = hasCheckedToday ? todayStr : (() => {
        const yesterday = new Date(kstToday);
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split("T")[0];
      })();

      for (const record of sortedRecords) {
        // 날짜 문자열로 직접 비교
        if (record.checkDate === expectedDateStr) {
          streak++;
          // 다음 반복에서는 하루 전 날짜를 기대
          const currentDate = new Date(expectedDateStr + "T12:00:00"); // 정오 기준으로 설정하여 날짜 경계 문제 방지
          currentDate.setDate(currentDate.getDate() - 1);
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          expectedDateStr = `${year}-${month}-${day}`;
        } else {
          // 연속이 끊김
          break;
        }
      }
    }

    return NextResponse.json({
      hasCheckedToday,
      streak,
      lastCheckDate: attendanceRecords?.[0]?.checkDate || null,
    });
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: 출석 체크
export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 한국 시간 기준 오늘 날짜 (UTC+9)
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
    const kstTime = new Date(now.getTime() + kstOffset);
    const today = kstTime.toISOString().split("T")[0];

    // 오늘 이미 출석 체크했는지 확인
    const { data: existingCheck } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("userId", userId)
      .eq("checkDate", today)
      .single();

    if (existingCheck) {
      return NextResponse.json(
        { error: "Already checked in today" },
        { status: 400 }
      );
    }

    // 현재 연속 출석일 계산
    const { data: attendanceRecords } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("userId", userId)
      .order("checkDate", { ascending: false })
      .limit(30);

    let currentStreak = 0;
    if (attendanceRecords && attendanceRecords.length > 0) {
      const sortedRecords = [...attendanceRecords].sort(
        (a, b) =>
          new Date(b.checkDate + "T00:00:00").getTime() - new Date(a.checkDate + "T00:00:00").getTime()
      );

      // 한국 시간 기준 어제 날짜부터 시작 (오늘은 아직 체크 안 했으므로)
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000; // 9시간을 밀리초로
      const kstYesterday = new Date(now.getTime() + kstOffset);
      kstYesterday.setDate(kstYesterday.getDate() - 1);
      let expectedDateStr = kstYesterday.toISOString().split("T")[0];

      for (const record of sortedRecords) {
        // 날짜 문자열로 직접 비교
        if (record.checkDate === expectedDateStr) {
          currentStreak++;
          // 다음 반복에서는 하루 전 날짜를 기대
          const currentDate = new Date(expectedDateStr + "T12:00:00"); // 정오 기준으로 설정하여 날짜 경계 문제 방지
          currentDate.setDate(currentDate.getDate() - 1);
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          expectedDateStr = `${year}-${month}-${day}`;
        } else {
          // 연속이 끊김
          break;
        }
      }
    }

    // 새로운 연속 출석일 (오늘 포함)
    const newStreak = currentStreak + 1;

    // 기본 포인트
    let pointsEarned = 10;

    // 100일 단위 보너스 체크
    const bonusMessage: string[] = [];
    if (newStreak % 100 === 0) {
      pointsEarned += 100;
      bonusMessage.push(`🎉 ${newStreak}일 연속 출석 달성! +100 보너스!`);
    }

    // 출석 체크 기록 생성
    const { error: insertError } = await supabase
      .from("attendance_records")
      .insert({
        userId,
        checkDate: today,
        pointsEarned,
      });

    if (insertError) {
      console.error("Error inserting attendance:", insertError);
      return NextResponse.json(
        { error: "Failed to check in" },
        { status: 500 }
      );
    }

    // 포인트 추가
    const { error: updateError } = await supabase.rpc("increment_points", {
      user_id: userId,
      points_to_add: pointsEarned,
    });

    if (updateError) {
      console.error("Error updating points:", updateError);
      return NextResponse.json(
        { error: "Failed to update points" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pointsEarned,
      streak: newStreak,
      bonusMessage: bonusMessage.length > 0 ? bonusMessage.join("\n") : null,
      message: "출석 체크 완료!",
    });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
