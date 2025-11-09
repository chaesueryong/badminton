import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET: 모든 클럽 조회 (필터링 지원)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const region = searchParams.get("region");
    const minLevel = searchParams.get("minLevel");
    const maxLevel = searchParams.get("maxLevel");

    let query = supabase
      .from("clubs")
      .select("*")
      .eq("status", "RECRUITING")
      .order("createdAt", { ascending: false });

    if (region) {
      query = query.ilike("region", `%${region}%`);
    }

    if (minLevel) {
      query = query.gte("minLevel", minLevel);
    }

    if (maxLevel) {
      query = query.lte("maxLevel", maxLevel);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("클럽 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "클럽 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 클럽 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증되지 않았습니다" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      region,
      maxMembers,
      membershipFee,
      feeType,
      minLevel,
      maxLevel,
      imageUrl,
    } = body;

    const { data: club, error } = await supabase
      .from("clubs")
      .insert({
        name,
        description,
        region,
        maxMembers,
        membershipFee,
        feeType,
        minLevel,
        maxLevel,
        imageUrl,
        managerId: user.id,
        currentMembers: 1,
        status: "RECRUITING",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 생성자를 클럽 멤버로 추가
    await supabase.from("club_members").insert({
      clubId: club.id,
      userId: user.id,
      role: "MANAGER",
      status: "ACTIVE",
    });

    return NextResponse.json(club);
  } catch (error: any) {
    console.error("클럽 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "클럽 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
