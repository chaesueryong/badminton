"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import RegionSelect from "@/components/RegionSelect";

type FeeType = "FREE" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export default function CreateClubPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [feeType, setFeeType] = useState<"FREE" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");

  const handleImageUpload = (url: string, path: string) => {
    setImageUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const province = formData.get("province") as string;
    const city = formData.get("city") as string;
    const region = province && city ? `${province} ${city}` : province || "";

    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      region,
      maxMembers: parseInt(formData.get("maxMembers") as string),
      membershipFee: feeType === "FREE" ? 0 : parseInt(formData.get("membershipFee") as string),
      feeType,
      minLevel: formData.get("minLevel") || null,
      maxLevel: formData.get("maxLevel") || null,
      imageUrl,
    };

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const club = await response.json();
        router.push(`/clubs/${club.id}`);
      } else {
        alert("모임 생성에 실패했습니다");
      }
    } catch (error) {
      console.error(error);
      alert("오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">배드민턴 모임 만들기</h1>
          <p className="text-gray-600 mt-2">새로운 배드민턴 동호회를 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 대표 이미지 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">모임 대표 이미지</h2>
            <ImageUpload
              bucket="clubs"
              onUpload={handleImageUpload}
            />
            <p className="text-sm text-gray-500 mt-2">
              * 모임을 잘 나타내는 이미지를 올려주세요 (선택사항)
            </p>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold">기본 정보</h2>

            {/* 모임 명 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                모임 명 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 강남 배드민턴 클럽"
              />
            </div>

            {/* 모임 소개 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                모임 소개
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="모임에 대해 자유롭게 소개해주세요&#10;- 모임 분위기&#10;- 활동 지역&#10;- 주요 활동&#10;- 기타 안내사항"
              />
            </div>

            {/* 활동 지역 */}
            <RegionSelect required={false} />
          </div>

          {/* 모임 설정 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold">모임 설정</h2>

            {/* 최대 인원 */}
            <div>
              <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-2">
                최대 인원 *
              </label>
              <input
                type="number"
                id="maxMembers"
                name="maxMembers"
                required
                min="2"
                max="500"
                defaultValue="50"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">2~500명</p>
            </div>

            {/* 실력 급수 제한 (범위) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                실력 급수 제한 (범위)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minLevel" className="block text-xs text-gray-600 mb-2">
                    최소 급수
                  </label>
                  <select
                    id="minLevel"
                    name="minLevel"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">제한 없음</option>
                    <option value="E_GRADE">E급 (초심자)</option>
                    <option value="D_GRADE">D급 (초급)</option>
                    <option value="C_GRADE">C급 (중급)</option>
                    <option value="B_GRADE">B급 (중상급)</option>
                    <option value="A_GRADE">A급 (상급)</option>
                    <option value="S_GRADE">S급 (특급)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="maxLevel" className="block text-xs text-gray-600 mb-2">
                    최대 급수
                  </label>
                  <select
                    id="maxLevel"
                    name="maxLevel"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      paddingRight: '2.5rem'
                    }}
                  >
                    <option value="">제한 없음</option>
                    <option value="E_GRADE">E급 (초심자)</option>
                    <option value="D_GRADE">D급 (초급)</option>
                    <option value="C_GRADE">C급 (중급)</option>
                    <option value="B_GRADE">B급 (중상급)</option>
                    <option value="A_GRADE">A급 (상급)</option>
                    <option value="S_GRADE">S급 (특급)</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                예: 최소 C급 ~ 최대 A급 = C급, B급, A급만 가입 가능
              </p>
            </div>

            {/* 회비 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                회비 유형 *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { value: "FREE" as FeeType, label: "무료", icon: "🎁" },
                  { value: "MONTHLY" as FeeType, label: "월 회비", icon: "📅" },
                  { value: "QUARTERLY" as FeeType, label: "분기 회비", icon: "📊" },
                  { value: "YEARLY" as FeeType, label: "년 회비", icon: "📆" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      console.log("Clicked:", type.value);
                      setFeeType(type.value);
                    }}
                    className={`p-3 rounded-lg border-2 transition ${
                      feeType === type.value
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>

              {/* 회비 금액 */}
              {feeType !== "FREE" && (
                <div>
                  <label htmlFor="membershipFee" className="block text-sm font-medium text-gray-700 mb-2">
                    회비 금액 (원) *
                  </label>
                  <input
                    type="number"
                    id="membershipFee"
                    name="membershipFee"
                    required={feeType === "MONTHLY" || feeType === "QUARTERLY" || feeType === "YEARLY"}
                    min="0"
                    step="1000"
                    defaultValue="30000"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {feeType === "MONTHLY" && "매월 납부하는 회비 금액"}
                    {feeType === "QUARTERLY" && "분기(3개월)마다 납부하는 회비 금액"}
                    {feeType === "YEARLY" && "연간 납부하는 회비 금액"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "생성 중..." : "모임 만들기"}
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              모임을 만들면 자동으로 모임장(운영진)이 됩니다
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
