"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface LeaderboardEntry {
  id: string;
  name: string;
  nickname: string;
  profile_image?: string;
  elo_rating: number;
  elo_peak: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
  win_rate: number;
  region: string;
  level: string;
  rank: number;
  regional_rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [viewType, setViewType] = useState<"global" | "regional">("global");

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedRegion]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedRegion) params.append("region", selectedRegion);
      params.append("limit", "50");

      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-600";
    if (rank === 2) return "text-gray-400";
    if (rank === 3) return "text-orange-600";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              🏆 리더보드
            </span>
          </h1>
          <p className="text-gray-700 text-lg">전국 최고의 배드민턴 선수들과 순위를 확인하세요</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보기 유형
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewType("global");
                    setSelectedRegion("");
                  }}
                  className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium ${
                    viewType === "global"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  전국 순위
                </button>
                <button
                  onClick={() => setViewType("regional")}
                  className={`px-6 py-2 rounded-lg transition-all duration-300 font-medium ${
                    viewType === "regional"
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  지역별 순위
                </button>
              </div>
            </div>

            {viewType === "regional" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지역 선택
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="서울">서울</option>
                  <option value="경기">경기</option>
                  <option value="인천">인천</option>
                  <option value="부산">부산</option>
                  <option value="대구">대구</option>
                  <option value="대전">대전</option>
                  <option value="광주">광주</option>
                  <option value="울산">울산</option>
                  <option value="세종">세종</option>
                  <option value="강원">강원</option>
                  <option value="충북">충북</option>
                  <option value="충남">충남</option>
                  <option value="전북">전북</option>
                  <option value="전남">전남</option>
                  <option value="경북">경북</option>
                  <option value="경남">경남</option>
                  <option value="제주">제주</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">순위 데이터가 없습니다</p>
              <p className="text-sm text-gray-500 mt-2">
                경기에 참여하여 ELO 레이팅을 받으세요!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      선수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ELO 레이팅
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      최고 ELO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      경기 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전적
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      승률
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등급
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
                          {getMedalIcon(entry.rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/profile/${entry.id}`}
                          className="flex items-center hover:text-indigo-600 transition"
                        >
                          <div className="flex-shrink-0 h-10 w-10">
                            {entry.profile_image ? (
                              <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={entry.profile_image}
                                alt={entry.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {entry.name?.charAt(0) || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.nickname || entry.name}
                            </div>
                            <div className="text-sm text-gray-500">{entry.region}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-bold text-indigo-600">
                          {entry.elo_rating}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.elo_peak}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.games_played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-green-600">{entry.wins}승</span>
                        <span className="text-gray-400 mx-1">/</span>
                        <span className="text-red-600">{entry.losses}패</span>
                        {entry.draws > 0 && (
                          <>
                            <span className="text-gray-400 mx-1">/</span>
                            <span className="text-gray-600">{entry.draws}무</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-sm font-medium ${
                            entry.win_rate >= 60
                              ? "text-green-600"
                              : entry.win_rate >= 40
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {entry.win_rate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {entry.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-orange-900 mb-3 text-center">
            📊 ELO 레이팅 시스템이란?
          </h3>
          <p className="text-orange-800 mb-6 text-center">
            ELO 레이팅은 체스에서 시작된 상대적인 실력 평가 시스템입니다. 경기 결과에 따라
            레이팅이 변동되며, 강한 상대를 이길 때 더 많은 포인트를 얻을 수 있습니다.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-sm text-gray-600 font-medium">E 등급</div>
              <div className="font-bold text-lg text-gray-800">0 - 1199</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-sm text-gray-600 font-medium">D 등급</div>
              <div className="font-bold text-lg text-gray-800">1200 - 1399</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-sm text-gray-600 font-medium">C 등급</div>
              <div className="font-bold text-lg text-gray-800">1400 - 1599</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-sm text-gray-600 font-medium">B 등급</div>
              <div className="font-bold text-lg text-gray-800">1600 - 1799</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-sm text-gray-600 font-medium">A 등급</div>
              <div className="font-bold text-lg text-gray-800">1800 - 1999</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-sm text-gray-600 font-medium">S 등급</div>
              <div className="font-bold text-lg text-red-600">2000+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
