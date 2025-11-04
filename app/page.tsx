"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Crown
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

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [popularMeetings, setPopularMeetings] = useState<Meeting[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
    fetchPopularMeetings();
  }, []);

  const fetchPopularMeetings = async () => {
    try {
      const response = await fetch("/api/meetings?limit=6");
      if (response.ok) {
        const data = await response.json();
        setPopularMeetings(data.meetings || data);
      }
    } catch (error) {
      console.error("인기 모임 조회 실패:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 pb-20 md:pb-8">
      {/* Hero Section with gradient background */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDJ2LTRIMTJ2MkgxMHYySDh2LTJINnYtMkg0djJIMnYyaDF2Mkgwdi0yaDJ2LTJoMnYyaDJ2MmgxdjJIOHYyaDJWMzJoMnYtMmgydjJoMnYyaDF2Mmg0di0yaDF2LTJoMnYyaDJ2MmgxdjJoMnYtMmgydi0yaDF2LTJoMnYyaDJ2MmgxdjJoMnYtMmgydi0yaDF2LTJoMnYyaDJ2MmgxdjJoMlY0aC0ydjJoLTJ2LTJoLTJ2MmgtMnYyaC0yVjZoLTJ2MmgtMnYtMmgtMnYyaC0ydjJoLTJWOGgtMnYyaC0ydi0yaC0ydjJoLTJ2MmgtMlYxMGgtMnYyaC0ydi0yaC0ydjJoLTJ2MmgtMnYtMmgtMnYyaC0ydjJoLTJ2LTJoLTJ2MmgtMnYyaC0ydi0yaC0ydjJoLTJ2MmgtMlYxNmgtMnYyaC0ydi0yaC0ydjJoLTJ2MmgtMnYtMmgtMnYyaC0ydjJIOHYtMkg2djJINHYySDJ2LTJIMHYyaDJ2Mmgxem0xOC0yaDF2LTJoMnYyaDJ2MmgxdjJoMnYtMmgydi0yaDF2LTJoMnYyaDJ2MmgxdjJoMlYzMmgydjJoMXYyaDJ2LTJoMnYtMmgxdi0yaDJ2MmgydjJoMXYyaDJWMzRoMnYyaDFWMzRoMnYtMmgydi0yaDF2LTJoMnYyaDJ2MmgxdjJoMlYzMmgydi0yaC0ydi0yaC0ydjJoLTJ2MmgtMXYtMmgtMnYyaC0ydjJoLTF2LTJoLTJ2MmgtMnYyaC0xdi0yaC0ydjJoLTJ2MmgtMXYtMmgtMnYyaC0ydjJoLTFWMzJoLTJ2MmgtMnYyaC0xdi0yaC0ydjJoLTJ2MmgtMXYtMmgtMnYyaC0ydjJoLTF2LTJoLTJ2MmgtMnYyaC0xdi0yaC0ydi0yem0xNCAxNGgtMnYyaDJ2LTJ6bTItMmgtMnYyaDJ2LTJ6bTItMmgtMnYyaDJ2LTJ6bTItMmgtMnYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-10" />

        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium mb-8 animate-pulse">
              <Star className="w-5 h-5 animate-spin-slow fill-current" />
              배드민턴 커뮤니티 No.1
              <Star className="w-5 h-5 animate-spin-slow fill-current" />
            </div>

            <h1 className="text-3xl md:text-7xl font-black text-white mb-6 leading-tight">
              배드민턴으로
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                함께 성장하는
              </span>
              <br />
              즐거운 순간
            </h1>

            <p className="text-base md:text-2xl text-white/90 mb-10 font-medium">
              전국 1,000+ 활성 회원과 함께하는 배드민턴 라이프
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isLoggedIn ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-blue-600 hover-hover:hover:bg-white/90 shadow-xl text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform hover-hover:hover:scale-105 transition-all"
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
                    className="bg-transparent border-2 border-white text-white hover-hover:hover:bg-white hover-hover:hover:text-blue-600 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform hover-hover:hover:scale-105 transition-all"
                  >
                    <Link href="/meetings">모임 둘러보기</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-blue-600 hover-hover:hover:bg-white/90 shadow-xl text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform hover-hover:hover:scale-105 transition-all"
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
                    className="bg-transparent border-2 border-white text-white hover-hover:hover:bg-white hover-hover:hover:text-blue-600 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full font-bold transform hover-hover:hover:scale-105 transition-all"
                  >
                    <Link href="/meetings/create">모임 만들기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Popular Meetings Section */}
      <section className="container mx-auto px-4 py-16 md:py-20">
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
            <p className="text-gray-600 text-sm md:text-lg ml-15">실시간 인기 모임을 만나보세요</p>
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
                {index < 3 && (
                  <div className="absolute top-4 right-4 z-10">
                    <Badge className="bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1">
                      <span className="font-bold">HOT</span>
                      <Flame className="w-4 h-4" />
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="text-lg md:text-xl font-bold group-hover-hover:hover:text-blue-600 transition-colors line-clamp-2">
                      {meeting.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{meeting.region}</span>
                    </div>
                    <Badge
                      variant={meeting.status === "OPEN" ? "default" : "secondary"}
                      className={meeting.status === "OPEN"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : ""}
                    >
                      {meeting.status === "OPEN" ? "모집중" : "마감"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-lg text-blue-600">{meeting.currentCount}</span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-600">{meeting.maxParticipants}명</span>
                      </div>
                    </div>

                    {(meeting.levelMin || meeting.levelMax) && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full">
                        <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs font-medium text-gray-700">
                          {meeting.levelMin && levelLabels[meeting.levelMin]}
                          {meeting.levelMin && meeting.levelMax && " ~ "}
                          {meeting.levelMax && levelLabels[meeting.levelMax]}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t">
                    <Link
                      href={`/profile/${meeting.host.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 hover-hover:hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-8 w-8 ring-2 ring-white shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-bold">
                          {meeting.host.nickname[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-gray-900">
                        {meeting.host.nickname}
                      </p>
                    </Link>
                    <div className="flex-1" />
                    <Badge
                      variant="outline"
                      className={`${levelColors[meeting.host.level] || 'bg-gray-100'} border font-medium`}
                    >
                      {levelLabels[meeting.host.level]}
                    </Badge>
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
            <h2 className="text-2xl md:text-4xl font-black mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              왜 배드메이트인가요?
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              배드민턴을 더 즐겁고 체계적으로 즐기는 방법
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-blue-200 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center group-hover-hover:hover:scale-110 transition-transform">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold">스마트 매칭</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm md:text-base">
                  AI 기반 실력 매칭으로<br />완벽한 파트너를 찾아드려요
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-purple-200 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-3xl flex items-center justify-center group-hover-hover:hover:scale-110 transition-transform">
                  <TrendingUp className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold">레벨 시스템</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm md:text-base">
                  체계적인 급수 시스템으로<br />실력 향상을 추적하세요
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-pink-200 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-pink-400 to-pink-600 rounded-3xl flex items-center justify-center group-hover-hover:hover:scale-110 transition-transform">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold">랭킹 시스템</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm md:text-base">
                  ELO 레이팅으로 공정한<br />실력 평가를 받아보세요
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="group hover-hover:hover:shadow-2xl transform hover-hover:hover:-translate-y-2 transition-all duration-300 border-2 hover-hover:hover:border-orange-200 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-3xl flex items-center justify-center group-hover-hover:hover:scale-110 transition-transform">
                  <Gift className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl font-bold">리워드</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm md:text-base">
                  활동 포인트로 다양한<br />혜택을 받아보세요
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoggedIn && (
        <section className="container mx-auto px-4 py-20 text-center">
          <Card className="max-w-3xl mx-auto bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiIGN4PSI0MCIgY3k9IjQwIiByPSIyMCIvPjwvZz48L3N2Zz4=')] opacity-20" />
            <CardHeader className="relative pb-6">
              <CardTitle className="text-2xl md:text-4xl font-black mb-4">
                지금 바로 시작하세요!
              </CardTitle>
              <CardDescription className="text-base md:text-xl text-white/90">
                1분 회원가입으로 배드민턴의 새로운 세계를 경험하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover-hover:hover:bg-white/90 active:scale-95 text-base md:text-lg px-8 md:px-10 py-5 md:py-6 rounded-full shadow-xl font-bold transform hover-hover:hover:scale-105 transition-all"
              >
                <Link href="/login">
                  무료로 시작하기
                  <Heart className="ml-2 h-5 w-5 animate-pulse text-red-500" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
}
