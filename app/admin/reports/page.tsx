"use client";

import { useState } from "react";

interface Report {
  id: string;
  type: "post" | "meeting" | "user";
  targetId: string;
  targetTitle: string;
  reporter: string;
  reporterEmail: string;
  reason: string;
  description: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
  resolvedAt?: string;
}

export default function AdminReportsPage() {
  const [reports] = useState<Report[]>([
    {
      id: "1",
      type: "post",
      targetId: "4",
      targetTitle: "부적절한 내용이 포함된 게시글",
      reporter: "홍길동",
      reporterEmail: "hong@example.com",
      reason: "inappropriate",
      description: "욕설과 비방이 포함되어 있습니다.",
      status: "pending",
      createdAt: "2025-10-28",
    },
    {
      id: "2",
      type: "meeting",
      targetId: "12",
      targetTitle: "사기성 모임 의심",
      reporter: "김영희",
      reporterEmail: "kim@example.com",
      reason: "fraud",
      description: "모임비를 받고 실제 모임을 하지 않는 것 같습니다.",
      status: "pending",
      createdAt: "2025-10-27",
    },
    {
      id: "3",
      type: "user",
      targetId: "789",
      targetTitle: "악성 사용자 (닉네임: 트롤러)",
      reporter: "이철수",
      reporterEmail: "lee@example.com",
      reason: "harassment",
      description: "여러 모임에서 다른 회원들을 괴롭히고 있습니다.",
      status: "pending",
      createdAt: "2025-10-26",
    },
    {
      id: "4",
      type: "post",
      targetId: "8",
      targetTitle: "광고성 게시글",
      reporter: "박민수",
      reporterEmail: "park@example.com",
      reason: "spam",
      description: "상업적 광고 목적의 게시글입니다.",
      status: "resolved",
      createdAt: "2025-10-25",
      resolvedAt: "2025-10-25",
    },
    {
      id: "5",
      type: "meeting",
      targetId: "20",
      targetTitle: "중복 신고된 모임",
      reporter: "정수진",
      reporterEmail: "jung@example.com",
      reason: "duplicate",
      description: "이미 존재하는 모임을 중복으로 생성했습니다.",
      status: "dismissed",
      createdAt: "2025-10-24",
      resolvedAt: "2025-10-24",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.targetTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || report.type === typeFilter;
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    const matchesReason = reasonFilter === "all" || report.reason === reasonFilter;
    return matchesSearch && matchesType && matchesStatus && matchesReason;
  });

  const getTypeBadge = (type: string) => {
    const styles = {
      post: "bg-blue-100 text-blue-800",
      meeting: "bg-green-100 text-green-800",
      user: "bg-purple-100 text-purple-800",
    };
    const labels = {
      post: "게시글",
      meeting: "모임",
      user: "사용자",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[type as keyof typeof styles]
        }`}
      >
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      dismissed: "bg-gray-100 text-gray-800",
    };
    const labels = {
      pending: "대기중",
      resolved: "처리완료",
      dismissed: "기각",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getReasonLabel = (reason: string) => {
    const labels: { [key: string]: string } = {
      inappropriate: "부적절한 내용",
      fraud: "사기/허위",
      harassment: "괴롭힘",
      spam: "스팸/광고",
      duplicate: "중복",
      other: "기타",
    };
    return labels[reason] || reason;
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">신고 관리</h1>
        <p className="text-gray-600 mt-2">사용자 신고 내역 및 처리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">전체 신고</div>
          <div className="text-3xl font-bold text-gray-900">{reports.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">처리 대기</div>
          <div className="text-3xl font-bold text-yellow-600">
            {reports.filter((r) => r.status === "pending").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">처리 완료</div>
          <div className="text-3xl font-bold text-green-600">
            {reports.filter((r) => r.status === "resolved").length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">기각됨</div>
          <div className="text-3xl font-bold text-gray-600">
            {reports.filter((r) => r.status === "dismissed").length}
          </div>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <input
              type="text"
              placeholder="제목, 신고자, 내용으로 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신고 대상
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="post">게시글</option>
              <option value="meeting">모임</option>
              <option value="user">사용자</option>
            </select>
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
              <option value="pending">대기중</option>
              <option value="resolved">처리완료</option>
              <option value="dismissed">기각</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              신고 사유
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              <option value="all">전체</option>
              <option value="inappropriate">부적절한 내용</option>
              <option value="fraud">사기/허위</option>
              <option value="harassment">괴롭힘</option>
              <option value="spam">스팸/광고</option>
              <option value="duplicate">중복</option>
              <option value="other">기타</option>
            </select>
          </div>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                신고 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                대상
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                신고자
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                사유
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                신고일
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
            {filteredReports.map((report) => (
              <tr
                key={report.id}
                className={`hover:bg-gray-50 ${
                  report.status === "pending" ? "bg-yellow-50" : ""
                }`}
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      ID: {report.id}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {report.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    {getTypeBadge(report.type)}
                    <div className="text-sm text-gray-900 mt-2">
                      {report.targetTitle}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{report.reporter}</div>
                  <div className="text-sm text-gray-500">{report.reporterEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getReasonLabel(report.reason)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{report.createdAt}</div>
                  {report.resolvedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      처리: {report.resolvedAt}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(report.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                    상세
                  </button>
                  {report.status === "pending" && (
                    <>
                      <button className="text-green-600 hover:text-green-900 mr-3">
                        처리
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        기각
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            이전
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">1</button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            2
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            3
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
