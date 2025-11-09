"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Gift, Coins } from "lucide-react";
import { toast } from "sonner";

interface RewardItem {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  stock?: number;
  enabled: boolean;
  image_url?: string;
}

interface PointsInfo {
  points: number;
  lifetimePoints: number;
}

interface AttendanceInfo {
  hasCheckedToday: boolean;
  streak: number;
  lastCheckDate: string | null;
}

export default function RewardsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [pointsInfo, setPointsInfo] = useState<PointsInfo>({ points: 0, lifetimePoints: 0 });
  const [attendanceInfo, setAttendanceInfo] = useState<AttendanceInfo>({ hasCheckedToday: false, streak: 0, lastCheckDate: null });
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch rewards
      const rewardsRes = await fetch("/api/points/rewards");
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data.rewards || []);
      }

      // Fetch points balance
      const pointsRes = await fetch("/api/points/balance");
      if (pointsRes.ok) {
        const data = await pointsRes.json();
        setPointsInfo(data);
      }

      // Fetch attendance info
      const attendanceRes = await fetch("/api/points/attendance");
      if (attendanceRes.ok) {
        const data = await attendanceRes.json();
        setAttendanceInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceCheck = async () => {
    if (attendanceInfo.hasCheckedToday) {
      toast("오늘은 이미 출석 체크를 완료했습니다!");
      return;
    }

    try {
      setCheckingAttendance(true);
      const response = await fetch("/api/points/attendance", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        let message = `출석 체크 완료!\n+${data.pointsEarned} 포인트`;
        if (data.bonusMessage) {
          message += `\n\n${data.bonusMessage}`;
        }
        if (data.streak) {
          message += `\n\n연속 출석: ${data.streak}일`;
        }
        toast.success(message);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || "출석 체크에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to check attendance:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handleRedeemClick = (reward: RewardItem) => {
    setSelectedReward(reward);
    setShowRedeemModal(true);
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    if (pointsInfo.points < selectedReward.points_cost) {
      toast.error("포인트가 부족합니다!");
      return;
    }

    try {
      const response = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: selectedReward.id }),
      });

      if (response.ok) {
        toast.success("리워드를 교환했습니다!");
        setShowRedeemModal(false);
        setSelectedReward(null);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || "리워드 교환에 실패했습니다");
      }
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      toast.error("오류가 발생했습니다");
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "discount":
        return "💰";
      case "badge":
        return "🏅";
      case "feature_unlock":
        return "🔓";
      case "gift":
        return "🎁";
      case "voucher":
        return "🎫";
      default:
        return "⭐";
    }
  };

  const getRewardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      discount: "할인",
      badge: "배지",
      feature_unlock: "기능 해금",
      gift: "선물",
      voucher: "상품권",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 py-8 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <Gift className="w-8 h-8 md:w-12 md:h-12 text-purple-600" />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              리워드 샵
            </span>
          </h1>
          <p className="text-gray-700 text-lg">포인트로 다양한 리워드를 교환하세요</p>
        </div>

        {/* Points Balance */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium opacity-90">보유 포인트</h2>
              <p className="text-4xl font-bold mt-2">{pointsInfo.points.toLocaleString()} P</p>
            </div>
            <Coins className="w-16 h-16 opacity-20" />
          </div>
        </div>

        {/* Attendance Check */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 mb-8 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📅</span>
                <h2 className="text-2xl font-bold text-green-900">출석 체크</h2>
              </div>
              <p className="text-green-700 mb-2">매일 출석하고 포인트를 받으세요!</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-semibold">연속 출석:</span>
                    <span className="text-green-900 font-bold">{attendanceInfo.streak}일</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-semibold">기본 보상:</span>
                    <span className="text-green-900 font-bold">+10 P</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-amber-600">🎁</span>
                  <span className="text-amber-700 font-semibold">100일 단위 달성 시 +100 P 보너스!</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleAttendanceCheck}
              disabled={attendanceInfo.hasCheckedToday || checkingAttendance}
              className={`px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 shadow-md ${
                attendanceInfo.hasCheckedToday
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover-hover:hover:from-green-700 hover-hover:hover:to-emerald-700 hover-hover:hover:shadow-lg active:scale-95"
              }`}
            >
              {checkingAttendance ? "처리 중..." : attendanceInfo.hasCheckedToday ? "✓ 완료" : "출석하기"}
            </button>
          </div>
        </div>

        {/* Rewards Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">리워드가 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => {
              const canAfford = pointsInfo.points >= reward.points_cost;
              const isAvailable = reward.enabled && (!reward.stock || reward.stock > 0);

              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover-hover:hover:shadow-2xl  ${
                    !canAfford || !isAvailable ? "opacity-60" : ""
                  }`}
                >
                  <div className="p-6">
                    {/* Icon/Image */}
                    <div className="flex items-center justify-center h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl mb-4">
                      {reward.image_url ? (
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-6xl drop-shadow-lg">{getRewardIcon(reward.reward_type)}</span>
                      )}
                    </div>

                    {/* Reward Info */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          {getRewardTypeLabel(reward.reward_type)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{reward.description}</p>

                      {/* Stock Info */}
                      {reward.stock !== null && (
                        <p className="text-xs text-gray-500 mb-2">
                          재고: {reward.stock}개
                        </p>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <span className="text-2xl font-bold text-indigo-600">
                          {reward.points_cost.toLocaleString()}
                        </span>
                        <span className="text-gray-600 ml-1">P</span>
                      </div>
                      <button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canAfford || !isAvailable}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          canAfford && isAvailable
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover-hover:hover:from-indigo-700 hover-hover:hover:to-purple-700 shadow-md hover-hover:hover:shadow-lg"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {!isAvailable
                          ? "품절"
                          : canAfford
                          ? "교환하기"
                          : "포인트 부족"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to Earn Points */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
            💡 포인트 획득 방법
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm hover-hover:hover:shadow-md transition-shadow">
              <span className="text-3xl">📅</span>
              <div>
                <div className="font-semibold text-blue-900">출석 체크</div>
                <div className="text-lg font-bold text-indigo-600">10 P / 일</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm hover-hover:hover:shadow-md transition-shadow">
              <span className="text-3xl">🎯</span>
              <div>
                <div className="font-semibold text-blue-900">경기 승리</div>
                <div className="text-lg font-bold text-indigo-600">150 P</div>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm hover-hover:hover:shadow-md transition-shadow">
              <span className="text-3xl">👥</span>
              <div>
                <div className="font-semibold text-blue-900">친구 초대</div>
                <div className="text-lg font-bold text-indigo-600">100 P</div>
              </div>
            </div>
          </div>
        </div>

        {/* Redeem Modal */}
        {showRedeemModal && selectedReward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                🎁 리워드 교환 확인
              </h3>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">{selectedReward.name}</p>
                <p className="text-sm text-gray-600 mb-4">{selectedReward.description}</p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">필요 포인트</span>
                    <span className="font-bold text-indigo-600">
                      {selectedReward.points_cost.toLocaleString()} P
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">보유 포인트</span>
                    <span className="font-medium">
                      {pointsInfo.points.toLocaleString()} P
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">교환 후 잔액</span>
                      <span className="font-bold">
                        {(pointsInfo.points - selectedReward.points_cost).toLocaleString()} P
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRedeemModal(false);
                    setSelectedReward(null);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover-hover:hover:bg-gray-50 transition-all duration-300 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleRedeem}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover-hover:hover:from-indigo-700 hover-hover:hover:to-purple-700 transition-all duration-300 shadow-lg hover-hover:hover:shadow-xl font-medium"
                >
                  교환하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
