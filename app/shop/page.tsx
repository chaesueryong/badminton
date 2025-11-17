"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Feather, Receipt, Coins } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface FeatherProduct {
  id: string;
  name: string;
  description: string;
  feather_amount: number;
  bonus_feathers: number;
  price_krw: number;
  is_popular: boolean;
}

interface UserBalance {
  feathers: number;
  points: number;
}

export default function ShopPage() {
  const router = useRouter();
  const [products, setProducts] = useState<FeatherProduct[]>([]);
  const [balance, setBalance] = useState<UserBalance>({ feathers: 0, points: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FeatherProduct | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch feather products
      const productsRes = await fetch("/api/shop/feathers");
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }

      // Fetch user balance
      const balanceRes = await fetch("/api/shop/balance");
      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance({ feathers: data.feathers || 0, points: data.points || 0 });
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (product: FeatherProduct) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const confirmPurchase = async () => {
    if (!selectedProduct || processing) return;

    try {
      setProcessing(true);

      // 1. 사용자 인증 확인
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // 2. 결제 ID 생성
      const paymentId = `feather-${session.user.id}-${Date.now()}`;

      // 3. 포트원 SDK 확인
      const PortOne = (window as any).PortOne;
      console.log('[PortOne SDK]', PortOne ? 'Loaded' : 'Not Loaded');
      if (!PortOne) {
        throw new Error('PortOne SDK가 로드되지 않았습니다.');
      }

      // 4. 실제 모바일 기기 감지 (User Agent 기반)
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      console.log('[Device Detection]', {
        userAgent: navigator.userAgent,
        isMobileDevice,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight
      });

      console.log('[Selected Product]', selectedProduct);

      // 5. 결제 요청 객체 구성
      const paymentRequest: any = {
        storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID!,
        channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_GENERAL!,
        paymentId: paymentId,
        orderName: selectedProduct.name,
        totalAmount: selectedProduct.price_krw,
        currency: 'CURRENCY_KRW',
        payMethod: 'CARD',
      };

      console.log('[Payment Request Base]', paymentRequest);

      // windowType 설정 (실제 모바일 기기에서만 REDIRECTION 사용)
      if (isMobileDevice) {
        // 실제 모바일 기기: REDIRECTION 방식
        paymentRequest.windowType = {
          pc: 'REDIRECTION',
          mobile: 'REDIRECTION'
        };
        paymentRequest.redirectUrl = `${window.location.origin}/shop/feathers/callback?paymentId=${paymentId}&productId=${selectedProduct.id}`;
        console.log('[Mobile Device - REDIRECTION]', JSON.stringify(paymentRequest, null, 2));
      } else {
        // PC (화면 크기 무관): IFRAME 방식만 가능
        paymentRequest.windowType = {
          pc: 'IFRAME',
          mobile: 'IFRAME'
        };
        console.log('[PC - IFRAME]', JSON.stringify(paymentRequest, null, 2));
      }

      console.log('[About to call requestPayment]');
      // 6. 포트원 결제 요청
      const response = await PortOne.requestPayment(paymentRequest);

      console.log('[Payment Response]', response);
      console.log('[Payment Response Type]', typeof response);
      console.log('[Payment Response Keys]', response ? Object.keys(response) : 'null');

      // IFRAME 방식인 경우에만 아래 로직 실행
      if (!response || response.code != null) {
        // 사용자가 취소했거나 결제 실패
        if (response?.code === 'PORTONE_ERROR' || response?.message?.includes('취소')) {
          toast.info('결제가 취소되었습니다');
        } else {
          toast.error(`결제 실패: ${response?.message || '알 수 없는 오류'}`);
        }
        return;
      }

      // 7. 결제 완료 처리 API 호출
      const completeResponse = await fetch('/api/shop/feathers/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          paymentId: paymentId,
          transactionId: response.paymentId
        })
      });

      if (!completeResponse.ok) {
        throw new Error('결제 완료 처리 실패');
      }

      const result = await completeResponse.json();
      toast.success(`🎉 ${selectedProduct.feather_amount + selectedProduct.bonus_feathers}개의 깃털을 받았습니다!`);

      // 잔액 새로고침
      setBalance({ feathers: result.newBalance || 0, points: balance.points });
      setShowModal(false);
      setSelectedProduct(null);
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || '결제 처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://cdn.portone.io/v2/browser-sdk.js" strategy="afterInteractive" />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 py-8 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <Feather className="w-8 h-8 md:w-12 md:h-12 text-amber-600" />
            <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
              깃털 상점
            </span>
          </h1>
          <p className="text-gray-700 text-lg mb-4">깃털을 구매하여 프리미엄 혜택과 다양한 아이템을 이용하세요</p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/shop/subscription"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg hover-hover:hover:shadow-xl transition-all duration-300"
            >
              💳 프리미엄 & VIP 구독하기
            </Link>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-bold text-lg shadow-lg hover-hover:hover:shadow-xl hover-hover:hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200"
            >
              <Receipt className="w-5 h-5" />
              거래 내역
            </Link>
          </div>
        </div>

        {/* Balance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium opacity-90">보유 깃털</h2>
                <p className="text-3xl font-bold mt-2">{balance.feathers.toLocaleString()}</p>
              </div>
              <Feather className="w-12 h-12 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium opacity-90">보유 포인트</h2>
                <p className="text-3xl font-bold mt-2">{balance.points.toLocaleString()}</p>
              </div>
              <Coins className="w-12 h-12 opacity-20" />
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">로딩 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600">판매 중인 상품이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const totalFeathers = product.feather_amount + product.bonus_feathers;
              const bonusPercent = product.bonus_feathers > 0
                ? Math.round((product.bonus_feathers / product.feather_amount) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-shadow duration-300 hover-hover:hover:shadow-2xl ${
                    product.is_popular ? "ring-4 ring-amber-500" : ""
                  }`}
                >
                  {product.is_popular && (
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white text-center py-2 font-bold text-sm">
                      ⭐ 인기 상품
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon */}
                    <div className="flex items-center justify-center h-32 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl mb-4">
                      <Feather className="w-20 h-20 text-amber-600" strokeWidth={1.5} />
                    </div>

                    {/* Product Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{product.description}</p>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700">기본 깃털</span>
                          <span className="font-bold text-amber-600 flex items-center gap-1">
                            <Feather className="w-4 h-4" />
                            {product.feather_amount.toLocaleString()}
                          </span>
                        </div>

                        {product.bonus_feathers > 0 && (
                          <div className="flex items-center justify-between bg-amber-50 p-2 rounded">
                            <span className="text-amber-700 font-medium text-sm">
                              🎁 보너스 ({bonusPercent}%)
                            </span>
                            <span className="font-bold text-amber-600">
                              +{product.bonus_feathers.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="border-t pt-2 flex items-center justify-between">
                          <span className="text-gray-700 font-semibold">총 획득</span>
                          <span className="font-bold text-2xl text-amber-600 flex items-center gap-1">
                            <Feather className="w-5 h-5" />
                            {totalFeathers.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="space-y-3">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          ₩{product.price_krw.toLocaleString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePurchase(product)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl hover-hover:hover:from-amber-600 hover-hover:hover:to-yellow-700 transition-all duration-300 shadow-lg hover-hover:hover:shadow-xl font-bold"
                      >
                        구매하기
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">
            깃털로 할 수 있는 것들
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">게임 세션 생성</div>
                <div className="text-sm text-gray-600">깃털로 새로운 게임 세션을 생성하세요</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">메시징</div>
                <div className="text-sm text-gray-600">다른 사용자에게 메시지 보내기</div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Modal */}
        {showModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center gap-2">
                <Feather className="w-6 h-6 text-amber-600" />
                구매 확인
              </h3>
              <div className="mb-6">
                <p className="text-gray-700 mb-2 font-semibold text-lg">{selectedProduct.name}</p>
                <div className="bg-amber-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">기본 깃털</span>
                    <span className="font-bold text-amber-600 flex items-center gap-1">
                      <Feather className="w-4 h-4" />
                      {selectedProduct.feather_amount.toLocaleString()}
                    </span>
                  </div>
                  {selectedProduct.bonus_feathers > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">보너스 깃털</span>
                      <span className="font-bold text-amber-600">
                        +{selectedProduct.bonus_feathers.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-gray-700 font-semibold">결제 금액</span>
                    <span className="font-bold text-2xl text-gray-900">
                      ₩{selectedProduct.price_krw.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={confirmPurchase}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-xl hover-hover:hover:from-amber-600 hover-hover:hover:to-yellow-700 transition-all duration-300 shadow-lg hover-hover:hover:shadow-xl font-medium"
                >
                  결제하기
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedProduct(null);
                  }}
                  className="w-full px-6 py-3 border-2 border-gray-300 rounded-xl hover-hover:hover:bg-gray-50 transition-all duration-300 font-medium"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
