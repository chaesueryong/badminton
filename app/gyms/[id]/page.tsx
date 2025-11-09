"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Gym {
  id: string;
  name: string;
  region: string;
  address: string;
  phone: string;
  courts?: number;
  parking?: boolean;
  shower?: boolean;
  openTime?: string;
  closeTime?: string;
  pricePerHour?: number;
  rating: number;
  reviewCount: number;
  description?: string;
  reviews?: Review[];
}

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    name: string;
    nickname: string;
  } | null;
}

export default function GymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchGym = async () => {
      try {
        // 현재 사용자 확인
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 체육관 상세 정보 가져오기
        const response = await fetch(`/api/gyms/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch gym');

        const data = await response.json();
        setGym(data);
      } catch (error) {
        console.error("체육관 정보 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchGym();
    }
  }, [params.id]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    if (!reviewContent.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/gyms/${params.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          rating,
          content: reviewContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      // 리뷰 작성 성공 후 페이지 새로고침
      const gymResponse = await fetch(`/api/gyms/${params.id}`);
      const data = await gymResponse.json();
      setGym(data);

      setShowReviewForm(false);
      setReviewContent("");
      setRating(5);
      alert("리뷰가 등록되었습니다!");
    } catch (error) {
      console.error("리뷰 등록 실패:", error);
      alert("리뷰 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">체육관 정보를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 뒤로 가기 */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          돌아가기
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* 헤더 이미지 */}
          <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
            <span className="text-white text-9xl">🏸</span>
          </div>

          {/* 내용 */}
          <div className="p-6">
            {/* 제목과 평점 */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {gym.name}
                </h1>
                <p className="text-gray-600">{gym.region}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center mb-1">
                  <span className="text-yellow-500 text-xl mr-1">⭐</span>
                  <span className="text-2xl font-bold">{gym.rating.toFixed(1)}</span>
                </div>
                <p className="text-sm text-gray-500">
                  리뷰 {gym.reviewCount}개
                </p>
              </div>
            </div>

            {/* 소개 */}
            {gym.description && (
              <div className="mb-6">
                <p className="text-gray-700">{gym.description}</p>
              </div>
            )}

            {/* 상세 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">📍 위치</h3>
                <p className="text-gray-900">{gym.address}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">📞 연락처</h3>
                <p className="text-gray-900">{gym.phone}</p>
              </div>

              {gym.openTime && gym.closeTime && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">🕐 운영시간</h3>
                  <p className="text-gray-900">
                    {gym.openTime} - {gym.closeTime}
                  </p>
                </div>
              )}

              {gym.pricePerHour && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">💰 가격</h3>
                  <p className="text-xl font-bold text-blue-600">
                    시간당 {gym.pricePerHour.toLocaleString()}원
                  </p>
                </div>
              )}
            </div>

            {/* 시설 정보 */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">시설 정보</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gym.courts && (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl mb-2">🏟️</p>
                    <p className="text-sm text-gray-600">코트</p>
                    <p className="font-semibold">{gym.courts}개</p>
                  </div>
                )}
                <div className={`p-4 rounded-lg text-center ${gym.parking ? "bg-green-50" : "bg-gray-50"}`}>
                  <p className="text-2xl mb-2">🚗</p>
                  <p className="text-sm text-gray-600">주차</p>
                  <p className="font-semibold">{gym.parking ? "가능" : "불가"}</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${gym.shower ? "bg-blue-50" : "bg-gray-50"}`}>
                  <p className="text-2xl mb-2">🚿</p>
                  <p className="text-sm text-gray-600">샤워실</p>
                  <p className="font-semibold">{gym.shower ? "있음" : "없음"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl mb-2">⭐</p>
                  <p className="text-sm text-gray-600">평점</p>
                  <p className="font-semibold">{gym.rating.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* 리뷰 섹션 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  리뷰 ({gym.reviews?.length || 0})
                </h3>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
                >
                  리뷰 작성
                </button>
              </div>

              {/* 리뷰 작성 폼 */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-gray-50 p-4 rounded-lg mb-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      평점
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl ${
                            star <= rating ? "text-yellow-500" : "text-gray-300"
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      리뷰 내용
                    </label>
                    <textarea
                      rows={4}
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2"
                      placeholder="체육관에 대한 솔직한 리뷰를 남겨주세요"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                    >
                      {submitting ? "등록 중..." : "등록"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}

              {/* 리뷰 목록 */}
              <div className="space-y-4">
                {gym.reviews && gym.reviews.length > 0 ? (
                  gym.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            {review.user?.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-semibold">{review.user?.name || '익명'}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-yellow-500 mr-1">⭐</span>
                          <span className="font-semibold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
