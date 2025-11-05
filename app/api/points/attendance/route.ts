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
    const today = new Date().toISOString().split("T")[0];
    const hasCheckedToday = attendanceRecords?.some(
      (record) => record.checkDate === today
    );

    // 연속 출석일 계산
    let streak = 0;
    if (attendanceRecords && attendanceRecords.length > 0) {
      const sortedRecords = [...attendanceRecords].sort(
        (a, b) =>
          new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime()
      );

      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      for (const record of sortedRecords) {
        const recordDate = new Date(record.checkDate);
        recordDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // 오늘이거나 (daysDiff === 0) 어제거나 (daysDiff === 1 && streak === 0) 연속된 날짜면 (daysDiff === 0)
        if (daysDiff === 0 || (daysDiff === 1 && streak === 0)) {
          streak++;
          currentDate = new Date(recordDate);
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (daysDiff === 1) {
          // 연속된 날짜
          streak++;
          currentDate = new Date(recordDate);
          currentDate.setDate(currentDate.getDate() - 1);
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
    const today = new Date().toISOString().split("T")[0];

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
          new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime()
      );

      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (const record of sortedRecords) {
        const recordDate = new Date(record.checkDate);
        recordDate.setHours(0, 0, 0, 0);

        const daysDiff = Math.floor(
          (checkDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // 어제거나 (daysDiff === 1 && currentStreak === 0) 연속된 날짜면
        if (daysDiff === 1 && currentStreak === 0) {
          // 어제 출석한 경우
          currentStreak++;
          checkDate = new Date(recordDate);
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (daysDiff === 1) {
          // 연속된 날짜
          currentStreak++;
          checkDate = new Date(recordDate);
          checkDate.setDate(checkDate.getDate() - 1);
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
