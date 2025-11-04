"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import RegionSelect from "@/components/RegionSelect";

const levels = [
  { value: "S_GRADE", label: "자강" },
  { value: "A_GRADE", label: "A조" },
  { value: "B_GRADE", label: "B조" },
  { value: "C_GRADE", label: "C조" },
  { value: "D_GRADE", label: "D조" },
  { value: "E_GRADE", label: "E조" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      } else {
        router.push("/login");
      }
    };
    getUserData();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const nickname = formData.get("nickname") as string;
    const phone = formData.get("phone") as string;
    const level = formData.get("level") as string;
    const province = formData.get("province") as string;
    const city = formData.get("city") as string;
    const region = province && city ? `${province} ${city}` : province || "";
    const gender = formData.get("gender") as string;
    const preferredStyle = formData.get("preferredStyle") as string;
    const experience = formData.get("experience") as string;
    const age = formData.get("age") as string;

    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname,
          phone,
          level,
          region,
          gender,
          preferredStyle,
          experience: experience ? parseInt(experience) : null,
          age: age ? parseInt(age) : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "프로필 업데이트에 실패했습니다");
      }

      // 성공 후 홈으로 리다이렉트
      window.location.href = "/";
    } catch (error: any) {
      console.error(error);
      setError(error.message || "프로필 업데이트 중 오류가 발생했습니다");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            환영합니다! 🏸
          </h1>
          <p className="text-gray-600">
            배드민턴 커뮤니티를 시작하기 위해 추가 정보를 입력해주세요
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">새로운 회원</p>
              <p className="text-sm text-gray-600">{userEmail}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 닉네임 */}
            <div>
              <label
                htmlFor="nickname"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="닉네임을 입력하세요"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                전화번호
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                pattern="^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-1234-5678"
                title="전화번호 형식: 010-1234-5678 또는 01012345678"
              />
            </div>

            {/* 성별 */}
            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                성별 <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">성별을 선택하세요</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>

            {/* 나이 */}
            <div>
              <label
                htmlFor="age"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                나이 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="age"
                name="age"
                required
                min="10"
                max="100"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 25"
              />
            </div>

            {/* 실력 급수 */}
            <div>
              <label
                htmlFor="level"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                실력 급수 <span className="text-red-500">*</span>
              </label>
              <select
                id="level"
                name="level"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">급수를 선택하세요</option>
                {levels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 경력 */}
            <div>
              <label
                htmlFor="experience"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                경력 (년) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="experience"
                name="experience"
                required
                min="0"
                max="50"
                step="0.5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 2 (2년) 또는 0.5 (6개월)"
              />
            </div>

            {/* 선호 스타일 */}
            <div>
              <label
                htmlFor="preferredStyle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                선호하는 배드민턴 스타일 <span className="text-red-500">*</span>
              </label>
              <select
                id="preferredStyle"
                name="preferredStyle"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">스타일을 선택하세요</option>
                <option value="ALL">전체</option>
                <option value="MENS_DOUBLES">남복 (남자 복식)</option>
                <option value="MIXED_DOUBLES">혼복 (혼합 복식)</option>
                <option value="WOMENS_DOUBLES">여복 (여자 복식)</option>
              </select>
            </div>

            {/* 활동 지역 */}
            <RegionSelect required={false} />

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? "저장 중..." : "시작하기"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
