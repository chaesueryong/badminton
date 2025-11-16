"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function StatisticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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

  if (!stats) {
    return <div className="text-center text-gray-600 py-12">통계를 불러올 수 없습니다.</div>;
  }

  const usersData = [
    { name: '활성', value: stats.users.active, color: '#10B981' },
    { name: '정지', value: stats.users.suspended, color: '#EF4444' },
    { name: '비활성', value: stats.users.inactive, color: '#6B7280' },
  ];

  const postsData = [
    { name: '공개', value: stats.posts.published, color: '#3B82F6' },
    { name: '숨김', value: stats.posts.hidden, color: '#F59E0B' },
  ];

  const meetingsData = [
    { name: '모집중', value: stats.meetings.recruiting },
    { name: '종료', value: stats.meetings.closed },
  ];

  const gymsData = [
    { name: '승인', value: stats.gyms.approved },
    { name: '대기', value: stats.gyms.pending },
    { name: '거부', value: stats.gyms.rejected },
  ];

  const reportsData = [
    { name: '대기', value: stats.reports.pending, color: '#F59E0B' },
    { name: '처리', value: stats.reports.resolved, color: '#10B981' },
    { name: '기각', value: stats.reports.dismissed, color: '#6B7280' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">통계</h1>
        <p className="text-gray-600 mt-2">플랫폼 전체 통계 현황</p>
      </div>

      {/* 전체 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">전체 회원</p>
          <p className="text-3xl font-bold text-blue-600">{stats.users.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">전체 게시글</p>
          <p className="text-3xl font-bold text-purple-600">{stats.posts.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">전체 모임</p>
          <p className="text-3xl font-bold text-green-600">{stats.meetings.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">전체 체육관</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.gyms.total.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-sm text-gray-600 mb-2">전체 신고</p>
          <p className="text-3xl font-bold text-red-600">{stats.reports.total.toLocaleString()}</p>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 회원 상태 분포 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">회원 상태 분포</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={usersData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 게시글 상태 분포 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">게시글 상태 분포</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={postsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {postsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 모임 현황 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">모임 현황</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={meetingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#10B981" name="모임 수" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 체육관 승인 현황 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">체육관 승인 현황</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gymsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#6366F1" name="체육관 수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 신고 처리 현황 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">신고 처리 현황</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={reportsData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: ${entry.value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {reportsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
