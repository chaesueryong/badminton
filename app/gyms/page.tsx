"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import RegionSelect from "@/components/RegionSelect";

interface Gym {
  id: string;
  name: string;
  region: string;
  address: string;
  courts: number;
  parking: boolean;
  shower: boolean;
  rental: boolean;
  locker: boolean;
  store: boolean;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
}

export default function GymsPage() {
  const supabase = createClient();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filters, setFilters] = useState({
    region: "",
    minCourts: "",
    parking: false,
    shower: false,
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchGyms();
  }, [page]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const fetchGyms = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // 페이지네이션
      params.append("page", page.toString());
      params.append("limit", "12");

      if (filters.region) params.append("region", filters.region);
      if (filters.minCourts) params.append("minCourts", filters.minCourts);
      if (filters.parking) params.append("parking", "true");
      if (filters.shower) params.append("shower", "true");

      const response = await fetch(`/api/gyms?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.gyms) {
          setGyms(data.gyms);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
        } else {
          setGyms(data);
        }
      }
    } catch (error) {
      console.error("체육관 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionChange = (province: string, city: string) => {
    const region = province && city ? `${province} ${city}` : province || "";
    setFilters({ ...filters, region });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const applyFilters = () => {
    setPage(1);
    fetchGyms();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              체육관 찾기
            </h1>
            <p className="text-gray-600 mt-2">
              가까운 배드민턴 체육관을 찾아보세요
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/gyms/register"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              + 체육관 등록
            </Link>
          )}
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
              <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
            </div>
            검색 필터
          </h2>

          <div className="space-y-6">
            {/* 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                지역
              </label>
              <RegionSelect
                required={false}
                showLabel={false}
                onChange={handleRegionChange}
              />
            </div>

            {/* 최소 코트 수 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                최소 코트 수
              </label>
              <select
                value={filters.minCourts}
                onChange={(e) => handleFilterChange("minCourts", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">전체</option>
                <option value="2">2개 이상</option>
                <option value="4">4개 이상</option>
                <option value="6">6개 이상</option>
                <option value="8">8개 이상</option>
              </select>
            </div>

            {/* 편의시설 (체크박스) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                편의시설 (중복 선택 가능)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={filters.parking}
                    onChange={(e) => handleFilterChange("parking", e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">주차장</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={filters.shower}
                    onChange={(e) => handleFilterChange("shower", e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-gray-700">샤워실</span>
                </label>
              </div>
            </div>
          </div>

          <button
            onClick={applyFilters}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            필터 적용
          </button>
        </div>

        {/* 체육관 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : gyms.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-lg">
            <p className="text-gray-500">검색 조건에 맞는 체육관이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gyms.map((gym) => (
              <Link
                key={gym.id}
                href={`/gyms/${gym.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                {/* 이미지 영역 */}
                <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-6xl">🏸</span>
                </div>

                <div className="p-6">
                  {/* 제목과 평점 */}
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {gym.name}
                    </h3>
                    <div className="flex items-center">
                      <span className="text-yellow-500 mr-1">⭐</span>
                      <span className="font-semibold">{gym.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({gym.reviewCount})
                      </span>
                    </div>
                  </div>

                  {/* 지역 */}
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">📍 {gym.region}</span>
                  </div>

                  {/* 위치 */}
                  <div className="flex items-center text-gray-600 mb-3">
                    <span className="text-xs">{gym.address}</span>
                  </div>

                  {/* 시설 정보 */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs">
                      코트 {gym.courts}개
                    </span>
                    {gym.parking && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs">
                        주차
                      </span>
                    )}
                    {gym.shower && (
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">
                        샤워실
                      </span>
                    )}
                    {gym.rental && (
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs">
                        대여
                      </span>
                    )}
                    {gym.locker && (
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs">
                        라커룸
                      </span>
                    )}
                    {gym.store && (
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs">
                        매점
                      </span>
                    )}
                  </div>

                  {/* 가격 */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">시간당</span>
                      <span className="text-lg font-bold text-blue-600">
                        {gym.pricePerHour.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
