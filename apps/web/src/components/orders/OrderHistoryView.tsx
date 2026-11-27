'use client';

// ============================================================
// OrderHistoryView (FR-08) - /orders/my-orders & /orders
// Danh sách lịch sử đơn hàng cá nhân, sắp xếp mới nhất lên đầu
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Coffee,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  User,
  WifiOff,
} from 'lucide-react';
import { AuthUser } from '@/types/auth';
import { OrderHistoryFilter, OrderRecord } from '@/types/order';
import { onAuthStateChange } from '@/lib/auth';
import {
  OrderApiError,
  calculateEarnedPoints,
  fetchMyOrders,
  filterOrdersByTab,
  formatOrderCode,
  formatOrderDateTime,
  getStatusDisplayMeta,
} from '@/lib/orders';

const FILTER_TABS: Array<{ key: OrderHistoryFilter; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang xử lý' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

function formatVndCompact(amount: number | string): string {
  const numeric = Math.max(0, Math.round(Number(amount) || 0));
  return `${numeric.toLocaleString('vi-VN')}đ`;
}

export const OrderHistoryView: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<OrderHistoryFilter>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    status: number;
    isNetworkError: boolean;
  } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const loadOrders = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setErrorState(null);
      }

      try {
        const list = await fetchMyOrders();
        setOrders(list);
        setErrorState(null);
      } catch (err: unknown) {
        if (err instanceof OrderApiError) {
          setErrorState({
            message: err.message,
            status: err.status,
            isNetworkError: err.isNetworkError,
          });
          if (err.status === 401) {
            setTimeout(() => {
              router.push('/auth');
            }, 1500);
          }
        } else {
          setErrorState({
            message: 'Không thể tải lịch sử đơn hàng. Vui lòng thử lại.',
            status: 500,
            isNetworkError: false,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    loadOrders(false);
  }, [loadOrders]);

  const filteredOrders = useMemo(
    () => filterOrdersByTab(orders, activeFilter),
    [orders, activeFilter],
  );

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1F1610] flex flex-col">
      {/* 1. Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E9E3DC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/menu"
              aria-label="Quay lại Thực đơn"
              className="min-w-[44px] min-h-[44px] rounded-xl border border-[#EDE7DF] flex items-center justify-center text-[#3D2615] hover:bg-stone-100 transition shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="font-extrabold text-[#3D2615] text-lg sm:text-xl leading-tight flex items-center gap-2 truncate">
                <ReceiptText className="w-5 h-5 text-[#D97706] shrink-0" />
                <span>Lịch sử đơn hàng</span>
              </h1>
              <p className="text-xs text-[#6B6B66]">
                {isLoading
                  ? 'Đang tải danh sách đơn...'
                  : `${orders.length} đơn hàng đã đặt`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadOrders(true)}
            aria-label="Làm mới danh sách đơn hàng"
            className="min-w-[44px] min-h-[44px] px-3 rounded-xl border border-[#EDE7DF] bg-white hover:bg-stone-50 text-[#3D2615] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D97706]' : ''}`}
            />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-28">
        {/* Thanh lọc trạng thái */}
        {!errorState && orders.length > 0 && (
          <div
            role="tablist"
            aria-label="Lọc đơn hàng theo trạng thái"
            className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar"
          >
            {FILTER_TABS.map((tab) => {
              const isSelected = activeFilter === tab.key;
              const count = filterOrdersByTab(orders, tab.key).length;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`min-h-[40px] px-4 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#3D2615] text-white shadow-xs'
                      : 'bg-white border border-[#EAE4DB] text-[#4B5563] hover:border-[#D97706]/50 hover:text-[#3D2615]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F5ECE5] text-[#3D2615]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3.5 animate-pulse">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-40 bg-white rounded-[20px] border border-[#EAE4DB]"
              />
            ))}
          </div>
        )}

        {/* Error States (E1 Unauthorized / E3 Network) */}
        {!isLoading && errorState && (
          <div
            data-testid="order-history-error"
            className="bg-white border border-[#EAE4DB] rounded-[24px] p-7 sm:p-10 text-center max-w-md mx-auto mt-4 shadow-xs"
          >
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#D92D2D] flex items-center justify-center mx-auto mb-4">
              {errorState.isNetworkError ? (
                <WifiOff className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>
            <h2 className="text-lg font-bold text-[#1F1610]">
              {errorState.status === 401
                ? 'Yêu cầu đăng nhập'
                : errorState.isNetworkError
                  ? 'Mất kết nối mạng'
                  : 'Không thể tải dữ liệu'}
            </h2>
            <p className="text-sm text-[#6B6B66] mt-1.5 leading-relaxed">
              {errorState.message}
            </p>
            <div className="mt-6 flex justify-center gap-2.5">
              {errorState.status === 401 ? (
                <Link
                  href="/auth"
                  className="min-h-[46px] px-6 rounded-full bg-[#D97706] hover:bg-[#C26804] text-white font-semibold text-sm flex items-center justify-center transition"
                >
                  Đăng nhập ngay
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => loadOrders(false)}
                  className="min-h-[46px] px-6 rounded-full bg-[#D97706] hover:bg-[#C26804] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Thử lại</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State (5a / AC-08.5) */}
        {!isLoading && !errorState && orders.length === 0 && (
          <div
            data-testid="order-history-empty"
            className="bg-white border border-[#EAE4DB] rounded-[24px] p-8 sm:p-12 text-center max-w-md mx-auto mt-4 shadow-xs"
          >
            <div className="w-16 h-16 rounded-full bg-[#F5ECE5] text-[#D97706] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#3D2615]">
              Bạn chưa có đơn hàng nào
            </h2>
            <p className="text-sm text-[#6B6B66] mt-1.5 leading-relaxed">
              Hãy chọn một ly đồ uống yêu thích từ thực đơn BrewLite để bắt đầu
              tích điểm thưởng nhé!
            </p>
            <Link
              href="/menu"
              className="mt-6 inline-flex min-h-[46px] px-6 rounded-full bg-[#D97706] hover:bg-[#C26804] text-white font-semibold text-sm items-center justify-center gap-2 transition shadow-xs"
            >
              <Coffee className="w-4 h-4" />
              <span>Khám phá Menu</span>
            </Link>
          </div>
        )}

        {/* Empty Filter Result */}
        {!isLoading &&
          !errorState &&
          orders.length > 0 &&
          filteredOrders.length === 0 && (
            <div className="bg-white border border-[#EAE4DB] rounded-[20px] p-8 text-center">
              <p className="text-sm font-medium text-[#6B6B66]">
                Không có đơn hàng nào thuộc mục này.
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className="mt-3 text-sm font-semibold text-[#D97706] hover:underline cursor-pointer"
              >
                Xem tất cả đơn hàng
              </button>
            </div>
          )}

        {/* Danh sách thẻ đơn hàng (AC-08.2, AC-08.3, AC-08.4) */}
        {!isLoading && !errorState && filteredOrders.length > 0 && (
          <div data-testid="order-history-list" className="space-y-3.5">
            {filteredOrders.map((order) => {
              const orderCode = formatOrderCode(order.orderId);
              const meta = getStatusDisplayMeta(order.status);
              const totalQuantity = order.items.reduce(
                (sum, item) => sum + Math.max(1, item.quantity),
                0,
              );
              const earnedPoints = calculateEarnedPoints(order);

              return (
                <Link
                  key={order.orderId}
                  href={`/orders/${encodeURIComponent(order.orderId)}/receipt`}
                  data-testid={`order-card-${order.orderId}`}
                  className="block bg-white border border-[#EAE4DB] hover:border-[#D97706]/60 rounded-[20px] p-4 sm:p-5 transition shadow-[0_1px_4px_rgba(31,22,16,0.03)] hover:shadow-md group"
                >
                  {/* Hàng đầu: Mã đơn + Thời gian + Badge trạng thái */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#3D2615] text-base">
                          #{orderCode}
                        </span>
                        {meta.isActiveTracking && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706]">
                            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
                            Đang theo dõi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6B66] mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatOrderDateTime(order.createdAt)}</span>
                      </p>
                    </div>

                    <span
                      className={`${meta.badgeClassName} text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {/* Danh sách món tóm tắt (Snapshot productName theo ADR-005) */}
                  <div className="mt-3 pt-3 border-t border-[#F0ECE6] space-y-1.5">
                    {order.items.slice(0, 2).map((item) => (
                      <div
                        key={item.orderItemId}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <p className="text-[#1F1610] font-medium truncate">
                          <span className="font-semibold text-[#3D2615]">
                            {item.quantity}×
                          </span>{' '}
                          {item.productName}
                          {item.size?.name && (
                            <span className="text-[#6B6B66] font-normal">
                              {' '}
                              ({item.size.name})
                            </span>
                          )}
                        </p>
                        <span className="text-[#4B5563] text-xs whitespace-nowrap shrink-0">
                          {formatVndCompact(
                            (Number(item.unitPrice) || 0) *
                              Math.max(1, item.quantity),
                          )}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-xs text-[#6B6B66]">
                        +{order.items.length - 2} món khác trong đơn...
                      </p>
                    )}
                  </div>

                  {/* Hàng cuối: Tổng tiền + Điểm thưởng + Xem biên nhận */}
                  <div className="mt-3.5 pt-3 border-t border-[#F0ECE6] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div>
                        <span className="text-xs text-[#6B6B66] block">
                          {totalQuantity} món · Tổng cộng
                        </span>
                        <span className="font-extrabold text-[#3D2615] text-base">
                          {formatVndCompact(order.totalAmount)}
                        </span>
                      </div>
                      {earnedPoints > 0 && (
                        <span className="inline-flex items-center gap-1 bg-[#ECF8F1] text-[#147D56] text-xs font-semibold px-2.5 py-1 rounded-full">
                          <Sparkles className="w-3 h-3" />+{earnedPoints} điểm
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#D97706] group-hover:translate-x-0.5 transition">
                      <span>Xem biên nhận</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Bottom Navigation Bar đồng bộ thiết kế với /menu */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E9E3DC] z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-around sm:justify-center sm:gap-14 items-center">
          <Link
            href="/menu"
            className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
          >
            <Coffee className="w-4 h-4" />
            <span>Menu</span>
          </Link>

          <Link
            href="/orders/my-orders"
            aria-current="page"
            className="flex flex-col sm:flex-row items-center gap-1 text-[#3D2615] bg-[#F5ECE5] px-4 py-1.5 rounded-full transition font-bold text-xs sm:text-sm"
          >
            <ReceiptText className="w-4 h-4 text-[#3D2615]" />
            <span>Đơn hàng</span>
          </Link>

          <Link
            href="/auth"
            className="flex flex-col sm:flex-row items-center gap-1 text-stone-500 hover:text-[#3D2615] transition px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
          >
            <User className="w-4 h-4" />
            <span>
              {currentUser
                ? currentUser.name.split(' ').slice(-1)[0]
                : 'Tài khoản'}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
};
