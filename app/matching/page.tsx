"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import RegionSelect from "@/components/RegionSelect";
import { Filter, X } from "lucide-react";

type SkillLevel = "BEGINNER" | "D_GRADE" | "C_GRADE" | "B_GRADE" | "A_GRADE" | "S_GRADE" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

// 임시 데이터
const mockUsers = [
  {
    id: "1",
    name: "김민수",
    nickname: "배드킹",
    level: "INTERMEDIATE" as SkillLevel,
    region: "서울 강남구",
    totalGames: 45,
    wins: 28,
    points: 1250,
  },
  {
    id: "2",
    name: "이지은",
    nickname: "스매셔",
    level: "ADVANCED" as SkillLevel,
    region: "서울 서초구",
    totalGames: 62,
    wins: 40,
    points: 1680,
  },
  {
    id: "3",
    name: "박준호",
    nickname: "배드맨",
    level: "BEGINNER" as SkillLevel,
    region: "서울 송파구",
    totalGames: 12,
    wins: 5,
    points: 320,
  },
  {
    id: "4",
    name: "최수진",
    nickname: "네트킬러",
    level: "B_GRADE" as SkillLevel,
    region: "경기 성남시",
    totalGames: 38,
    wins: 25,
    points: 980,
  },
];

const levelLabels: Record<SkillLevel, string> = {
  BEGINNER: "입문",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
  INTERMEDIATE: "C조",
  ADVANCED: "B조",
  EXPERT: "A조",
};

const levelColors: Record<SkillLevel, string> = {
  BEGINNER: "bg-green-100 text-green-800",
  D_GRADE: "bg-green-100 text-green-800",
  C_GRADE: "bg-blue-100 text-blue-800",
  B_GRADE: "bg-purple-100 text-purple-800",
  A_GRADE: "bg-red-100 text-red-800",
  S_GRADE: "bg-orange-100 text-orange-800",
  INTERMEDIATE: "bg-blue-100 text-blue-800",
  ADVANCED: "bg-purple-100 text-purple-800",
  EXPERT: "bg-red-100 text-red-800",
};

const skillLevelOrder: SkillLevel[] = ["BEGINNER", "D_GRADE", "C_GRADE", "INTERMEDIATE", "B_GRADE", "ADVANCED", "A_GRADE", "EXPERT", "S_GRADE"];

interface User {
  id: string;
  name: string;
  nickname: string;
  level: SkillLevel;
  region: string | null;
  bio: string | null;
  totalGames: number;
  wins: number;
  points: number;
  profileImage?: string;
  gender?: string | null;
  preferredStyle?: string | null;
  experience?: number | null;
  age?: number | null;
}

