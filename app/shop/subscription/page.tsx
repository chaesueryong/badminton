"use client";

import { useState } from "react";
import { Crown, Sparkles, Check, X } from "lucide-react";
import Link from "next/link";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  type: "premium" | "vip";
  features: string[];
  monthlyPrice: number;
  popular?: boolean;
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "premium",
    name: "프리미엄",
    description: "모임 관련 프리미엄 기능",
    type: "premium",
    features: [
      "모임 참가 인원 최대 300명",
      "프로필 하이라이트 배지",
    ],
    monthlyPrice: 9900,
  },
  {
    id: "vip",
    name: "VIP",
    description: "광고 없는 프리미엄 경험",
    type: "vip",
    features: [
      "광고 완전 제거",
      "무제한 메시지 (포인트 비용 없음)",
      "VIP 전용 배지",
    ],
    monthlyPrice: 4900,
    popular: true,
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const confirmSubscription = () => {
    if (!selectedPlan) return;

    // 실제 결제는 토스페이먼츠나 다른 PG사 연동 필요
    alert(`${selectedPlan.name} 구독 결제 기능은 추후 구현 예정입니다.`);
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              구독 플랜
            </span>
          </h1>
          <p className="text-gray-700 text-lg">당신에게 맞는 플랜을 선택하세요</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {subscriptionPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-shadow duration-300 hover-hover:hover:shadow-2xl ${
                plan.popular ? "ring-4 ring-blue-500" : ""
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 font-bold">
                  ⭐ 가장 인기있는 플랜
                </div>
              )}

              <div className="p-8">
                {/* Icon */}
                <div className="flex items-center justify-center h-20 mb-4">
                  {plan.type === "premium" ? (
                    <Crown className="w-16 h-16 text-yellow-500" />
                  ) : (
                    <Sparkles className="w-16 h-16 text-purple-500" />
                  )}
                </div>

                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                <p className="text-gray-600 text-center mb-6">{plan.description}</p>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900">
                    {plan.monthlyPrice.toLocaleString()}원
                  </div>
                  <div className="text-gray-600 mt-1">/ 월</div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Subscribe Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
                    plan.type === "premium"
                      ? "bg-gradient-to-r from-yellow-500 to-amber-600 hover-hover:hover:from-yellow-600 hover-hover:hover:to-amber-700 text-white"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover-hover:hover:from-blue-700 hover-hover:hover:to-purple-700 text-white"
                  }`}
                >
                  구독하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Shop Link */}
        <div className="text-center mt-8">
          <Link
            href="/shop"
            className="inline-block text-blue-600 hover-hover:hover:text-blue-700 font-medium"
          >
            ← 상점으로 돌아가기
          </Link>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">{selectedPlan.name} 구독</h3>
            <p className="text-gray-600 mb-6">
              {selectedPlan.monthlyPrice.toLocaleString()}원 / 월
            </p>

            <div className="space-y-2 mb-6">
              <p className="font-medium">포함된 혜택:</p>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover-hover:hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmSubscription}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover-hover:hover:bg-blue-700 transition-colors"
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
