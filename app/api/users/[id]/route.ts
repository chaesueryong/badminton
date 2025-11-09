import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/users/:id - 사용자 프로필 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: user, error } = await (supabaseAdmin as any)
      .from('users')
      .select(`
        id,
        email,
        name,
        nickname,
        phone,
        level,
        region,
        "profileImage",
        bio,
        "totalGames",
        wins,
        points,
        gender,
        "preferredStyle",
        experience,
        age,
        birthdate,
        "createdAt"
      `)
      .eq('id', params.id)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 관련 카운트 조회
    const [clubsCount, membershipsCount, eventsCount, meetingsCount, postsCount] = await Promise.all([
      (supabaseAdmin as any).from('clubs').select('id', { count: 'exact', head: true }).eq('host_id', params.id),
      (supabaseAdmin as any).from('club_members').select('id', { count: 'exact', head: true }).eq('user_id', params.id),
      (supabaseAdmin as any).from('events').select('id', { count: 'exact', head: true }).eq('host_id', params.id),
      (supabaseAdmin as any).from('meetings').select('id', { count: 'exact', head: true }).eq('host_id', params.id),
      (supabaseAdmin as any).from('posts').select('id', { count: 'exact', head: true }).eq('author_id', params.id),
    ]);

    return NextResponse.json({
      ...user,
      _count: {
        hostedClubs: clubsCount.count || 0,
        clubMemberships: membershipsCount.count || 0,
        hostedEvents: eventsCount.count || 0,
        hostedMeetings: meetingsCount.count || 0,
        posts: postsCount.count || 0,
      },
    });
  } catch (error) {
    console.error("사용자 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/:id - 프로필 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log("API PATCH - Received data:", body);

    // 비밀번호 필드는 제외 (별도 API로 처리)
    const { password, email, totalGames, createdAt, ...updateData } = body;

    // camelCase를 snake_case로 변환
    const snakeCaseData: any = {};
    if (updateData.nickname) snakeCaseData.nickname = updateData.nickname;
    if (updateData.name) snakeCaseData.name = updateData.name;
    if (updateData.phone) snakeCaseData.phone = updateData.phone;
    if (updateData.level) snakeCaseData.level = updateData.level;
    if (updateData.region) snakeCaseData.region = updateData.region;
    if (updateData.bio) snakeCaseData.bio = updateData.bio;
    if (updateData.wins !== undefined) snakeCaseData.wins = updateData.wins;
    if (updateData.points !== undefined) snakeCaseData.points = updateData.points;
    // profileImage 처리 (ImageUpload 컴포넌트에서 전송)
    if (updateData.profileImage !== undefined) snakeCaseData.profileImage = updateData.profileImage;
    if (updateData.profile_image !== undefined) snakeCaseData.profileImage = updateData.profile_image;

    // Handle new profile fields - convert empty strings to null for enum fields
    if (updateData.gender !== undefined) {
      snakeCaseData.gender = updateData.gender === "" ? null : updateData.gender;
    }
    if (updateData.preferredStyle !== undefined) {
      snakeCaseData.preferredStyle = updateData.preferredStyle === "" ? null : updateData.preferredStyle;
    }
    if (updateData.experience !== undefined) {
      snakeCaseData.experience = updateData.experience === "" ? null : updateData.experience;
    }
    if (updateData.age !== undefined) {
      snakeCaseData.age = updateData.age === "" ? null : updateData.age;
    }
    if (updateData.birthdate !== undefined) {
      if (updateData.birthdate === "") {
        snakeCaseData.birthdate = null;
      } else {
        // YYYY.MM.DD 형식을 YYYY-MM-DD로 변환
        snakeCaseData.birthdate = updateData.birthdate.replace(/\./g, '-');
      }
    }

    console.log("API PATCH - Data to update:", snakeCaseData);

    const { data: user, error } = await (supabaseAdmin as any)
      .from('users')
      .update(snakeCaseData)
      .eq('id', params.id)
      .select(`
        id,
        email,
        name,
        nickname,
        phone,
        level,
        region,
        "profileImage",
        bio,
        "totalGames",
        wins,
        points,
        gender,
        "preferredStyle",
        experience,
        age,
        birthdate
      `)
      .single();

    if (error || !user) {
      console.error("Supabase update error:", error);
      console.error("Update data:", snakeCaseData);
      return NextResponse.json(
        { error: "프로필 수정에 실패했습니다", details: error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("프로필 수정 실패:", error);
    return NextResponse.json(
      { error: "프로필 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}
