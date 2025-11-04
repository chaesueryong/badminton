import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const body = await request.json();
    const { nickname, phone, level, region, gender, preferredStyle, experience, age } = body;

    if (!nickname || !level || !gender || !preferredStyle || experience === undefined || !age) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // 닉네임 중복 체크
    const { data: existingNickname } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .maybeSingle();

    if (existingNickname && existingNickname.id !== user.id) {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임입니다" },
        { status: 400 }
      );
    }

    // 사용자 정보 확인
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let result;

    if (!existingUser) {
      // 사용자가 없으면 생성
      const now = new Date().toISOString();
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          name: nickname,  // 닉네임을 name으로 사용
          nickname,
          phone,
          level,
          region,
          gender,
          preferredStyle,
          experience,
          age,
          profileImage: '/default-avatar.png',  // 소셜 이미지 사용 안함, 기본 아이콘
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      result = newUser;
    } else {
      // 사용자 정보 업데이트
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          name: nickname,  // 닉네임을 name으로도 업데이트
          nickname,
          phone,
          level,
          region,
          gender,
          preferredStyle,
          experience,
          age,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      result = updatedUser;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("프로필 업데이트 오류:", error);
    return NextResponse.json(
      { error: error.message || "프로필 업데이트에 실패했습니다" },
      { status: 500 }
    );
  }
}
