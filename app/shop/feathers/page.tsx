"use client";

import { useState, useEffect } from "react";
import { Check, Feather } from "lucide-react";

interface FeatherProduct {
  id: string;
  name: string;
  description: string;
  feather_amount: number;
  bonus_feathers: number;
  price_krw: number;
  is_popular: boolean;
}

export default function FeathersShopPage() {
  const [products, setProducts] = useState<FeatherProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<FeatherProduct | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/shop/feathers");
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (product: FeatherProduct) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const confirmPurchase = () => {
    // 실제 결제는 토스페이먼츠나 다른 PG사 연동 필요
    alert("결제 기능은 추후 구현 예정입니다.");
    setShowModal(false);
    setSelectedProduct(null);
  };

  return (
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
          <p className="text-gray-700 text-lg">깃털을 구매하여 프리미엄 혜택과 다양한 아이템을 이용하세요</p>
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
                          <span className="font-bold text-amber-600">
                            🪶 {product.feather_amount.toLocaleString()}
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
                          <span className="font-bold text-2xl text-amber-600">
                            🪶 {totalFeathers.toLocaleString()}
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
                <div className="font-semibold text-gray-900">프리미엄 멤버십</div>
                <div className="text-sm text-gray-600">무제한 쪽지, 프로필 강조, 광고 제거 등</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">모임 부스트</div>
                <div className="text-sm text-gray-600">내 모임을 상단에 노출</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">특별 배지</div>
                <div className="text-sm text-gray-600">프로필에 특별한 배지 표시</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <div className="font-semibold text-gray-900">모임 인원 제한 해제</div>
                <div className="text-sm text-gray-600">더 많은 인원으로 모임 생성</div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchase Modal */}
        {showModal && selectedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                🪶 구매 확인
              </h3>
              <div className="mb-6">
                <p className="text-gray-700 mb-2 font-semibold text-lg">{selectedProduct.name}</p>
                <div className="bg-amber-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">기본 깃털</span>
                    <span className="font-bold text-amber-600">
                      🪶 {selectedProduct.feather_amount.toLocaleString()}
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
  );
}
