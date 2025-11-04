import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// GET: 모든 체육관 조회 (필터링 및 페이지네이션 지원)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { searchParams } = new URL(request.url);

    const region = searchParams.get("region");
    const minCourts = searchParams.get("minCourts");
    const parking = searchParams.get("parking");
    const shower = searchParams.get("shower");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("gyms")
      .select("*", { count: "exact" })
      .eq("approval_status", "APPROVED")
      .order("rating", { ascending: false });

    if (region) {
      query = query.ilike("region", `%${region}%`);
    }

    if (minCourts) {
      query = query.gte("courts", parseInt(minCourts));
    }

    if (parking === "true") {
      query = query.eq("parking", true);
    }

    if (shower === "true") {
      query = query.eq("shower", true);
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      gyms: data,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error("체육관 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "체육관 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 체육관 등록 (누구나 가능, 관리자 승인 필요)
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
      name,
      region,
      address,
      phone,
      courts,
      parking,
      shower,
      rental,
      locker,
      store,
      openTime,
      closeTime,
      pricePerHour,
      description,
      images,
    } = body;

    // 필수 필드 검증
    if (!name || !region || !address || !courts || !pricePerHour) {
      return NextResponse.json(
        { error: "필수 항목을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    const { data: gym, error } = await supabase
      .from("gyms")
      .insert({
        name,
        region,
        address,
        phone: phone || null,
        courts: parseInt(courts),
        parking: parking || false,
        shower: shower || false,
        rental: rental || false,
        locker: locker || false,
        store: store || false,
        openTime: openTime || null,
        closeTime: closeTime || null,
        pricePerHour: parseInt(pricePerHour),
        description: description || null,
        images: images || [],
        rating: 0,
        reviewCount: 0,
        approval_status: "PENDING",
        registeredBy: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(gym, { status: 201 });
  } catch (error: any) {
    console.error("체육관 등록 오류:", error);
    return NextResponse.json(
      { error: error.message || "체육관 등록에 실패했습니다" },
      { status: 500 }
    );
  }
}
