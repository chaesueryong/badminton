"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  users: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
  };
  posts: {
    total: number;
    published: number;
    hidden: number;
  };
  meetings: {
    total: number;
    recruiting: number;
    closed: number;
  };
  gyms: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
}

export default function AdminDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("로그인이 필요합니다");
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/stats');

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        setError(`API 오류: ${errorData.error || response.statusText}`);
        console.error('API error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError(`통계 조회 실패: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Alert variant="destructive" className="max-w-md mx-auto">
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>통계를 불러올 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">배드메이트 관리자 대시보드</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 회원 통계 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 회원</CardTitle>
              <p className="text-3xl font-bold mt-2">{stats.users.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-semibold">{stats.users.active.toLocaleString()}</span>
              <span className="text-muted-foreground ml-2">활성 회원</span>
            </div>
          </CardContent>
        </Card>

        {/* 모임 통계 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 모임</CardTitle>
              <p className="text-3xl font-bold mt-2">{stats.meetings.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏸</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-semibold">{stats.meetings.recruiting}</span>
              <span className="text-muted-foreground ml-2">모집 중</span>
            </div>
          </CardContent>
        </Card>

        {/* 게시글 통계 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">전체 게시글</CardTitle>
              <p className="text-3xl font-bold mt-2">{stats.posts.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-semibold">{stats.posts.published}</span>
              <span className="text-muted-foreground ml-2">공개</span>
            </div>
          </CardContent>
        </Card>

        {/* 신고 통계 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium text-muted-foreground">신고 접수</CardTitle>
              <p className="text-3xl font-bold mt-2">{stats.reports.total}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm">
              <span className="text-red-600 font-semibold">{stats.reports.pending}</span>
              <span className="text-muted-foreground ml-2">처리 대기</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상세 통계 */}
        <Card>
          <CardHeader>
            <CardTitle>상세 통계</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">정지된 회원</span>
                <span className="font-semibold text-red-600">{stats.users.suspended}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">비활성 회원</span>
                <span className="font-semibold text-gray-600">{stats.users.inactive}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">숨김 처리된 게시글</span>
                <span className="font-semibold text-orange-600">{stats.posts.hidden}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">승인 대기 체육관</span>
                <span className="font-semibold text-blue-600">{stats.gyms.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">처리된 신고</span>
                <span className="font-semibold text-green-600">{stats.reports.resolved}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">기각된 신고</span>
                <span className="font-semibold text-gray-600">{stats.reports.dismissed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 빠른 액션 */}
        <Card>
          <CardHeader>
            <CardTitle>빠른 액션</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/admin/users"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
              >
                <div className="text-3xl mb-2">👥</div>
                <div className="text-sm font-semibold">회원 관리</div>
              </Link>
              <Link
                href="/admin/meetings"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
              >
                <div className="text-3xl mb-2">🏸</div>
                <div className="text-sm font-semibold">모임 관리</div>
              </Link>
              <Link
                href="/admin/posts"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
              >
                <div className="text-3xl mb-2">📝</div>
                <div className="text-sm font-semibold">게시글 관리</div>
              </Link>
              <Link
                href="/admin/reports"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition text-center"
              >
                <div className="text-3xl mb-2">🚨</div>
                <div className="text-sm font-semibold text-red-600">
                  신고 처리 ({stats.reports.pending})
                </div>
              </Link>
              <Link
                href="/admin/gyms"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
              >
                <div className="text-3xl mb-2">🏢</div>
                <div className="text-sm font-semibold">체육관 관리</div>
              </Link>
              <Link
                href="/admin/statistics"
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition text-center"
              >
                <div className="text-3xl mb-2">📈</div>
                <div className="text-sm font-semibold">통계 보기</div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
