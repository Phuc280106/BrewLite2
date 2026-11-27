'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthUser } from '@/types/auth';
import { CartItem } from '@/types/cart';
import { getAuthToken, onAuthStateChange, syncLoyaltyPoints } from '@/lib/auth';
import { calculateCartTotals, formatVND } from '@/lib/cartPricing';
import { fetchPromotions } from '@/lib/promotionsApi';
import { useCartStore } from '@/store/useCartStore';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartDiscountsCard } from '@/components/cart/CartDiscountsCard';
import {
  ArrowLeft,
  CheckCircle2,
  Coffee,
  CreditCard,
  Loader2,
  ShoppingCart,
  Trash2,
  AlertCircle,
} from 'lucide-react';

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL.endsWith('/api/v1') ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

interface CreatedOrderSummary {
  orderId: string;
  status: string;
  totalAmount: number;
  discountAmount: number;
  itemCount: number;
}

// ID thật trong database là UUID. Món có ID khác (vd 'size-m') là dữ liệu cũ/giả còn sót trong localStorage.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function hasInvalidIds(item: CartItem): boolean {
  return (
    !UUID_PATTERN.test(item.productId) ||
    !UUID_PATTERN.test(item.size.sizeId) ||
    item.toppings.some((t) => !UUID_PATTERN.test(t.toppingId))
  );
}

