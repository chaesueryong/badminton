"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import RegionSelect from "@/components/RegionSelect";

export default function RegisterGymPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [region, setRegion] = useState({ province: "", city: "" });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("로그인이 필요합니다");
        router.push("/login");
      }
    };
    checkAuth();
  }, [router, supabase]);

  const handleRegionChange = (province: string, city: string) => {
    setRegion({ province, city });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const combinedRegion = region.city
      ? `${region.province} ${region.city}`
      : region.province;

    const data = {
      name: formData.get("name"),
      region: combinedRegion,
      address: formData.get("address"),
      phone: formData.get("phone"),
      courts: parseInt(formData.get("courts") as string),
      parking: formData.get("parking") === "on",
      shower: formData.get("shower") === "on",
      rental: formData.get("rental") === "on",
      locker: formData.get("locker") === "on",
      store: formData.get("store") === "on",
      openTime: formData.get("openTime"),
      closeTime: formData.get("closeTime"),
      pricePerHour: parseInt(formData.get("pricePerHour") as string),
      description: formData.get("description"),
    };

    try {
      const response = await fetch("/api/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert("체육관 등록 신청이 완료되었습니다. 관리자 승인 후 체육관 목록에 표시됩니다.");
        router.push("/gyms");
      } else {
        const error = await response.json();
        alert(error.error || "체육관 등록에 실패했습니다");
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
      <div className="container mx-auto px-4 max-w-3xl">
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
          <h1 className="text-3xl font-bold text-gray-900">배드민턴 체육관 등록</h1>
          <p className="text-gray-600 mt-2">근처 배드민턴 체육관을 등록해주세요. 관리자 승인 후 게시됩니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold">기본 정보</h2>

            {/* 체육관명 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                체육관명 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 강남 배드민턴 체육관"
              />
            </div>

            {/* 지역 */}
            <div>
              <RegionSelect
                showLabel={true}
                required={true}
                onChange={handleRegionChange}
              />
            </div>

            {/* 상세 주소 */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                상세 주소 *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 테헤란로 123번길 45"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 02-1234-5678"
              />
            </div>
          </div>

          {/* 시설 정보 */}
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <h2 className="text-lg font-semibold">시설 정보</h2>

            {/* 코트 수 */}
            <div>
              <label htmlFor="courts" className="block text-sm font-medium text-gray-700 mb-2">
                코트 수 *
              </label>
              <input
                type="number"
                id="courts"
                name="courts"
                required
                min="1"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 4"
              />
            </div>

            {/* 편의시설 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                편의시설
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="parking"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">주차장</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="shower"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">샤워실</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="rental"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">대여</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="locker"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">라커룸</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="store"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">매점</span>
                </label>
              </div>
            </div>

            {/* 운영 시간 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="openTime" className="block text-sm font-medium text-gray-700 mb-2">
                  오픈 시간
                </label>
                <input
                  type="time"
                  id="openTime"
                  name="openTime"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="closeTime" className="block text-sm font-medium text-gray-700 mb-2">
                  마감 시간
                </label>
                <input
                  type="time"
                  id="closeTime"
                  name="closeTime"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 시간당 가격 */}
            <div>
              <label htmlFor="pricePerHour" className="block text-sm font-medium text-gray-700 mb-2">
                시간당 가격 (원) *
              </label>
              <input
                type="number"
                id="pricePerHour"
                name="pricePerHour"
                required
                min="0"
                step="1000"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 30000"
              />
            </div>

            {/* 설명 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                체육관 설명
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="체육관의 특징이나 안내사항을 입력해주세요"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isSubmitting ? "등록 중..." : "등록 신청"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
