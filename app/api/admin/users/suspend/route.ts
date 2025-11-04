import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// POST: 사용자 계정 정지
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 관리자 권한 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    // 관리자 권한 체크
    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, duration, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "사용자 ID와 정지 사유는 필수입니다" },
        { status: 400 }
      );
    }

    // 정지 종료 시간 계산 (duration이 있는 경우)
    let suspendedUntil = null;
    if (duration) {
      const now = new Date();
      suspendedUntil = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000); // duration은 일 단위
    }

    // 사용자 정지 상태 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({
        isSuspended: true,
        suspendedUntil: suspendedUntil?.toISOString() || null,
        suspensionReason: reason,
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    // 정지 기록 생성
    const { data: suspension, error: suspensionError } = await supabase
      .from("user_suspensions")
      .insert({
        userId,
        suspendedBy: user.id,
        suspendedUntil: suspendedUntil?.toISOString() || null,
        reason,
        isActive: true,
      })
      .select()
      .single();

    if (suspensionError) {
      throw suspensionError;
    }

    return NextResponse.json({
      message: "사용자 계정이 정지되었습니다",
      suspension,
    });
  } catch (error: any) {
    console.error("계정 정지 오류:", error);
    return NextResponse.json(
      { error: error.message || "계정 정지에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE: 사용자 계정 정지 해제
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 관리자 권한 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    // 관리자 권한 체크
    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, liftReason } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID는 필수입니다" },
        { status: 400 }
      );
    }

    // 사용자 정지 상태 해제
    const { error: updateError } = await supabase
      .from("users")
      .update({
        isSuspended: false,
        suspendedUntil: null,
        suspensionReason: null,
      })
      .eq("id", userId);

    if (updateError) {
      throw updateError;
    }

    // 활성 정지 기록 업데이트
    const { error: suspensionError } = await supabase
      .from("user_suspensions")
      .update({
        isActive: false,
        liftedAt: new Date().toISOString(),
        liftedBy: user.id,
        liftReason: liftReason || "관리자에 의해 해제됨",
      })
      .eq("userId", userId)
      .eq("isActive", true);

    if (suspensionError) {
      throw suspensionError;
    }

    return NextResponse.json({
      message: "계정 정지가 해제되었습니다",
    });
  } catch (error: any) {
    console.error("계정 정지 해제 오류:", error);
    return NextResponse.json(
      { error: error.message || "계정 정지 해제에 실패했습니다" },
      { status: 500 }
    );
  }
}