export default function CartPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<CartItem | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrderSummary | null>(null);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);
  const [promotionsError, setPromotionsError] = useState<string | null>(null);
  const orderIdempotencyKeyRef = useRef<string | null>(null);

  const items = useCartStore((state) => state.items);
  const availablePromotions = useCartStore((state) => state.availablePromotions);
  const appliedPromotion = useCartStore((state) => state.appliedPromotion);
  const pointsRedeemed = useCartStore((state) => state.pointsRedeemed);
  const hasHydrated = useCartStore((state) => state.hasHydrated);

  const setAvailablePromotions = useCartStore((state) => state.setAvailablePromotions);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const applyPromotion = useCartStore((state) => state.applyPromotion);
  const removePromotion = useCartStore((state) => state.removePromotion);
  const applyLoyaltyPoints = useCartStore((state) => state.applyLoyaltyPoints);
  const clearLoyaltyPoints = useCartStore((state) => state.clearLoyaltyPoints);

  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (currentUser?.userId) {
      void syncLoyaltyPoints();
    }
  }, [currentUser?.userId]);

  useEffect(() => {
    orderIdempotencyKeyRef.current = null;
  }, [items, appliedPromotion?.promotionCode, pointsRedeemed]);

  const loadPromotions = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoadingPromotions(true);
      setPromotionsError(null);
      try {
        const promotions = await fetchPromotions(signal);
        setAvailablePromotions(promotions);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setPromotionsError('Không thể tải mã khuyến mãi từ máy chủ.');
      } finally {
        if (!signal?.aborted) {
          setIsLoadingPromotions(false);
        }
      }
    },
    [setAvailablePromotions],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadPromotions(controller.signal);
    return () => controller.abort();
  }, [loadPromotions]);

  const totals = useMemo(
    () =>
      calculateCartTotals({
        items,
        appliedPromotion,
        pointsRedeemed,
      }),
    [items, appliedPromotion, pointsRedeemed],
  );

  const handleIncrease = (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (!target) return;
    updateQuantity(itemId, target.quantity + 1);
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
      return;
    }
    // Theo usecase-cart-spec.md mục 4.2: hiển thị hộp thoại xác nhận khi giảm từ 1 xuống 0
    setItemPendingDelete(item);
  };

  const isStaffRole =
    currentUser?.role === 'BARISTA' || currentUser?.role === 'ADMIN';

  const handlePlaceOrder = async () => {
    if (items.length === 0 || isSubmitting) return;
    setSubmitError(null);

    const token = getAuthToken();
    if (!token || !currentUser) {
      router.push('/auth');
      return;
    }

    if (isStaffRole) {
      setSubmitError(
        'Tài khoản nhân viên (Barista/Admin) chỉ quản lý trạng thái đơn hàng, không được phép đặt đơn.',
      );
      return;
    }

    const staleItems = items.filter(hasInvalidIds);
    if (staleItems.length > 0) {
      staleItems.forEach((item) => removeItem(item.id));
      setSubmitError(
        `Đã gỡ ${staleItems.length} món có dữ liệu cũ/không hợp lệ khỏi giỏ hàng. Vui lòng thêm lại các món đó từ thực đơn rồi đặt hàng.`,
      );
      return;
    }

    if (!orderIdempotencyKeyRef.current) {
      orderIdempotencyKeyRef.current =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': orderIdempotencyKeyRef.current,
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            sizeId: item.size.sizeId,
            quantity: item.quantity,
            toppingIds: item.toppings.map((t) => t.toppingId),
            ...(item.sugar?.trim() ? { sugarLevel: item.sugar.trim().slice(0, 30) } : {}),
            ...(item.ice?.trim() ? { iceLevel: item.ice.trim().slice(0, 30) } : {}),
            ...(item.note?.trim() ? { note: item.note.trim().slice(0, 150) } : {}),
          })),
          promotionCode: appliedPromotion?.promotionCode,
          pointsToRedeem: pointsRedeemed > 0 ? pointsRedeemed : undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg = Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message || 'Không thể khởi tạo đơn hàng. Vui lòng thử lại.';
        throw new Error(msg);
      }

      const summary: CreatedOrderSummary = {
        orderId: payload.orderId || 'ORD-' + Date.now(),
        status: payload.status || 'PENDING',
        totalAmount: Number(payload.totalAmount ?? totals.grandTotal),
        discountAmount: Number(payload.discountAmount ?? totals.totalDiscount),
        itemCount: totals.totalItems,
      };

      try {
        window.localStorage.setItem('brewlite_latest_order', JSON.stringify(payload));
      } catch {
        // Bỏ qua nếu bộ nhớ cục bộ bị hạn chế
      }

      clearCart();
      setCreatedOrder(summary);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Không thể kết nối tới máy chủ đặt hàng.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E9E3DC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/menu"
              aria-label="Quay lại Thực đơn"
              className="min-w-[44px] min-h-[44px] rounded-xl border border-[#EDE7DF] flex items-center justify-center text-[#3D2615] hover:bg-stone-100 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-extrabold text-[#3D2615] text-lg sm:text-xl leading-tight flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#D97706]" />
                <span>Giỏ hàng của bạn</span>
              </h1>
              <p className="text-xs text-stone-500">
                {hasHydrated ? `${totals.totalItems} món trong giỏ` : 'Đang tải giỏ hàng...'}
              </p>
            </div>
          </div>

          {hasHydrated && items.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearOpen(true)}
              className="min-h-[44px] px-3.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa tất cả</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16">
        {!hasHydrated ? (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="h-32 bg-white rounded-2xl border border-[#EDE7DF] animate-pulse" />
            <div className="h-32 bg-white rounded-2xl border border-[#EDE7DF] animate-pulse" />
          </div>
        ) : createdOrder ? (
          <div
            data-testid="order-created-card"
            className="bg-white rounded-3xl border border-[#C8E6C9] shadow-md p-6 sm:p-10 max-w-xl mx-auto text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#EEF7F2] text-[#2D7A4D] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#3D2615]">
              Khởi tạo đơn hàng thành công!
            </h2>
            <p className="text-sm text-stone-500 mt-1.5">
              Đơn hàng của bạn đang ở trạng thái{' '}
              <span className="font-bold text-[#D97706]">{createdOrder.status}</span> và đã giữ tồn kho nguyên liệu.
            </p>

            <div className="mt-5 bg-[#FBF9F5] border border-[#EDE7DF] rounded-2xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#3D2615] text-xs sm:text-sm">
                  {createdOrder.orderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Số lượng món:</span>
                <span className="font-semibold text-stone-800">{createdOrder.itemCount} món</span>
              </div>
              {createdOrder.discountAmount > 0 && (
                <div className="flex justify-between text-[#2D7A4D]">
                  <span>Đã giảm giá:</span>
                  <span className="font-bold">-{formatVND(createdOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-stone-200 font-extrabold text-base text-[#3D2615]">
                <span>Tổng cần thanh toán:</span>
                <span>{formatVND(createdOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
              <Link
                href={`/checkout?orderId=${encodeURIComponent(createdOrder.orderId)}`}
                data-testid="pay-now-button"
                className="min-h-[44px] px-5 py-3 rounded-2xl bg-[#D97706] hover:bg-[#C26804] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-xs"
              >
                <CreditCard className="w-4 h-4" />
                <span>Thanh toán ngay</span>
              </Link>
              <Link
                href="/menu"
                className="min-h-[44px] px-5 py-3 rounded-2xl border border-[#EDE7DF] bg-white hover:bg-stone-50 text-[#3D2615] font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Coffee className="w-4 h-4" />
                <span>Tiếp tục đặt món</span>
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Danh sách món trong giỏ */}
            <div className="lg:col-span-7 space-y-3.5">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onRemove={(target) => setItemPendingDelete(target)}
                />
              ))}
            </div>

            {/* Cột phải: Khuyến mãi, Đổi điểm & Tổng kết đơn */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <CartDiscountsCard
                subtotal={totals.subtotal}
                availablePromotions={availablePromotions}
                isLoadingPromotions={isLoadingPromotions}
                promotionsError={promotionsError}
                onRetryPromotions={() => void loadPromotions()}
                appliedPromotion={appliedPromotion}
                promotionDiscount={totals.promotionDiscount}
                pointsRedeemed={pointsRedeemed}
                loyaltyDiscount={totals.loyaltyDiscount}
                currentUser={currentUser}
                onApplyPromotion={applyPromotion}
                onRemovePromotion={removePromotion}
                onApplyLoyaltyPoints={applyLoyaltyPoints}
                onClearLoyaltyPoints={clearLoyaltyPoints}
              />

              {/* Bảng Tổng kết thanh toán */}
              <div className="bg-white rounded-2xl border border-[#EDE7DF] p-4 sm:p-5 shadow-2xs space-y-3">
                <h3 className="font-bold text-sm text-[#3D2615]">
                  Chi tiết thanh toán
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-stone-600">
                    <span>Tạm tính ({totals.totalItems} món)</span>
                    <span data-testid="cart-subtotal" className="font-semibold text-stone-900">
                      {formatVND(totals.subtotal)}
                    </span>
                  </div>

                  {totals.promotionDiscount > 0 && (
                    <div className="flex justify-between text-[#2D7A4D]">
                      <span>Khuyến mãi ({appliedPromotion?.promotionCode})</span>
                      <span data-testid="cart-promo-discount" className="font-bold">
                        -{formatVND(totals.promotionDiscount)}
                      </span>
                    </div>
                  )}

                  {totals.loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-[#2D7A4D]">
                      <span>Đổi điểm thưởng ({pointsRedeemed} điểm)</span>
                      <span data-testid="cart-loyalty-discount" className="font-bold">
                        -{formatVND(totals.loyaltyDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="font-bold text-[#3D2615]">Tổng thanh toán</span>
                    <span
                      data-testid="cart-grand-total"
                      className="font-extrabold text-xl text-[#D97706]"
                    >
                      {formatVND(totals.grandTotal)}
                    </span>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                {isStaffRole && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs flex items-start justify-between gap-2">
                    <span>
                      Tài khoản Barista/Admin chỉ quản lý trạng thái đơn hàng, không được đặt đơn.
                    </span>
                    <Link
                      href="/barista"
                      className="font-bold underline shrink-0 hover:text-amber-950"
                    >
                      Mở Barista KDS
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  disabled={items.length === 0 || isSubmitting || isStaffRole}
                  onClick={handlePlaceOrder}
                  data-testid="place-order-button"
                  className="w-full min-h-[48px] py-3.5 px-5 rounded-2xl bg-[#D97706] hover:bg-[#C26804] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang khởi tạo đơn hàng...</span>
                    </>
                  ) : isStaffRole ? (
                    <span>Barista không được phép đặt đơn</span>
                  ) : currentUser ? (
                    <span>Tiến hành đặt hàng • {formatVND(totals.grandTotal)}</span>
                  ) : (
                    <span>Đăng nhập để đặt hàng</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal xác nhận xóa 1 món */}
      {itemPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-100"
          >
            <h3 className="font-extrabold text-lg text-[#3D2615]">
              Xóa món khỏi giỏ hàng?
            </h3>
            <p className="text-sm text-stone-500 mt-1.5">
              Bạn có chắc chắn muốn xóa{' '}
              <span className="font-semibold text-stone-800">
                {itemPendingDelete.productName}
              </span>{' '}
              khỏi giỏ hàng không?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setItemPendingDelete(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition cursor-pointer"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={() => {
                  removeItem(itemPendingDelete.id);
                  setItemPendingDelete(null);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition cursor-pointer"
              >
                Xóa món
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa toàn bộ giỏ hàng */}
      {confirmClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-stone-100"
          >
            <h3 className="font-extrabold text-lg text-[#3D2615]">
              Làm rỗng giỏ hàng?
            </h3>
            <p className="text-sm text-stone-500 mt-1.5">
              Toàn bộ {totals.totalItems} món trong giỏ hàng hiện tại sẽ bị xóa.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearOpen(false)}
                className="flex-1 min-h-[44px] rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCart();
                  setConfirmClearOpen(false);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}