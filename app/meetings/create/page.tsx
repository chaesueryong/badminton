"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RegionSelect from "@/components/RegionSelect";
import ImageUpload from "@/components/SimpleImageUpload";
import { usePremium } from "@/lib/hooks/usePremium";
import { toast } from "sonner";

// Storage bucket name for meetings
const STORAGE_BUCKETS = {
  MEETINGS: "meetings",
};

export default function CreateMeetingPage() {
  const router = useRouter();
  const { isPremium, loading: premiumLoading } = usePremium();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feePeriod, setFeePeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [levelRange, setLevelRange] = useState({ min: "", max: "" });
  const [selectedRegion, setSelectedRegion] = useState({ province: "", city: "" });
  const [thumbnailImage, setThumbnailImage] = useState<string>("");

  const maxParticipantsLimit = isPremium ? 300 : 50;

  // 로그인 체크 임시 비활성화 (UI 확인용)
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (!session) {
  //       alert("로그인이 필요합니다");
  //       router.push("/login");
  //     }
  //   };
  //   checkAuth();
  // }, [router, supabase]);

  // 이미지 업로드 핸들러 (임시 비활성화)
  // const handleImageUpload = (url: string, path: string) => {
  //   setImageUrl(url);
  // };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Combine province and city to create region string
    const region = selectedRegion.city
      ? `${selectedRegion.province} ${selectedRegion.city}`
      : selectedRegion.province;

    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      detailedInfo: formData.get("detailedInfo"),
      region: region,
      maxParticipants: parseInt(formData.get("maxParticipants") as string),
      levelMin: formData.get("levelMin"),
      levelMax: formData.get("levelMax"),
      fee: parseInt(formData.get("fee") as string),
      feePeriod: feePeriod,
      requiredGender: formData.get("requiredGender"),
      ageMin: formData.get("ageMin") ? parseInt(formData.get("ageMin") as string) : null,
      ageMax: formData.get("ageMax") ? parseInt(formData.get("ageMax") as string) : null,
      thumbnailImage: thumbnailImage,
    };

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const meeting = await response.json();
        router.push(`/meetings/${meeting.id}`);
      } else {
        toast.error("모임 생성에 실패했습니다");
      }
    } catch (error) {
      console.error(error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로가기
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <span className="text-3xl">🏸</span>
            모임 만들기
          </h1>
          <p className="text-gray-600 mt-2 text-sm">함께 운동할 동료들을 모집해보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 모임 썸네일 */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 md:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📸</span>
              모임 대표 이미지
            </h3>
            <ImageUpload
              bucket={STORAGE_BUCKETS.MEETINGS}
              currentImage={thumbnailImage}
              onImageUpload={(url) => setThumbnailImage(url)}
              className="w-full h-64"
            />
            <p className="text-sm text-gray-500 mt-2">
              모임을 대표하는 이미지를 업로드해주세요 (선택사항)
            </p>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 md:p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900">📝 기본 정보</h2>

            {/* 모임명 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                모임명 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 강남 배드민턴 클럽"
              />
            </div>

            {/* 짧은 소개 */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                짧은 소개 (카드에 표시)
              </label>
              <input
                type="text"
                id="description"
                name="description"
                maxLength={100}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="모임을 한 줄로 소개해주세요 (최대 100자)"
              />
              <p className="text-xs text-gray-500 mt-1">
                모임 목록 카드에 표시되는 짧은 소개글입니다 (최대 100자)
              </p>
            </div>

            {/* 상세 정보 */}
            <div>
              <label htmlFor="detailedInfo" className="block text-sm font-medium text-gray-700 mb-2">
                상세 정보 (모임 페이지에만 표시)
              </label>
              <textarea
                id="detailedInfo"
                name="detailedInfo"
                rows={8}
                maxLength={2000}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="모임에 대해 자세히 소개해주세요 (최대 2000자)&#10;&#10;- 모임 분위기&#10;- 참가 대상&#10;- 준비물&#10;- 활동 내용&#10;- 기타 안내사항"
              />
              <p className="text-xs text-gray-500 mt-1">
                모임 상세 페이지에만 표시되는 자세한 정보입니다 (최대 2000자)
              </p>
            </div>

            {/* 지역 */}
            <RegionSelect
              showLabel={true}
              required={true}
              onChange={(province, city) => setSelectedRegion({ province, city })}
            />
          </div>

          {/* 참가 조건 */}
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-5 md:p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900">✅ 참가 조건</h2>

            {/* 최대 인원 */}
            <div>
              <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-700 mb-2">
                최대 인원 *
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                required
                min="2"
                max={maxParticipantsLimit}
                defaultValue="8"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                2~{maxParticipantsLimit}명
                {!isPremium && " (프리미엄 회원은 최대 300명)"}
              </p>
            </div>

            {/* 실력 급수 레인지 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                실력 급수 범위
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="levelMin" className="block text-xs text-gray-600 mb-1">
                    최소 급수
                  </label>
                  <select
                    id="levelMin"
                    name="levelMin"
                    value={levelRange.min}
                    onChange={(e) => setLevelRange({ ...levelRange, min: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">선택안함</option>
                    <option value="E_GRADE">E급</option>
                    <option value="D_GRADE">D급</option>
                    <option value="C_GRADE">C급</option>
                    <option value="B_GRADE">B급</option>
                    <option value="A_GRADE">A급</option>
                    <option value="S_GRADE">S급</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="levelMax" className="block text-xs text-gray-600 mb-1">
                    최대 급수
                  </label>
                  <select
                    id="levelMax"
                    name="levelMax"
                    value={levelRange.max}
                    onChange={(e) => setLevelRange({ ...levelRange, max: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">선택안함</option>
                    <option value="E_GRADE">E급</option>
                    <option value="D_GRADE">D급</option>
                    <option value="C_GRADE">C급</option>
                    <option value="B_GRADE">B급</option>
                    <option value="A_GRADE">A급</option>
                    <option value="S_GRADE">S급</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">급수 제한 없음을 추천합니다</p>
            </div>

            {/* 성별 제한 */}
            <div>
              <label htmlFor="requiredGender" className="block text-sm font-medium text-gray-700 mb-2">
                성별 제한
              </label>
              <select
                id="requiredGender"
                name="requiredGender"
                defaultValue="ANY"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="ANY">제한 없음</option>
                <option value="MALE">남성만</option>
                <option value="FEMALE">여성만</option>
              </select>
            </div>

            {/* 나이 제한 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                나이 제한 (선택)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ageMin" className="block text-xs text-gray-600 mb-1">
                    최소 나이
                  </label>
                  <input
                    type="number"
                    id="ageMin"
                    name="ageMin"
                    min="1"
                    max="100"
                    placeholder="예: 20"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="ageMax" className="block text-xs text-gray-600 mb-1">
                    최대 나이
                  </label>
                  <input
                    type="number"
                    id="ageMax"
                    name="ageMax"
                    min="1"
                    max="100"
                    placeholder="예: 40"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">나이 제한 없음을 추천합니다</p>
            </div>

            {/* 참가비 */}
            <div>
              <label htmlFor="fee" className="block text-sm font-medium text-gray-700 mb-2">
                참가비
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <input
                    type="number"
                    id="fee"
                    name="fee"
                    min="0"
                    step="1000"
                    defaultValue="0"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <select
                    id="feePeriod"
                    name="feePeriod"
                    value={feePeriod}
                    onChange={(e) => setFeePeriod(e.target.value as "monthly" | "quarterly" | "yearly")}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="monthly">원/월</option>
                    <option value="quarterly">원/분기</option>
                    <option value="yearly">원/연</option>
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                정기 모임의 경우 월/분기/연 단위로 설정해주세요
              </p>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "생성 중..." : "모임 만들기"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">
            모임을 만들면 자동으로 호스트가 됩니다
          </p>
        </form>
      </div>
    </div>
  );
}
