"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const supabase = createClientComponentClient();
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 max-w-md mx-auto">
          <p className="font-semibold mb-2">오류 발생</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-600 py-12">
        통계를 불러올 수 없습니다.
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">전체 회원</p>
              <p className="text-3xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-semibold">{stats.users.active.toLocaleString()}</span>
            <span className="text-gray-600 ml-2">활성 회원</span>
          </div>
        </div>

        {/* 모임 통계 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">전체 모임</p>
              <p className="text-3xl font-bold text-gray-900">{stats.meetings.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏸</span>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-semibold">{stats.meetings.recruiting}</span>
            <span className="text-gray-600 ml-2">모집 중</span>
          </div>
        </div>

        {/* 게시글 통계 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">전체 게시글</p>
              <p className="text-3xl font-bold text-gray-900">{stats.posts.total.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-green-600 font-semibold">{stats.posts.published}</span>
            <span className="text-gray-600 ml-2">공개</span>
          </div>
        </div>

        {/* 신고 통계 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">신고 접수</p>
              <p className="text-3xl font-bold text-gray-900">{stats.reports.total}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚨</span>
            </div>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-red-600 font-semibold">{stats.reports.pending}</span>
            <span className="text-gray-600 ml-2">처리 대기</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 상세 통계 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">상세 통계</h2>
          </div>
          <div className="p-6">
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
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">빠른 액션</h2>
          </div>
          <div className="p-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
