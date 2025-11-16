import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// GET /api/gyms/:id - 체육관 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', params.id)
      .single();

    if (gymError || !gym) {
      return NextResponse.json(
        { error: "체육관을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 리뷰 조회
    const { data: reviews } = await supabase
      .from('gym_reviews')
      .select(`
        *,
        user:users!user_id (
          id,
          name,
          nickname,
          profile_image
        )
      `)
      .eq('gym_id', params.id)
      .order('created_at', { ascending: false });

    // 이벤트 및 모임 카운트
    const [eventsCount, meetingsCount] = await Promise.all([
      supabase.from('events').select('id', { count: 'exact', head: true }).eq('gym_id', params.id),
      supabase.from('meetings').select('id', { count: 'exact', head: true }).eq('gym_id', params.id),
    ]);

    return NextResponse.json({
      ...gym,
      reviewCount: gym.review_count,
      createdAt: gym.created_at,
      updatedAt: gym.updated_at,
      reviews: reviews?.map((review: any) => ({
        ...review,
        gymId: review.gym_id,
        userId: review.user_id,
        createdAt: review.created_at,
        user: review.user ? {
          ...review.user,
          profileImage: review.user.profile_image,
        } : null,
      })) || [],
      _count: {
        events: eventsCount.count || 0,
        meetings: meetingsCount.count || 0,
      },
    });
  } catch (error) {
    console.error("체육관 상세 조회 실패:", error);
    return NextResponse.json(
      { error: "체육관 상세 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/gyms/:id - 체육관 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // camelCase를 snake_case로 변환
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.address) updateData.address = body.address;
    if (body.region) updateData.region = body.region;
    if (body.phone) updateData.phone = body.phone;
    if (body.description) updateData.description = body.description;
    if (body.amenities) updateData.amenities = body.amenities;
    if (body.images) updateData.images = body.images;

    const { data: gym, error } = await supabase
      .from('gyms')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error || !gym) {
      console.error("체육관 수정 실패:", error);
      return NextResponse.json(
        { error: "체육관 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...gym,
      reviewCount: gym.review_count,
      createdAt: gym.created_at,
      updatedAt: gym.updated_at,
    });
  } catch (error) {
    console.error("체육관 수정 실패:", error);
    return NextResponse.json(
      { error: "체육관 수정에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/gyms/:id - 체육관 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('gyms')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error("체육관 삭제 실패:", error);
      return NextResponse.json(
        { error: "체육관 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("체육관 삭제 실패:", error);
    return NextResponse.json(
      { error: "체육관 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
