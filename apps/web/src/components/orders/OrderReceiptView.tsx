'use client';

// ============================================================
// OrderReceiptView (FR-07) - /orders/:id/receipt & /orders/:id
// High-fidelity implementation of Figma 14:46:
//   "BrewLite · Order tracker & receipt"
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Check,
  Clock,
  Coffee,
  Home,
  Loader2,
  ReceiptText,
  RefreshCw,
  Wallet,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { OrderRecord } from '@/types/order';
import {
  OrderApiError,
  calculateEarnedPoints,
  canCancelOrder,
  cancelOrderById,
  fetchOrderById,
  formatOrderCode,
  formatOrderDateTime,
  formatPaymentMethod,
  getItemBaseLinePrice,
  getShortPickupCode,
  getStatusDisplayMeta,
} from '@/lib/orders';
import { OrderStatusStepper } from './OrderStatusStepper';
import { PickupBarcodeSvg, PickupQrSvg } from './OrderPickupCodes';

interface OrderReceiptViewProps {
  orderId: string;
}

function formatReceiptPrice(amount: number | string): string {
  const numeric = Math.max(0, Math.round(Number(amount) || 0));
  return `${numeric.toLocaleString('vi-VN')}đ`;
}

export const OrderReceiptView: React.FC<OrderReceiptViewProps> = ({
  orderId,
}) => {
  const router = useRouter();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    status: number;
    isNetworkError: boolean;
  } | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setErrorState(null);
      }

      try {
        const data = await fetchOrderById(orderId);
        setOrder(data);
        setErrorState(null);
      } catch (err: unknown) {
        if (err instanceof OrderApiError) {
          if (!silent) {
            setErrorState({
              message: err.message,
              status: err.status,
              isNetworkError: err.isNetworkError,
            });
          }
          if (err.status === 401) {
            setTimeout(() => {
              router.push('/auth');
            }, 1500);
          }
        } else if (!silent) {
          setErrorState({
            message: 'Không thể tải thông tin biên nhận đơn hàng.',
            status: 500,
            isNetworkError: false,
          });
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [orderId, router],
  );

  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  // AC-07.3: Tự động polling trạng thái đơn mỗi 10 giây khi đơn đang hoạt động
  useEffect(() => {
    if (!order) return;
    const meta = getStatusDisplayMeta(order.status);
    if (!meta.isActiveTracking) return;

    const timer = setInterval(() => {
      loadOrder(true);
    }, 10000);

    return () => clearInterval(timer);
  }, [order, loadOrder]);

  const handleConfirmCancel = async () => {
    if (!order || isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const updated = await cancelOrderById(order.orderId);
      setOrder(updated);
      setConfirmCancelOpen(false);
    } catch (err: unknown) {
      setCancelError(
        err instanceof Error ? err.message : 'Không thể hủy đơn hàng này.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center px-5 py-6">
        <div className="w-full max-w-[440px] space-y-3.5 animate-pulse">
          <div className="h-11 bg-white/80 rounded-2xl border border-[#EAE4DB]" />
          <div className="h-[100px] bg-[#EAF7EE]/70 rounded-[22px]" />
          <div className="h-[88px] bg-white/70 rounded-2xl" />
          <div className="h-[148px] bg-white rounded-[20px] border border-[#EAE4DB]" />
          <div className="h-[247px] bg-white rounded-[20px] border border-[#EAE4DB]" />
        </div>
      </div>
    );
  }

  // Error States (E1 Unauthorized, E2 Not Found, E3 Network)
  if (errorState || !order) {
    const isUnauthorized = errorState?.status === 401;
    const isNotFound = errorState?.status === 404;
    const isNetwork = errorState?.isNetworkError;

    return (
      <div className="min-h-screen bg-[#FBF9F5] flex flex-col">
        <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE4DB]">
          <div className="max-w-[480px] mx-auto px-5 h-14 flex items-center gap-2">
            <Link
              href="/menu"
              aria-label="Về trang chủ Menu"
              className="min-w-[44px] min-h-[44px] -ml-2 rounded-xl flex items-center justify-center text-[#1F1610] hover:bg-stone-200/60 transition"
            >
              <Home className="w-[22px] h-[22px]" />
            </Link>
            <h1 className="font-semibold text-[#1F1610] text-base">
              Biên nhận đơn hàng
            </h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-5 py-10">
          <div
            data-testid="receipt-error-state"
            className="w-full max-w-[420px] bg-white border border-[#EAE4DB] rounded-[24px] p-6 text-center shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-[#FEF2F2] text-[#D92D2D] flex items-center justify-center mx-auto mb-4">
              {isNetwork ? (
                <WifiOff className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>
            <h2 className="text-lg font-bold text-[#1F1610]">
              {isUnauthorized
                ? 'Phiên đăng nhập đã hết hạn'
                : isNotFound
                  ? 'Không tìm thấy đơn hàng'
                  : isNetwork
                    ? 'Mất kết nối mạng'
                    : 'Đã xảy ra lỗi'}
            </h2>
            <p className="text-sm text-[#6B6B66] mt-1.5 leading-relaxed">
              {errorState?.message || 'Không tìm thấy thông tin đơn hàng này'}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
              {isUnauthorized ? (
                <Link
                  href="/auth"
                  className="min-h-[46px] px-5 rounded-full bg-[#D97706] hover:bg-[#C26804] text-white font-semibold text-sm flex items-center justify-center transition"
                >
                  Đăng nhập lại
                </Link>
              ) : (
                <>
                  {!isNotFound && (
                    <button
                      type="button"
                      onClick={() => loadOrder(false)}
                      className="min-h-[46px] px-5 rounded-full bg-[#D97706] hover:bg-[#C26804] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Thử lại</span>
                    </button>
                  )}
                  <Link
                    href="/orders/my-orders"
                    className="min-h-[46px] px-5 rounded-full border border-[#EAE4DB] bg-white hover:bg-stone-50 text-[#3D2615] font-semibold text-sm flex items-center justify-center transition"
                  >
                    Quay lại lịch sử đơn
                  </Link>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const orderCode = formatOrderCode(order.orderId);
  const pickupCode = getShortPickupCode(order.orderId);
  const statusMeta = getStatusDisplayMeta(order.status);
  const earnedPoints = calculateEarnedPoints(order);
  const cancellable = canCancelOrder(order.status);
  const latestPayment = order.payments?.[0];
  const discountAmount = Number(order.discountAmount) || 0;
  const totalAmount = Number(order.totalAmount) || 0;

  // Tính tổng tiền hàng thực tế từ snapshot OrderItem để hiển thị minh bạch chênh lệch phí (nếu có)
  const itemsSubtotal = order.items.reduce(
    (sum, item) => sum + (Number(item.unitPrice) || 0) * Math.max(1, item.quantity),
    0,
  );
  const extraFee = Math.max(0, totalAmount + discountAmount - itemsSubtotal);

  const renderBannerIcon = () => {
    if (order.status === 'CANCELLED' || order.status === 'PAYMENT_FAILED') {
      return <XCircle className="w-7 h-7" />;
    }
    if (order.status === 'PENDING') {
      return <Clock className="w-7 h-7" />;
    }
    if (order.status === 'PREPARING') {
      return <Coffee className="w-7 h-7" />;
    }
    return <Check className="w-7 h-7 stroke-[2.75]" />;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1F1610] flex flex-col">
      {/* 1. Receipt Header (Figma 14:47) */}
      <header className="sticky top-0 z-30 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE4DB]/70">
        <div className="max-w-[480px] mx-auto px-5 h-[56px] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/menu"
              aria-label="Quay về Trang chủ Menu"
              className="min-w-[40px] min-h-[44px] -ml-2 rounded-xl flex items-center justify-center text-[#1F1610] hover:bg-stone-200/60 transition shrink-0"
            >
              <Home className="w-[22px] h-[22px]" />
            </Link>
            <h1 className="font-semibold text-[#1F1610] text-[16px] leading-[22px] truncate">
              Biên nhận đơn hàng #{orderCode}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/orders/my-orders"
              title="Danh sách đơn hàng"
              className="min-h-[36px] px-2.5 rounded-full text-xs font-semibold text-[#3D2615] bg-[#F5ECE5] hover:bg-[#EADBD0] flex items-center gap-1 transition"
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Lịch sử</span>
            </Link>
            <button
              type="button"
              onClick={() => loadOrder(true)}
              aria-label="Cập nhật trạng thái đơn hàng"
              title="Cập nhật trạng thái mới nhất"
              className="min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center text-[#6B6B66] hover:text-[#3D2615] hover:bg-stone-200/60 transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D97706]' : ''}`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Receipt & Tracking Content (Figma 14:48) */}
      <main className="flex-1 w-full max-w-[480px] mx-auto px-5 pt-3 pb-[148px] space-y-3">
        {/* Banner trạng thái & thời gian dự kiến (Figma 14:49) */}
        <section
          data-testid="receipt-status-banner"
          className={`${statusMeta.bannerBgClassName} rounded-[22px] p-[14px] flex items-center gap-3`}
        >
          <div
            className={`${statusMeta.bannerIconBgClassName} w-[56px] h-[56px] rounded-full flex items-center justify-center shrink-0`}
          >
            {renderBannerIcon()}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <h2
              className={`${statusMeta.bannerTitleClassName} font-bold text-[18px] leading-[24px]`}
            >
              {statusMeta.bannerTitle}
            </h2>
            <p
              className={`${statusMeta.bannerSubtextClassName} text-[14px] leading-[20px]`}
            >
              {statusMeta.bannerSubtitle}
            </p>
            <p
              className={`${statusMeta.bannerSubtextClassName} font-semibold text-[14px] leading-[20px]`}
            >
              {statusMeta.bannerEstimate}
            </p>
          </div>
        </section>

        {/* Thanh tiến trình 4 bước OrderStatusStepper (Figma 14:50) */}
        <section className="py-1">
          <OrderStatusStepper status={order.status} />
        </section>

        {/* Thẻ mã nhận món QR + Barcode (Figma 14:51) */}
        <section
          data-testid="pickup-pass-card"
          className="bg-white border border-[#EAE4DB] rounded-[20px] p-3 flex items-center gap-3"
        >
          <div className="shrink-0">
            <PickupQrSvg value={orderCode} size={116} />
          </div>
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="font-medium text-[14px] leading-[18px] text-[#4B5563]">
              Mã nhận món
            </span>
            <span
              data-testid="pickup-code"
              className="font-bold text-[36px] leading-[42px] text-[#3D2615] tracking-tight"
            >
              {pickupCode}
            </span>
            <div className="overflow-hidden max-w-full">
              <PickupBarcodeSvg value={pickupCode} width={154} height={30} />
            </div>
            <span className="text-[14px] leading-[18px] text-[#4B5563]">
              Quét mã khi nhận món
            </span>
          </div>
        </section>

        {/* Thẻ chi tiết biên nhận (Figma 14:52) */}
        <section
          data-testid="itemized-receipt-card"
          className="bg-white border border-[#EAE4DB] rounded-[20px] p-3.5 space-y-2"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-semibold text-[16px] leading-[20px] text-[#1F1610]">
              Chi tiết biên nhận
            </h3>
            <span className="text-xs text-[#6B6B66]">
              {formatOrderDateTime(order.createdAt)}
            </span>
          </div>

          {/* Danh sách món đã đặt (sử dụng Data Snapshot theo ADR-005) */}
          <div className="space-y-2.5 pt-0.5">
            {order.items.map((item) => {
              const toppings = item.toppings ?? [];
              const baseLinePrice = getItemBaseLinePrice(
                item.unitPrice,
                item.quantity,
                toppings,
              );
              const sizeLabel = item.size?.name
                ? item.size.name.toLowerCase().startsWith('size')
                  ? item.size.name
                  : `Size ${item.size.name}`
                : 'Size tiêu chuẩn';
              const optionParts = [
                sizeLabel,
                item.sugarLevel,
                item.iceLevel,
              ].filter(Boolean);

              return (
                <div key={item.orderItemId} className="space-y-0.5 text-[14px] leading-[20px]">
                  <div className="flex items-start justify-between gap-2 font-semibold text-[#1F1610]">
                    <span>
                      {item.quantity}× {item.productName}
                    </span>
                    <span className="shrink-0 whitespace-nowrap">
                      {formatReceiptPrice(baseLinePrice)}
                    </span>
                  </div>

                  <p className="text-[#4B5563] text-[14px]">
                    {optionParts.join(' · ')}
                  </p>

                  {toppings.map((topping) => (
                    <div
                      key={topping.toppingId}
                      className="flex items-center justify-between gap-2 text-[#4B5563]"
                    >
                      <span>{topping.name}</span>
                      <span className="shrink-0 whitespace-nowrap">
                        +{formatReceiptPrice(Number(topping.price) * Math.max(1, item.quantity))}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="bg-[#E9E3DC] h-px w-full my-1" />

          {/* Các khoản phụ phí / giảm giá / đổi điểm */}
          {extraFee > 0 && (
            <div className="flex items-center justify-between gap-2 text-[14px] leading-[20px] text-[#4B5563]">
              <span>Phí mô phỏng</span>
              <span className="whitespace-nowrap">
                {formatReceiptPrice(extraFee)}
              </span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex items-center justify-between gap-2 text-[14px] leading-[20px] text-[#147D56]">
              <span>
                Giảm giá
                {order.promotion?.promotionCode
                  ? ` (${order.promotion.promotionCode})`
                  : ''}
                {order.pointsRedeemed > 0
                  ? ` · Đổi ${order.pointsRedeemed} điểm`
                  : ''}
              </span>
              <span className="font-medium whitespace-nowrap">
                -{formatReceiptPrice(discountAmount)}
              </span>
            </div>
          )}

          {/* Tổng tiền thanh toán */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="font-semibold text-[14px] leading-[22px] text-[#1F1610]">
              {latestPayment?.status === 'SUCCESS' ||
              ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status)
                ? 'Tổng đã thanh toán'
                : 'Tổng thanh toán'}
            </span>
            <span
              data-testid="receipt-total-amount"
              className="font-bold text-[18px] leading-[22px] text-[#3D2615] whitespace-nowrap"
            >
              {formatReceiptPrice(totalAmount)}
            </span>
          </div>

          {/* Phương thức & trạng thái thanh toán */}
          <div className="flex items-center justify-between gap-2 text-[14px] leading-[20px]">
            <div className="flex items-center gap-1.5 text-[#4B5563] font-medium min-w-0">
              <Wallet className="w-[18px] h-[18px] text-[#3D2615] shrink-0" />
              <span className="truncate">
                {formatPaymentMethod(latestPayment?.paymentMethod)}
              </span>
            </div>
            <span
              className={`font-medium whitespace-nowrap ${
                latestPayment?.status === 'FAILED' ||
                order.status === 'PAYMENT_FAILED'
                  ? 'text-[#D92D2D]'
                  : latestPayment?.status === 'SUCCESS' ||
                      ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(
                        order.status,
                      )
                    ? 'text-[#147D56]'
                    : 'text-[#D97706]'
              }`}
            >
              {latestPayment?.status === 'FAILED' ||
              order.status === 'PAYMENT_FAILED'
                ? 'Thất bại'
                : latestPayment?.status === 'SUCCESS' ||
                    ['PAID', 'PREPARING', 'READY', 'COMPLETED'].includes(
                      order.status,
                    )
                  ? 'Thành công'
                  : 'Chờ thanh toán'}
            </span>
          </div>

          {/* Điểm thưởng tích lũy (Figma 14:139) */}
          {earnedPoints > 0 && (
            <div
              data-testid="receipt-earned-points"
              className="bg-[#ECF8F1] rounded-[12px] px-2.5 py-1 flex items-center justify-between gap-2 text-[#147D56] text-[14px] leading-[20px]"
            >
              <span>Điểm thưởng tích lũy</span>
              <span className="font-bold whitespace-nowrap">
                +{earnedPoints} Điểm
              </span>
            </div>
          )}
        </section>
      </main>

      {/* 3. Bottom Action Footer (Figma 14:53) */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#EAE4DB] shadow-[0_-4px_20px_rgba(31,22,16,0.05)]">
        <div className="max-w-[480px] mx-auto px-5 pt-2.5 pb-5 space-y-2">
          <p className="text-[14px] leading-[20px] text-[#6B6B66] text-center">
            {statusMeta.cancelHint}
          </p>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={!cancellable}
              onClick={() => {
                if (cancellable) {
                  setCancelError(null);
                  setConfirmCancelOpen(true);
                }
              }}
              data-testid="cancel-order-button"
              className={`h-[48px] w-[136px] sm:w-[152px] shrink-0 rounded-[24px] bg-white border border-[#EF4444] font-semibold text-[14px] text-[#D92D2D] flex items-center justify-center transition ${
                cancellable
                  ? 'hover:bg-[#FEF2F2] cursor-pointer'
                  : 'opacity-40 cursor-not-allowed'
              }`}
            >
              Hủy đơn hàng
            </button>

            <Link
              href="/menu"
              data-testid="continue-ordering-button"
              className="h-[48px] flex-1 rounded-[24px] bg-[#D97706] hover:bg-[#C26804] text-white font-semibold text-[14px] flex items-center justify-center transition shadow-xs"
            >
              Tiếp tục đặt món khác
            </Link>
          </div>
        </div>
      </footer>

      {/* Modal xác nhận hủy đơn khi đơn ở trạng thái PENDING (FR-12) */}
      {confirmCancelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-dialog-title"
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center px-5"
        >
          <div className="w-full max-w-[380px] bg-white rounded-[24px] border border-[#EAE4DB] p-5 shadow-xl space-y-3">
            <h3
              id="cancel-order-dialog-title"
              className="text-lg font-bold text-[#1F1610]"
            >
              Xác nhận hủy đơn #{orderCode}?
            </h3>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Đơn hàng đang ở trạng thái chờ tiếp nhận. Sau khi hủy, tồn kho
              nguyên liệu sẽ được hoàn trả và bạn không thể khôi phục đơn này.
            </p>

            {cancelError && (
              <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3 py-2 text-xs text-[#B91C1C]">
                {cancelError}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setConfirmCancelOpen(false)}
                className="flex-1 h-[44px] rounded-full border border-[#EAE4DB] bg-white hover:bg-stone-50 text-[#3D2615] font-semibold text-sm transition cursor-pointer"
              >
                Giữ lại đơn
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 h-[44px] rounded-full bg-[#D92D2D] hover:bg-[#B91C1C] text-white font-semibold text-sm flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isCancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Xác nhận hủy</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
