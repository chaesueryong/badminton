"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDefaultImage } from "@/lib/constants";
import {
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  ChevronRight,
  Star,
  Activity,
  Target,
  Trophy,
  Gift,
  ArrowRight,
  Sparkles,
  Clock,
  Heart,
  Flame,
  Zap,
  Award,
  Crown,
  MessageCircle,
  DollarSign,
  CalendarDays
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  region: string;
  currentCount: number;
  maxParticipants: number;
  levelMin: string | null;
  levelMax: string | null;
  status: string;
  thumbnailImage?: string | null;
  fee?: number;
  ageMin?: number | null;
  ageMax?: number | null;
  description?: string | null;
  host: {
    id: string;
    nickname: string;
    level: string;
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

const levelColors: Record<string, string> = {
  E_GRADE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  D_GRADE: "bg-blue-100 text-blue-700 border-blue-200",
  C_GRADE: "bg-purple-100 text-purple-700 border-purple-200",
  B_GRADE: "bg-pink-100 text-pink-700 border-pink-200",
  A_GRADE: "bg-orange-100 text-orange-700 border-orange-200",
  S_GRADE: "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200",
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

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [popularMeetings, setPopularMeetings] = useState<Meeting[]>([]);

  const fetchPopularMeetings = useCallback(async () => {
    try {
      const response = await fetch("/api/meetings?limit=6");
      if (response.ok) {
        const data = await response.json();
        setPopularMeetings(data.meetings || data);
      }
    } catch (error) {
      console.error("인기 모임 조회 실패:", error);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
    fetchPopularMeetings();
  }, [fetchPopularMeetings]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* 테스트 중 배너 */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white py-3 px-4 text-center font-bold text-sm md:text-base shadow-lg">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Zap className="w-5 h-5 animate-pulse flex-shrink-0" />
          <span>현재 베타 테스트 중입니다.</span>
          <span className="block sm:inline">일부 기능이 원활하지 않을 수 있습니다.</span>
          <Zap className="w-5 h-5 animate-pulse flex-shrink-0" />
        </div>
      </div>

      {/* Hero Section with gradient background */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">

        <div className="relative container mx-auto px-4 py-12 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium mb-8 animate-pulse">
              <Star className="w-5 h-5 animate-spin-slow fill-current" />
              배드민턴 커뮤니티 No.1
              <Star className="w-5 h-5 animate-spin-slow fill-current" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              배드민턴으로
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                함께 성장하는
              </span>
              <br />
              즐거운 순간
            </h1>

            <p className="text-lg md:text-xl text-white/90 mb-10 font-medium">
              함께하는 배드민턴 라이프
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isLoggedIn ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-blue-600 hover-hover:hover:bg-white/90 shadow-xl text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform  transition-all"
                  >
                    <Link href="/login">
                      시작하기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="bg-transparent border-2 border-white text-white hover-hover:hover:bg-white hover-hover:hover:text-blue-600 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform  transition-all"
                  >
                    <Link href="/meetings">모임 둘러보기</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-blue-600 hover-hover:hover:bg-white/90 shadow-xl text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform  transition-all"
                  >
                    <Link href="/meetings">
                      모임 찾기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="bg-transparent border-2 border-white text-white hover-hover:hover:bg-white hover-hover:hover:text-blue-600 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform  transition-all"
                  >
                    <Link href="/meetings/create">모임 만들기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Meetings Section */}
      <section className="container mx-auto px-4 py-8 md:py-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                지금 뜨는 모임
              </h2>
            </div>
            <p className="text-gray-600 text-sm md:text-base mt-2">실시간 인기 모임을 만나보세요</p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="group hover-hover:hover:bg-blue-50 rounded-full px-6"
          >
            <Link href="/meetings">
              전체보기
              <ChevronRight className="ml-1 h-4 w-4 transform group-hover-hover:hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularMeetings.map((meeting, index) => (
            <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
              <Card className="group h-full border-2 hover-hover:hover:border-blue-200 hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-slate-50 relative">
                {/* 모임 썸네일 이미지 */}
                <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                  <img
                    src={meeting.thumbnailImage || getDefaultImage('meeting')}
                    alt={meeting.title}
                    className="w-full h-full object-cover  transition-transform duration-500"
                  />
                  {index < 3 && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1">
                        <span className="font-bold">HOT</span>
                        <Flame className="w-4 h-4" />
                      </Badge>
                    </div>
                  )}
                </div>

                {!meeting.thumbnailImage && index < 3 && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1">
                      <span className="font-bold">HOT</span>
                      <Flame className="w-4 h-4" />
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-base md:text-lg font-bold group-hover-hover:hover:text-blue-600 transition-colors line-clamp-1">
                      {meeting.title}
                    </CardTitle>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm">{meeting.region}</span>
                    </div>
                    <Badge
                      variant={meeting.status === "OPEN" ? "default" : "secondary"}
                      className={meeting.status === "OPEN"
                        ? "bg-green-100 text-green-700 hover:bg-green-200 text-xs px-2 py-0.5"
                        : "text-xs px-2 py-0.5"}
                    >
                      {meeting.status === "OPEN" ? "모집중" : "마감"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* 소개 */}
                  {meeting.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
                  )}

                  {/* 인원 및 급수 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-lg text-blue-600 leading-none">{meeting.currentCount}</span>
                        <span className="text-gray-500 leading-none">/</span>
                        <span className="text-gray-600 leading-none">{meeting.maxParticipants}명</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full">
                      <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                      <span className="text-xs font-medium text-gray-700">
                        {formatLevelRange(meeting.levelMin, meeting.levelMax)}
                      </span>
                    </div>
                  </div>

                  {/* 참가비 및 나이제한 */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5 text-green-600" />
                      <span>{meeting.fee && meeting.fee > 0 ? `${meeting.fee.toLocaleString()}원` : '무료'}</span>
                    </div>
                    {(meeting.ageMin || meeting.ageMax) && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-orange-500" />
                        <span>
                          {meeting.ageMin && meeting.ageMax
                            ? `${meeting.ageMin}~${meeting.ageMax}세`
                            : meeting.ageMin
                            ? `${meeting.ageMin}세 이상`
                            : `${meeting.ageMax}세 이하`}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              왜 배드메이트인가요?
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              배드민턴을 더 즐겁고 체계적으로 즐기는 방법
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            <Link href="/meetings" className="block">
              <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-blue-200 bg-white cursor-pointer h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center group- transition-transform">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold">정기 모임</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-xs md:text-sm text-gray-600">
                    실력별 정기 모임으로<br />꾸준한 실력 향상
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/matching" className="block">
              <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-purple-200 bg-white cursor-pointer h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center group- transition-transform">
                    <Target className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold">파트너 매칭</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-xs md:text-sm text-gray-600">
                    실력과 지역 기반<br />최적의 파트너 매칭
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/leaderboard" className="block">
              <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-pink-200 bg-white cursor-pointer h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-pink-600 rounded-3xl flex items-center justify-center group- transition-transform">
                    <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold">랭킹 시스템</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-xs md:text-sm text-gray-600">
                    ELO 레이팅으로<br />공정한 실력 평가
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/rewards" className="block">
              <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-orange-200 bg-white cursor-pointer h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center group- transition-transform">
                    <Gift className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold">리워드</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-xs md:text-sm text-gray-600">
                    활동 포인트로<br />다양한 혜택
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>

            <Link href="/community" className="block">
              <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-indigo-200 bg-white cursor-pointer h-full">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-3xl flex items-center justify-center group- transition-transform">
                    <MessageCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg font-bold">커뮤니티</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-xs md:text-sm text-gray-600">
                    배드민턴 팁과<br />경험 공유
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
