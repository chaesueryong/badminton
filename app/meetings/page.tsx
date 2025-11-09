"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, TrendingUp, DollarSign, ChevronLeft, ChevronRight, Filter, X, Search, Shield, ChevronDown, CalendarDays } from "lucide-react";
import RegionSelect from "@/components/RegionSelect";
import { getDefaultImage } from "@/lib/constants";

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
  thumbnailImage?: string | null;
  ageMin?: number | null;
  ageMax?: number | null;
  description?: string | null;
  host?: {
    id: string;
    name?: string;
    nickname?: string;
    level?: string;
    profileImage?: string;
  };
}

const levelLabels: Record<string, string> = {
  E_GRADE: "E조",
  D_GRADE: "D조",
  C_GRADE: "C조",
  B_GRADE: "B조",
  A_GRADE: "A조",
  S_GRADE: "자강",
};

const statusConfig: Record<string, { label: string; variant: "success" | "secondary" | "outline" | "destructive" }> = {
  OPEN: { label: "모집중", variant: "success" },
  CLOSED: { label: "마감", variant: "secondary" },
  COMPLETED: { label: "완료", variant: "outline" },
  CANCELLED: { label: "취소", variant: "destructive" },
};

const formatLevelRange = (levelMin: string | null, levelMax: string | null) => {
  if (!levelMin && !levelMax) return "모든 급수";
  const minLabel = levelMin ? levelLabels[levelMin] || levelMin : "";
  const maxLabel = levelMax ? levelLabels[levelMax] || levelMax : "";
  if (minLabel === maxLabel) return minLabel;
  if (!minLabel) return `~${maxLabel}`;
  if (!maxLabel) return `${minLabel}~`;
  return `${minLabel} ~ ${maxLabel}`;
};

export default function MeetingsPage() {
  const supabase = createClient();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    province: "",
    city: "",
    levelMin: "",
    levelMax: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchMeetings();
  }, [page, filters]);

  const fetchMeetings = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "12");

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
        setMeetings(Array.isArray(data) ? data : (data.meetings || []));
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        console.error("Failed to fetch meetings:", response.status);
        setMeetings([]);
      }
    } catch (error) {
      console.error("모임 조회 실패:", error);
      setMeetings([]);
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
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ province: "", city: "", levelMin: "", levelMax: "" });
    setPage(1);
  };

  const hasActiveFilters = filters.province || filters.levelMin || filters.levelMax;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                배드민턴 모임
              </h1>
              <p className="text-muted-foreground mt-2">
                함께 운동하고 즐거운 시간을 보내요
              </p>
            </div>
            {isLoggedIn && (
              <Button asChild size="lg" className="w-full md:w-auto">
                <Link href="/meetings/create">
                  모임 만들기
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Filter Section - Enhanced Design */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-1">
          <Card className="bg-white/95 backdrop-blur border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <Filter className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg md:text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      검색 필터
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">원하는 모임을 찾아보세요</p>
                  </div>
                  {hasActiveFilters && (
                    <Badge className="ml-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                      {Object.values(filters).filter(v => v).length}개 적용중
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9 hover-hover:hover:bg-red-50 hover-hover:hover:text-red-600 active:scale-95 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      초기화
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowFilters(!showFilters)}
                    className="md:hidden h-9 w-9"
                  >
                    <ChevronDown className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <div className={`${showFilters ? "block" : "hidden"} md:block transition-all`}>
              <CardContent className="space-y-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {/* 지역 선택 */}
                  <div className="md:col-span-1 space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      지역
                    </label>
                    <div className="relative">
                      <RegionSelect
                        showLabel={false}
                        required={false}
                        defaultProvince={filters.province}
                        defaultCity={filters.city}
                        onChange={handleRegionChange}
                      />
                    </div>
                  </div>

                  {/* 최소 급수 */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-500" />
                      최소 급수
                    </label>
                    <select
                      value={filters.levelMin}
                      onChange={(e) => handleFilterChange("levelMin", e.target.value)}
                      className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all hover-hover:hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">🎯 전체</option>
                      {Object.entries(levelLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {value === 'S_GRADE' ? '⭐ ' : '▶ '}{label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 최대 급수 */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-pink-500" />
                      최대 급수
                    </label>
                    <select
                      value={filters.levelMax}
                      onChange={(e) => handleFilterChange("levelMax", e.target.value)}
                      className="w-full h-11 rounded-xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all hover-hover:hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">🎯 전체</option>
                      {Object.entries(levelLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {value === 'S_GRADE' ? '⭐ ' : '▶ '}{label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 검색 버튼 */}
                <div className="flex justify-center md:justify-start pt-2">
                  <Button
                    onClick={applyFilters}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover-hover:hover:from-blue-700 hover-hover:hover:to-purple-700 active:scale-95 text-white px-8 py-2.5 rounded-xl font-semibold shadow-lg hover-hover:hover:shadow-xl transform  transition-all"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    모임 검색하기
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Meeting Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">로딩 중...</p>
          </div>
        ) : meetings.length === 0 ? (
          <Card className="py-20">
            <CardContent className="text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center">
                <Search className="w-12 h-12 text-gray-500" />
              </div>
              <CardTitle className="mb-2">모집 중인 모임이 없습니다</CardTitle>
              <CardDescription>다른 조건으로 검색해보세요</CardDescription>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {meetings.map((meeting) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                  <Card className="h-full hover-hover:hover:shadow-lg active:scale-[0.98] transition-all duration-300 cursor-pointer group overflow-hidden">
                    {/* 모임 썸네일 이미지 */}
                    <div className="w-full h-32 sm:h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={meeting.thumbnailImage || getDefaultImage('meeting')}
                        alt={meeting.title}
                        className="w-full h-full object-cover  transition-transform duration-300"
                      />
                    </div>
                    <CardHeader className="p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg group-hover-hover:hover:text-primary transition-colors line-clamp-2">
                          {meeting.title}
                        </CardTitle>
                        <Badge variant={statusConfig[meeting.status]?.variant || "outline"} className="flex-shrink-0 text-xs">
                          {statusConfig[meeting.status]?.label || meeting.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
                      {/* 소개 */}
                      {meeting.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">{meeting.description}</p>
                      )}

                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {meeting.location || meeting.region}
                        </span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0 text-muted-foreground" />
                        <span className="font-semibold">{meeting.currentCount}</span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-muted-foreground">{meeting.maxParticipants}명</span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span>
                          {formatLevelRange(meeting.levelMin, meeting.levelMax)}
                        </span>
                      </div>
                      <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                        <span>{meeting.fee > 0 ? `${meeting.fee.toLocaleString()}원` : '무료'}</span>
                      </div>
                      {(meeting.ageMin || meeting.ageMax) && (
                        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                          <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span>
                            {meeting.ageMin && meeting.ageMax
                              ? `${meeting.ageMin}~${meeting.ageMax}세`
                              : meeting.ageMin
                              ? `${meeting.ageMin}세 이상`
                              : `${meeting.ageMax}세 이하`}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>

                <div className="flex items-center gap-1">
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
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
