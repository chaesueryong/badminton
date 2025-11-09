"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, TrendingUp, DollarSign, Calendar, Clock, ChevronRight, Plus, List, CalendarDays } from "lucide-react";
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
  hostId: string;
  thumbnailImage?: string | null;
  host?: {
    id: string;
    name?: string;
    nickname?: string;
    level?: string;
    profileImage?: string;
  };
  isHost?: boolean;
  isParticipant?: boolean;
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

export default function MyMeetingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "hosting" | "participating">("all");
  const [viewType, setViewType] = useState<"list" | "calendar">("list");

  useEffect(() => {
    checkAuthAndFetchMeetings();
  }, []);

  const checkAuthAndFetchMeetings = async () => {
    setIsLoading(true);

    try {
      // 인증 확인
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?redirect=/meetings/my");
        return;
      }

      // 내 모임 가져오기
      const response = await fetch("/api/meetings/my");
      if (response.ok) {
        const data = await response.json();
        setMeetings(data || []);
      } else {
        console.error("Failed to fetch meetings");
        setMeetings([]);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
      setMeetings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMeetings = meetings.filter(meeting => {
    if (activeTab === "hosting") return meeting.isHost;
    if (activeTab === "participating") return meeting.isParticipant;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">내 모임</h1>
            <Link href="/meetings/create">
              <Button className="bg-blue-600 hover-hover:hover:bg-blue-700 text-white text-sm sm:text-base px-3 sm:px-4 py-2">
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                모임 만들기
              </Button>
            </Link>
          </div>

          {/* 탭 네비게이션 - 모바일에서 스크롤 가능 */}
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 min-w-[100px] px-2 sm:px-4 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover-hover:hover:text-gray-900"
              }`}
            >
              전체 ({meetings.length})
            </button>
            <button
              onClick={() => setActiveTab("hosting")}
              className={`flex-1 min-w-[100px] px-2 sm:px-4 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "hosting"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover-hover:hover:text-gray-900"
              }`}
            >
              내가 만든 ({meetings.filter(m => m.isHost).length})
            </button>
            <button
              onClick={() => setActiveTab("participating")}
              className={`flex-1 min-w-[100px] px-2 sm:px-4 py-2 rounded-md font-medium transition-colors text-xs sm:text-sm whitespace-nowrap ${
                activeTab === "participating"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover-hover:hover:text-gray-900"
              }`}
            >
              참여 중 ({meetings.filter(m => m.isParticipant).length})
            </button>
          </div>
        </div>

        {/* 모임 리스트 */}
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="text-gray-500 mb-4">
              {activeTab === "hosting"
                ? "아직 만든 모임이 없습니다."
                : activeTab === "participating"
                ? "아직 참여 중인 모임이 없습니다."
                : "아직 참여 중인 모임이 없습니다."}
            </div>
            <Link href="/meetings">
              <Button variant="outline">
                모임 둘러보기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/meetings/${meeting.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full overflow-hidden">
                  {/* 모임 썸네일 이미지 */}
                  <div className="w-full h-48 bg-gray-100 overflow-hidden">
                    <img
                      src={meeting.thumbnailImage || getDefaultImage('meeting')}
                      alt={meeting.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {meeting.title}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        {meeting.isHost && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            주최자
                          </Badge>
                        )}
                        <Badge
                          variant={statusConfig[meeting.status]?.variant || "outline"}
                        >
                          {statusConfig[meeting.status]?.label || meeting.status}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {meeting.region}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* 날짜 */}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">{formatDate(meeting.date)}</span>
                      </div>

                      {/* 레벨 */}
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          {formatLevelRange(meeting.levelMin, meeting.levelMax)}
                        </span>
                      </div>

                      {/* 참가자 */}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          {meeting.currentCount}/{meeting.maxParticipants}명
                        </span>
                        {meeting.currentCount >= meeting.maxParticipants && (
                          <Badge variant="secondary" className="text-xs">
                            마감
                          </Badge>
                        )}
                      </div>

                      {/* 참가비 */}
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-700">
                          {meeting.fee > 0 ? `${meeting.fee.toLocaleString()}원` : "무료"}
                        </span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-600 font-medium">
                        자세히 보기
                      </span>
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}