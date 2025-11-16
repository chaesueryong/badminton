import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';

// POST /api/gyms/:id/reviews - 리뷰 작성
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { userId, rating, content } = await request.json();

    if (!userId || !rating || !content) {
      return NextResponse.json(
        { error: "모든 필드를 입력해주세요" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "평점은 1~5 사이여야 합니다" },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from('gym_reviews')
      .insert({
        gym_id: params.id,
        user_id: userId,
        rating,
        content,
      })
      .select(`
        *,
        user:users!user_id (
          id,
          name,
          nickname,
          profile_image
        )
      `)
      .single();

    if (error || !review) {
      console.error("리뷰 작성 실패:", error);
      return NextResponse.json(
        { error: "리뷰 작성에 실패했습니다" },
        { status: 500 }
      );
    }

    // 체육관 평점 업데이트
    const { data: allReviews } = await supabase
      .from('gym_reviews')
      .select('rating')
      .eq('gym_id', params.id);

    if (allReviews && allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0);
      const avgRating = totalRating / allReviews.length;

      await supabase
        .from('gyms')
        .update({
          rating: avgRating,
          review_count: allReviews.length,
        })
        .eq('id', params.id);
    }

    return NextResponse.json({
      ...review,
      gymId: review.gym_id,
      userId: review.user_id,
      createdAt: review.created_at,
      user: review.user ? {
        ...review.user,
        profileImage: review.user.profile_image,
      } : null,
    }, { status: 201 });
  } catch (error) {
    console.error("리뷰 작성 실패:", error);
    return NextResponse.json(
      { error: "리뷰 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}
