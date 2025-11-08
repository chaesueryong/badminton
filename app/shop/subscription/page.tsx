"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Crown, Sparkles, Check, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import * as PortOne from "@portone/browser-sdk/v2";
import type { SubscriptionPlan } from "@/types/subscription";

export default function SubscriptionPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchPlans();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions/plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      toast.error('플랜 정보를 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowModal(true);
  };

  const confirmSubscription = async () => {
    if (!selectedPlan || processing) return;

    try {
      setProcessing(true);

      // 1. 결제 준비
      const checkoutResponse = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id })
      });

      if (!checkoutResponse.ok) {
        const error = await checkoutResponse.json();
        throw new Error(error.error || '결제 준비 실패');
      }

      const { paymentId, plan, user } = await checkoutResponse.json();

      // 2. 포트원 결제 요청 (정기결제 채널 사용)
      // TODO: 실제 포트원 Store ID와 Channel Key로 변경 필요
      const response = await PortOne.requestPayment({
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || 'store-test-id',
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_SUBSCRIPTION || 'channel-key-subscription-test',
        paymentId: paymentId,
        orderName: plan.name,
        totalAmount: plan.price,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD'
      });

      if (!response || response.code != null) {
        // 결제 실패
        toast.error(`결제 실패: ${response?.message || '알 수 없는 오류'}`);
        return;
      }

      // 3. 결제 완료 처리
      const completeResponse = await fetch('/api/subscriptions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: paymentId,
          transactionId: response.paymentId,
          planId: selectedPlan.id
        })
      });

      if (!completeResponse.ok) {
        throw new Error('결제 완료 처리 실패');
      }

      toast.success('구독이 완료되었습니다! 🎉');
      setShowModal(false);
      router.push('/profile');
    } catch (error: any) {
      console.error('Subscription error:', error);
      toast.error(error.message || '구독 처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center pb-20 md:pb-8">
        <div className="text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Crown className="w-10 h-10 text-yellow-500" />
            <h1 className="text-3xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                프리미엄 구독
              </span>
            </h1>
          </div>
          <p className="text-gray-700 text-lg">당신에게 맞는 플랜을 선택하세요</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const isYearly = plan.billing_period === 'YEARLY';
            const monthlyPrice = isYearly ? Math.floor(plan.price / 12) : plan.price;
            const features = Array.isArray(plan.features) ? plan.features : [];

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover-hover:hover:shadow-2xl hover-hover:hover:-translate-y-1 ${
                  isYearly ? 'border-4 border-yellow-400' : 'border border-gray-200'
                }`}
              >
                {isYearly && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    2개월 무료
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div className="flex items-center justify-center h-20 mb-4">
                    {isYearly ? (
                      <Crown className="w-16 h-16 text-yellow-500" />
                    ) : (
                      <Sparkles className="w-16 h-16 text-purple-500" />
                    )}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-center mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-center mb-6">{plan.description || ''}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price.toLocaleString()}원
                      </span>
                      <span className="text-gray-500">
                        / {isYearly ? '연' : '월'}
                      </span>
                    </div>
                    {isYearly && (
                      <p className="text-sm text-green-600 mt-2 text-center">
                        월 {monthlyPrice.toLocaleString()}원 (월 구독 대비 16% 할인)
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Subscribe Button */}
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={processing}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover-hover:hover:shadow-xl ${
                      isYearly
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover-hover:hover:from-yellow-500 hover-hover:hover:to-orange-600'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover-hover:hover:from-blue-700 hover-hover:hover:to-purple-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing ? '처리 중...' : '구독하기'}
                  </button>
                </div>
              </div>
            );
          })}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              {selectedPlan.billing_period === 'YEARLY' ? (
                <Crown className="w-8 h-8 text-yellow-500" />
              ) : (
                <Sparkles className="w-8 h-8 text-purple-500" />
              )}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-center">{selectedPlan.name} 구독</h3>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">결제 금액</span>
                <span className="font-bold text-2xl text-gray-900">
                  {selectedPlan.price.toLocaleString()}원
                </span>
              </div>
              <div className="text-sm text-gray-500 text-right">
                / {selectedPlan.billing_period === 'YEARLY' ? '연' : '월'}
              </div>
              {selectedPlan.billing_period === 'YEARLY' && (
                <p className="text-sm text-green-600 mt-2 text-center">
                  월 {Math.floor(selectedPlan.price / 12).toLocaleString()}원 (16% 할인)
                </p>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <p className="font-medium">포함된 혜택:</p>
              <ul className="space-y-2">
                {(Array.isArray(selectedPlan.features) ? selectedPlan.features : []).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedPlan(null);
                }}
                disabled={processing}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover-hover:hover:bg-gray-50 transition-all duration-300 font-medium disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={confirmSubscription}
                disabled={processing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover-hover:hover:from-blue-700 hover-hover:hover:to-purple-700 transition-all duration-300 shadow-lg hover-hover:hover:shadow-xl font-medium disabled:opacity-50"
              >
                {processing ? '처리 중...' : '결제하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
