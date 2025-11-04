import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET: 모든 모임 조회 (필터링 및 페이지네이션 지원)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    const region = searchParams.get("region");
    const location = searchParams.get("location");
    const levelMin = searchParams.get("levelMin");
    const levelMax = searchParams.get("levelMax");
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("meetings")
      .select("*, host:users!hostId(id, name, nickname, level, profileImage)", { count: "exact" })
      .eq("status", "OPEN")
      .order("date", { ascending: true });

    if (region) {
      query = query.ilike("region", `%${region}%`);
    }

    if (location) {
      query = query.ilike("location", `%${location}%`);
    }

    if (levelMin) {
      query = query.gte("levelMin", levelMin);
    }

    if (levelMax) {
      query = query.lte("levelMax", levelMax);
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query
        .gte("date", startOfDay.toISOString())
        .lte("date", endOfDay.toISOString());
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      meetings: data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("모임 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "모임 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 모임 생성
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
    const {
      title,
      description,
      region,
      date,
      startTime,
      endTime,
      location,
      address,
      maxParticipants,
      levelMin,
      levelMax,
      fee,
      feePeriod,
      requiredGender,
      ageMin,
      ageMax,
      thumbnailImage,
      images,
    } = body;

    // 데이터 검증 - region은 필수, date/time/location/address는 선택 (정기 모임의 경우)
    if (!title || !maxParticipants) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: meeting, error } = await supabase
      .from("meetings")
      .insert({
        title,
        description,
        region,
        date: date ? new Date(date).toISOString() : null,
        startTime: startTime || null,
        endTime: endTime || null,
        location: location || null,
        address: address || null,
        maxParticipants: parseInt(maxParticipants),
        levelMin: levelMin || null,
        levelMax: levelMax || null,
        fee: parseInt(fee) || 0,
        feePeriod: feePeriod || null,
        requiredGender: requiredGender || 'ANY',
        ageMin: ageMin ? parseInt(ageMin) : null,
        ageMax: ageMax ? parseInt(ageMax) : null,
        thumbnailImage: thumbnailImage || null,
        images: images || [],
        hostId: user.id,
        status: "OPEN",
        currentCount: 0,
        views: 0,
      })
      .select("*, host:users!hostId(id, name, nickname)")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(meeting, { status: 201 });
  } catch (error: any) {
    console.error("모임 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "모임 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
