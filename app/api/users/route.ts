import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// API 라우트는 동적으로 렌더링
export const dynamic = 'force-dynamic';

// GET /api/users - 사용자 목록 조회 (검색)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const region = searchParams.get("region");
    const minSkillLevel = searchParams.get("minSkillLevel");
    const maxSkillLevel = searchParams.get("maxSkillLevel");
    const gender = searchParams.get("gender");
    const preferredStyle = searchParams.get("preferredStyle");
    const minExperience = searchParams.get("minExperience");
    const maxExperience = searchParams.get("maxExperience");
    const minAge = searchParams.get("minAge");
    const maxAge = searchParams.get("maxAge");
    const sortBy = searchParams.get("sortBy") || "points";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 정렬 기준
    let orderColumn = 'points';
    let orderAscending = false;
    if (sortBy === "games") {
      orderColumn = 'totalGames';
    } else if (sortBy === "winRate") {
      // 승률은 계산 필드이므로 서버에서 정렬하기 어려움, points 기준으로 대체
      orderColumn = 'points';
    }

    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        name,
        nickname,
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
        age
      `, { count: 'exact' })
      .order(orderColumn, { ascending: orderAscending });

    // 검색 조건 추가
    if (search) {
      query = query.or(`name.ilike.%${search}%,nickname.ilike.%${search}%`);
    }
    if (region) {
      query = query.ilike('region', `%${region}%`);
    }

    // 성별 필터
    if (gender) {
      query = query.eq('gender', gender);
    }

    // 선호 스타일 필터
    if (preferredStyle) {
      query = query.eq('preferredStyle', preferredStyle);
    }

    // 경력 범위 필터
    if (minExperience) {
      query = query.gte('experience', parseFloat(minExperience));
    }
    if (maxExperience) {
      query = query.lte('experience', parseFloat(maxExperience));
    }

    // 나이 범위 필터
    if (minAge) {
      query = query.gte('age', parseInt(minAge));
    }
    if (maxAge) {
      query = query.lte('age', parseInt(maxAge));
    }

    // 실력 범위 필터 (간단한 필터, 정확한 순서는 프론트엔드에서 처리)
    if (minSkillLevel) {
      // Supabase는 enum 비교가 제한적이므로 여러 급수를 OR 조건으로 처리
      const skillLevels = ["BEGINNER", "D_GRADE", "C_GRADE", "INTERMEDIATE", "B_GRADE", "ADVANCED", "A_GRADE", "EXPERT", "S_GRADE"];
      const minIndex = skillLevels.indexOf(minSkillLevel);
      if (minIndex >= 0) {
        const validLevels = skillLevels.slice(minIndex);
        if (maxSkillLevel) {
          const maxIndex = skillLevels.indexOf(maxSkillLevel);
          if (maxIndex >= minIndex) {
            const filteredLevels = validLevels.slice(0, maxIndex - minIndex + 1);
            query = query.in('level', filteredLevels);
          }
        } else {
          query = query.in('level', validLevels);
        }
      }
    } else if (maxSkillLevel) {
      const skillLevels = ["BEGINNER", "D_GRADE", "C_GRADE", "INTERMEDIATE", "B_GRADE", "ADVANCED", "A_GRADE", "EXPERT", "S_GRADE"];
      const maxIndex = skillLevels.indexOf(maxSkillLevel);
      if (maxIndex >= 0) {
        const validLevels = skillLevels.slice(0, maxIndex + 1);
        query = query.in('level', validLevels);
      }
    }

    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("사용자 목록 조회 실패:", error);
      return NextResponse.json(
        { error: "사용자 목록 조회에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("사용자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: "사용자 목록 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
