"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownLeft, Receipt, Feather, TrendingUp, Filter, Coins, ShoppingBag, Plus, Minus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  category: 'feather' | 'points' | 'purchase';
  displayAmount: number;
  displayType: string;
  date: string;
  reason?: string;
  transactionType?: string;
  currency_type?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'feathers' | 'points' | 'purchases'>('all');

  useEffect(() => {
    checkAuth();
    fetchTransactions();
  }, [filter]);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/history?type=${filter}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      } else {
        toast.error('거래 내역을 불러오는데 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('거래 내역을 불러오는데 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    // 구매 거래
    if (transaction.category === 'purchase') {
      return <ShoppingBag className="w-5 h-5 text-blue-600" />;
    }

    const isEarn = transaction.displayType === 'EARN' ||
                   transaction.transactionType === 'EARN' ||
                   transaction.displayType === 'REFUND';

    const isRefund = transaction.displayType === 'REFUND';

    // 환불
    if (isRefund) {
      return <RotateCcw className="w-5 h-5 text-green-600" />;
    }

    // 수입 (획득)
    if (isEarn) {
      return <Plus className="w-5 h-5 text-green-600" />;
    }

    // 지출
    return <Minus className="w-5 h-5 text-red-600" />;
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.category === 'purchase') {
      return 'text-blue-600';
    }

    const isEarn = transaction.displayType === 'EARN' ||
                   transaction.transactionType === 'EARN' ||
                   transaction.displayType === 'REFUND';

    return isEarn ? 'text-green-600' : 'text-red-600';
  };

  const getTransactionSign = (transaction: Transaction) => {
    const isEarn = transaction.displayType === 'EARN' ||
                   transaction.transactionType === 'EARN' ||
                   transaction.displayType === 'REFUND';

    return isEarn ? '+' : '-';
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'feather': return '깃털';
      case 'points': return '포인트';
      case 'purchase': return '구매';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feather': return 'bg-amber-100 text-amber-800';
      case 'points': return 'bg-purple-100 text-purple-800';
      case 'purchase': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconBackground = (transaction: Transaction) => {
    // 구매 거래
    if (transaction.category === 'purchase') {
      return 'bg-blue-100';
    }

    const isEarn = transaction.displayType === 'EARN' ||
                   transaction.transactionType === 'EARN' ||
                   transaction.displayType === 'REFUND';

    // 수입/환불
    if (isEarn) {
      return 'bg-green-100';
    }

    // 지출
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 py-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              거래 내역
            </h1>
          </div>
          <p className="text-gray-600">깃털, 포인트, 구매 내역을 확인하세요</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover-hover:hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('feathers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
              filter === 'feathers'
                ? 'bg-amber-600 text-white'
                : 'text-gray-600 hover-hover:hover:bg-gray-100'
            }`}
          >
            <Feather className="w-4 h-4" />
            깃털
          </button>
          <button
            onClick={() => setFilter('points')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filter === 'points'
                ? 'bg-purple-600 text-white'
                : 'text-gray-600 hover-hover:hover:bg-gray-100'
            }`}
          >
            <Coins className="w-4 h-4 inline" /> 포인트
          </button>
          <button
            onClick={() => setFilter('purchases')}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              filter === 'purchases'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover-hover:hover:bg-gray-100'
            }`}
          >
            구매
          </button>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">거래 내역이 없습니다</p>
            <p className="text-gray-500 text-sm">
              {filter === 'all' ? '아직 거래가 없습니다' : `${getCategoryLabel(filter)} 거래가 없습니다`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {transactions.map((transaction, index) => (
                <div
                  key={`${transaction.id}-${index}`}
                  className="p-4 hover-hover:hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBackground(transaction)}`}>
                        {getTransactionIcon(transaction)}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {transaction.reason || '거래'}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(transaction.category)}`}>
                            {getCategoryLabel(transaction.category)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right ml-4">
                      <p className={`text-lg font-bold ${getTransactionColor(transaction)}`}>
                        {getTransactionSign(transaction)}
                        {transaction.displayAmount.toLocaleString()}
                      </p>
                      {transaction.category === 'feather' && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                          <Feather className="w-3 h-3" />
                          깃털
                        </p>
                      )}
                      {transaction.category === 'points' && (
                        <p className="text-xs text-gray-500">포인트</p>
                      )}
                      {transaction.category === 'purchase' && (
                        <p className="text-xs text-gray-500">원</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Card */}
        {!loading && transactions.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">총 거래 건수</h3>
            <p className="text-3xl font-bold">{transactions.length}건</p>
          </div>
        )}
      </div>
    </div>
  );
}