export default function MatchingPage() {
  const supabase = createClientComponentClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    province: "",
    city: "",
    minSkillLevel: "",
    maxSkillLevel: "",
    sortBy: "points",
    gender: "",
    preferredStyle: "",
    minExperience: "",
    maxExperience: "",
    minAge: "",
    maxAge: "",
  });

  useEffect(() => {
    getCurrentUser();
    fetchUsers();
  }, [page]);

  const getCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      // 페이지네이션
      params.append("page", page.toString());
      params.append("limit", "12");

      // 필터
      if (filters.province) {
        const location = filters.city
          ? `${filters.province} ${filters.city}`
          : filters.province;
        params.append("region", location);
      }
      if (filters.minSkillLevel) params.append("minSkillLevel", filters.minSkillLevel);
      if (filters.maxSkillLevel) params.append("maxSkillLevel", filters.maxSkillLevel);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.preferredStyle) params.append("preferredStyle", filters.preferredStyle);
      if (filters.minExperience) params.append("minExperience", filters.minExperience);
      if (filters.maxExperience) params.append("maxExperience", filters.maxExperience);
      if (filters.minAge) params.append("minAge", filters.minAge);
      if (filters.maxAge) params.append("maxAge", filters.maxAge);

      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          setUsers(data.users);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setUsers(data);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('사용자 조회 실패:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 실력 순서 인덱스 가져오기
  const getSkillLevelIndex = (level: SkillLevel): number => {
    return skillLevelOrder.indexOf(level);
  };

  // 지역 변경 핸들러
  const handleRegionChange = (province: string, city: string) => {
    setFilters({ ...filters, province, city });
  };

  const applyFilters = () => {
    setPage(1);
    fetchUsers();
    // 모바일에서 필터 적용 후 필터 패널 닫기
    if (window.innerWidth < 768) {
      setIsFilterOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">파트너 매칭</h1>
              <p className="text-gray-600 mt-2">
                실력에 맞는 파트너를 찾아보세요
              </p>
            </div>
            {/* 모바일 필터 토글 버튼 */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="md:hidden bg-blue-600 text-white p-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              aria-label="필터 토글"
            >
              {isFilterOpen ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 필터 - 데스크톱에서는 항상 표시, 모바일에서는 토글 */}
        <div className={`bg-white rounded-lg shadow-sm p-4 mb-6 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">검색 필터</h2>
            {/* 모바일 필터 닫기 버튼 */}
            <button
              onClick={() => setIsFilterOpen(false)}
              className="md:hidden text-gray-500 hover:text-gray-700"
              aria-label="필터 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 지역 */}
            <div className="lg:col-span-2">
              <RegionSelect
                showLabel={true}
                required={false}
                defaultProvince={filters.province}
                defaultCity={filters.city}
                onChange={handleRegionChange}
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성별
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <option value="">전체</option>
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </div>

            {/* 선호 스타일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                선호 스타일
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.preferredStyle}
                onChange={(e) => setFilters({ ...filters, preferredStyle: e.target.value })}
              >
                <option value="">전체</option>
                <option value="MENS_DOUBLES">남복</option>
                <option value="MIXED_DOUBLES">혼복</option>
                <option value="WOMENS_DOUBLES">여복</option>
              </select>
            </div>

            {/* 실력 급수 범위 */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                실력 급수
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.minSkillLevel}
                  onChange={(e) => setFilters({ ...filters, minSkillLevel: e.target.value })}
                >
                  <option value="">최소</option>
                  <option value="BEGINNER">입문</option>
                  <option value="D_GRADE">D급</option>
                  <option value="C_GRADE">C급</option>
                  <option value="B_GRADE">B급</option>
                  <option value="A_GRADE">A급</option>
                  <option value="S_GRADE">S급</option>
                </select>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.maxSkillLevel}
                  onChange={(e) => setFilters({ ...filters, maxSkillLevel: e.target.value })}
                >
                  <option value="">최대</option>
                  <option value="BEGINNER">입문</option>
                  <option value="D_GRADE">D급</option>
                  <option value="C_GRADE">C급</option>
                  <option value="B_GRADE">B급</option>
                  <option value="A_GRADE">A급</option>
                  <option value="S_GRADE">S급</option>
                </select>
              </div>
            </div>

            {/* 경력 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                경력 (년)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  placeholder="최소"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.minExperience}
                  onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  placeholder="최대"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.maxExperience}
                  onChange={(e) => setFilters({ ...filters, maxExperience: e.target.value })}
                />
              </div>
            </div>

            {/* 나이 범위 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                나이
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="10"
                  max="100"
                  placeholder="최소"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.minAge}
                  onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                />
                <input
                  type="number"
                  min="10"
                  max="100"
                  placeholder="최대"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* 정렬 및 적용 버튼 */}
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정렬
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              >
                <option value="points">랭킹순</option>
                <option value="games">경기수순</option>
                <option value="winRate">승률순</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={applyFilters}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
              >
                필터 적용
              </button>
            </div>
          </div>
        </div>

        {/* 사용자 목록 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">검색 조건에 맞는 파트너가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6"
              >
                {/* 프로필 */}
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4 overflow-hidden">
                    {user.profileImage && user.profileImage !== '/default-avatar.png' ? (
                      <img src={user.profileImage} alt={user.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{user.nickname}</h3>
                    <p className="text-gray-600 text-sm">{user.region}</p>
                  </div>
                </div>

                {/* 레벨 */}
                <div className="flex gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      levelColors[user.level]
                    }`}
                  >
                    {levelLabels[user.level]}
                  </span>
                </div>

                {/* 사용자 정보 */}
                <div className="space-y-2 mb-4 py-4 border-t border-b border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">성별</span>
                    <span className="font-medium">{user.gender === "MALE" ? "남성" : user.gender === "FEMALE" ? "여성" : "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">나이</span>
                    <span className="font-medium">{user.age ? `${user.age}세` : "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">경력</span>
                    <span className="font-medium">{user.experience ? `${user.experience}년` : "-"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">선호 스타일</span>
                    <span className="font-medium">
                      {user.preferredStyle === "ALL" ? "전체" :
                       user.preferredStyle === "MENS_DOUBLES" ? "남복" :
                       user.preferredStyle === "MIXED_DOUBLES" ? "혼복" :
                       user.preferredStyle === "WOMENS_DOUBLES" ? "여복" : "-"}
                    </span>
                  </div>
                </div>

                {/* 자기소개 */}
                {user.bio && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {user.bio}
                    </p>
                  </div>
                )}

                {/* 버튼 */}
                <div className="flex gap-2">
                  {currentUserId === user.id ? (
                    <Link
                      href="/profile"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700 transition"
                    >
                      프로필 수정
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-center hover:bg-gray-200 transition"
                      >
                        프로필
                      </Link>
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                        메시지
                      </button>
                    </>
                  )}
                </div>
              </div>
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
