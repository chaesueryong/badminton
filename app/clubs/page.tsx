"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RegionSelect from "@/components/RegionSelect";

interface Club {
  id: string;
  name: string;
  description: string;
  region: string;
  currentMembers: number;
  maxMembers: number;
  membershipFee: number;
  feeType: string;
  minLevel: string | null;
  maxLevel: string | null;
  imageUrl: string | null;
  status: string;
}

const levelLabels: Record<string, string> = {
  E_GRADE: "E조",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
};

const feeTypeLabels: Record<string, string> = {
  FREE: "무료",
  MONTHLY: "월 회비",
  QUARTERLY: "분기 회비",
  YEARLY: "년 회비",
};

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    region: "",
    minLevel: "",
    maxLevel: "",
  });

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.region) params.append("region", filters.region);
      if (filters.minLevel) params.append("minLevel", filters.minLevel);
      if (filters.maxLevel) params.append("maxLevel", filters.maxLevel);

      const response = await fetch(`/api/clubs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      }
    } catch (error) {
      console.error("클럽 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleRegionChange = (province: string, city: string) => {
    const region = province && city ? `${province} ${city}` : province || "";
    setFilters({ ...filters, region });
  };

  const applyFilters = () => {
    fetchClubs();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">배드민턴 모임</h1>
            <p className="text-gray-600 mt-2">
              함께할 배드민턴 동호회를 찾아보세요
            </p>
          </div>
          <Link
            href="/clubs/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            모임 만들기
          </Link>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">필터</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 지역 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <RegionSelect
                required={false}
                onChange={handleRegionChange}
              />
            </div>

            {/* 최소 급수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 급수
              </label>
              <select
                value={filters.minLevel}
                onChange={(e) => handleFilterChange("minLevel", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* 최대 급수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최대 급수
              </label>
              <select
                value={filters.maxLevel}
                onChange={(e) => handleFilterChange("maxLevel", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">전체</option>
                {Object.entries(levelLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={applyFilters}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            필터 적용
          </button>
        </div>

        {/* 모임 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">등록된 모임이 없습니다</p>
            <Link
              href="/clubs/create"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              첫 모임 만들기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/clubs/${club.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* 이미지 */}
                {club.imageUrl ? (
                  <div className="h-48 bg-gray-200">
                    <img
                      src={club.imageUrl}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-6xl">🏸</span>
                  </div>
                )}

                <div className="p-6">
                  {/* 제목 */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {club.name}
                  </h3>

                  {/* 설명 */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {club.description}
                  </p>

                  {/* 지역 */}
                  {club.region && (
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm">{club.region}</span>
                    </div>
                  )}

                  {/* 급수 제한 */}
                  {club.minLevel && club.maxLevel && (
                    <div className="mb-4">
                      <span className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                        {levelLabels[club.minLevel]} ~ {levelLabels[club.maxLevel]}
                      </span>
                    </div>
                  )}

                  {/* 하단 정보 */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div>
                      <span className="text-sm text-gray-600">회원</span>
                      <p className="font-semibold">
                        {club.currentMembers}/{club.maxMembers}명
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">회비</span>
                      <p className="font-semibold text-blue-600">
                        {club.feeType === "FREE"
                          ? "무료"
                          : `${club.membershipFee.toLocaleString()}원/${feeTypeLabels[club.feeType]}`}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
