"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import RegionSelect from "@/components/RegionSelect";
import { createClient } from "@/lib/supabase/client";

interface Meeting {
  id: string;
  title: string;
  region: string;
  location: string | null;
  currentCount: number;
  maxParticipants: number;
  levelMin: string | null;
  levelMax: string | null;
  fee: number;
  status: string;
  date: string;
}

const levelLabels: Record<string, string> = {
  E_GRADE: "E급",
  D_GRADE: "D급",
  C_GRADE: "C급",
  B_GRADE: "B급",
  A_GRADE: "A급",
  S_GRADE: "S급",
};

const statusLabels: Record<string, string> = {
  OPEN: "모집중",
  CLOSED: "마감",
  COMPLETED: "종료",
  CANCELLED: "취소",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function MeetingsPage() {
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filters, setFilters] = useState({
    province: "",
    city: "",
    levelMin: "",
    levelMax: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // 로그인 상태 체크
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
    fetchMeetings();
  }, [supabase, page]);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // 페이지네이션
      params.append("page", page.toString());
      params.append("limit", "12");

      // 지역 필터: province와 city를 결합하여 region으로 전달
      if (filters.province) {
        const region = filters.city
          ? `${filters.province} ${filters.city}`
          : filters.province;
        params.append("region", region);
      }

      if (filters.levelMin) params.append("levelMin", filters.levelMin);
      if (filters.levelMax) params.append("levelMax", filters.levelMax);

      const response = await fetch(`/api/meetings?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.meetings) {
          setMeetings(data.meetings);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalCount(data.pagination?.total || 0);
        } else {
          setMeetings(data);
        }
      }
    } catch (error) {
      console.error("모임 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleRegionChange = (province: string, city: string) => {
    setFilters({ ...filters, province, city });
  };

  const applyFilters = () => {
    setPage(1);
    fetchMeetings();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center md:justify-start gap-2">
              <span className="text-4xl">🏸</span>
              배드민턴 모임
            </h1>
            <p className="text-gray-600 text-base">
              함께 운동하고 즐거운 시간을 보내요
            </p>
          </div>
          {isLoggedIn && (
            <Link
              href="/meetings/create"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors duration-200 font-medium shadow-sm hover:shadow-md"
            >
              + 모임 만들기
            </Link>
          )}
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          {/* 모바일: 토글 버튼 */}
          <div className="md:hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900">필터 {showFilters ? '▲' : '▼'}</span>
              <span className="text-sm text-blue-600 font-medium">
                {filters.province || filters.levelMin || filters.levelMax ? '적용됨' : ''}
              </span>
            </button>
          </div>

          {/* 데스크톱: 항상 표시 */}
          <div className="hidden md:block p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">🔍 모임 찾기</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RegionSelect
                showLabel={true}
                required={false}
                defaultProvince={filters.province}
                defaultCity={filters.city}
                onChange={handleRegionChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최소 급수
                </label>
                <select
                  value={filters.levelMin}
                  onChange={(e) => handleFilterChange("levelMin", e.target.value)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  최대 급수
                </label>
                <select
                  value={filters.levelMax}
                  onChange={(e) => handleFilterChange("levelMax", e.target.value)}
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
              className="mt-4 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium"
            >
              검색하기
            </button>
          </div>

          {/* 모바일: 토글 가능한 필터 내용 */}
          {showFilters && (
            <div className="md:hidden p-4 pt-0 border-t border-gray-100">
              <div className="space-y-4">
                <RegionSelect
                  showLabel={true}
                  required={false}
                  defaultProvince={filters.province}
                  defaultCity={filters.city}
                  onChange={handleRegionChange}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최소 급수
                  </label>
                  <select
                    value={filters.levelMin}
                    onChange={(e) => handleFilterChange("levelMin", e.target.value)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 급수
                  </label>
                  <select
                    value={filters.levelMax}
                    onChange={(e) => handleFilterChange("levelMax", e.target.value)}
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
                <button
                  onClick={() => {
                    applyFilters();
                    setShowFilters(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors duration-200 font-medium"
                >
                  검색하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 모임 목록 */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">로딩 중...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-100">
            <div className="text-5xl mb-4">🏸</div>
            <p className="text-gray-500 text-base">모집 중인 모임이 없습니다</p>
            <p className="text-gray-400 text-sm mt-2">다른 조건으로 검색해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {meetings.map((meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="bg-white rounded-lg border border-gray-100 hover:border-blue-200 p-5 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {meeting.title}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      statusColors[meeting.status]
                    }`}
                  >
                    {statusLabels[meeting.status]}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="text-base mr-2">📍</span>
                    <span className="line-clamp-1">{meeting.location || meeting.region}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-base mr-2">👥</span>
                    <span>
                      <span className="font-semibold text-gray-900">{meeting.currentCount}</span>
                      <span className="text-gray-400">/</span>
                      <span>{meeting.maxParticipants}명</span>
                    </span>
                  </div>
                  {(meeting.levelMin || meeting.levelMax) && (
                    <div className="flex items-center">
                      <span className="text-base mr-2">🏸</span>
                      <span>
                        {meeting.levelMin && levelLabels[meeting.levelMin]} ~{" "}
                        {meeting.levelMax && levelLabels[meeting.levelMax]}
                      </span>
                    </div>
                  )}
                  {meeting.fee > 0 && (
                    <div className="flex items-center">
                      <span className="text-base mr-2">💰</span>
                      <span>{meeting.fee.toLocaleString()}원</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
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
                    className={`w-10 h-10 rounded-lg transition-colors text-sm font-medium ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
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
