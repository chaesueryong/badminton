"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Gym {
  id: string;
  name: string;
  address: string;
  province: string;
  city: string;
  courtCount: number;
  pricePerHour: number;
  averageRating: number | null;
  reviewCount: number;
  approval_status: string;
  createdAt: string;
}

export default function AdminGymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchGyms();
  }, [page, statusFilter]);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (statusFilter !== "all") params.append("approvalStatus", statusFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/gyms?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGyms(data.gyms || []);
        setTotalPages(data.pagination?.totalPages || 1);

        // 통계 계산
        setStats({
          total: data.pagination?.total || 0,
          approved: data.gyms?.filter((g: Gym) => g.approval_status === "APPROVED").length || 0,
          pending: data.gyms?.filter((g: Gym) => g.approval_status === "PENDING").length || 0,
          rejected: data.gyms?.filter((g: Gym) => g.approval_status === "REJECTED").length || 0,
        });
      }
    } catch (error) {
      console.error("Failed to fetch gyms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchGyms();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      APPROVED: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    const labels: Record<string, string> = {
      APPROVED: "승인",
      PENDING: "대기중",
      REJECTED: "거부",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">체육관 관리</h1>
        <p className="text-gray-600 mt-2">전체 체육관 목록 및 승인 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">전체 체육관</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">승인됨</div>
          <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">승인 대기</div>
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">거부됨</div>
          <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <input
              type="text"
              placeholder="체육관명 또는 주소로 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="APPROVED">승인</option>
              <option value="PENDING">대기중</option>
              <option value="REJECTED">거부</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleSearch}
          className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          검색
        </button>
      </div>

      {/* 체육관 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : gyms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">체육관이 없습니다</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  체육관 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  지역
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시설
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gyms.map((gym) => (
                <tr
                  key={gym.id}
                  className={`hover:bg-gray-50 ${
                    gym.approval_status === "PENDING" ? "bg-yellow-50" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{gym.name}</div>
                      <div className="text-sm text-gray-500">{gym.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{gym.province} {gym.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      코트 {gym.courtCount}개<br />
                      {gym.pricePerHour.toLocaleString()}원/시간
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {gym.averageRating && gym.averageRating > 0 ? (
                      <div className="text-sm text-gray-900">
                        ⭐ {gym.averageRating.toFixed(1)} ({gym.reviewCount})
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">리뷰 없음</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(gym.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(gym.approval_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      상세
                    </button>
                    {gym.approval_status === "PENDING" && (
                      <>
                        <button className="text-green-600 hover:text-green-900 mr-3">
                          승인
                        </button>
                        <button className="text-red-600 hover:text-red-900">거부</button>
                      </>
                    )}
                    {gym.approval_status === "APPROVED" && (
                      <button className="text-red-600 hover:text-red-900">삭제</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`px-4 py-2 rounded-lg ${
                    page === pageNum
                      ? "bg-indigo-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
