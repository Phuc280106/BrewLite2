'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Landmark,
  Loader2,
  User,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { AuthUser } from '@/types/auth';
import { getAuthToken, onAuthStateChange } from '@/lib/auth';
import { formatVND } from '@/lib/cartPricing';
import { API_BASE, fetchOrder, OrderDto } from '@/lib/orderApi';

type FulfillmentMode = 'TAKEAWAY' | 'DINE_IN';

interface VnpayOption {
  id: string;
  /** Mã tab mở sẵn trên VNPay; để trống để khách tự chọn tại cổng. */
  bankCode?: string;
  title: string;
  subtitle: string;
  detail: string;
  detailClass: string;
  icon: typeof Wallet;
}

const VNPAY_OPTIONS: VnpayOption[] = [
  {
    id: 'VNPAY_ALL',
    title: 'Cổng VNPay',
    subtitle: '(Sandbox)',
    detail: 'Tự chọn phương thức tại cổng thanh toán',
    detailClass: 'text-[#2D7A4D] font-semibold',
    icon: Wallet,
  },
  {
    id: 'VNPAY_ATM',
    bankCode: 'VNBANK',
    title: 'Thẻ ATM nội địa',
    subtitle: '(Napas)',
    detail: 'Tài khoản & thẻ ATM các ngân hàng nội địa',
    detailClass: 'text-stone-500',
    icon: Landmark,
  },
  {
    id: 'VNPAY_INT',
    bankCode: 'INTCARD',
    title: 'Thẻ quốc tế',
    subtitle: '(Visa / MasterCard / JCB)',
    detail: 'Thẻ thanh toán quốc tế',
    detailClass: 'text-stone-500',
    icon: CreditCard,
  },
];

function CheckoutContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Lựa chọn dưới chỉ là giao diện (backend chưa có trường lưu), không gửi lên API
  const [mode, setMode] = useState<FulfillmentMode>('TAKEAWAY');

  const [selectedId, setSelectedId] = useState<string>(VNPAY_OPTIONS[0].id);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const payingRef = useRef(false); // chặn bấm đúp trước khi state kịp cập nhật

  useEffect(() => onAuthStateChange(setUser), []);

  useEffect(() => {
    if (!orderId) return;
    const controller = new AbortController();
    fetchOrder(orderId, controller.signal)
      .then(setOrder)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setLoadError(err instanceof Error ? err.message : 'Không tải được đơn hàng.');
      });
    return () => controller.abort();
  }, [orderId]);

  const total = order ? Number(order.totalAmount) : 0;
  const discount = order ? Number(order.discountAmount) : 0;
  const subtotal = total + discount;

  const handleSelectMethod = (id: string) => {
    if (isPaying) return;
    setSelectedId(id);
    setPayError(null);
  };

  // Bấm thanh toán -> backend sinh URL VNPay Sandbox -> chuyển hướng khách sang cổng VNPay
  const handlePay = async () => {
    if (!orderId || payingRef.current) return;

    const token = getAuthToken();
    if (!token) {
      setPayError('Vui lòng đăng nhập lại để thanh toán.');
      return;
    }

    const selected = VNPAY_OPTIONS.find((opt) => opt.id === selectedId) ?? VNPAY_OPTIONS[0];

    payingRef.current = true;
    setIsPaying(true);
    setPayError(null);

    try {
      const response = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, bankCode: selected.bankCode }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload.paymentUrl) {
        window.location.href = payload.paymentUrl;
        return; // giữ trạng thái "đang xử lý" trong lúc trình duyệt chuyển trang
      }

      setPayError(
        Array.isArray(payload.message)
          ? payload.message.join(', ')
          : payload.message || 'Không thể khởi tạo phiên thanh toán VNPay. Vui lòng thử lại.',
      );
    } catch {
      setPayError('Mất kết nối tới máy chủ. Vui lòng thử lại.');
    }
    payingRef.current = false;
    setIsPaying(false);
  };

  if (!orderId) {
    return (
      <div className="px-5 py-16 text-center space-y-4">
        <p className="text-stone-600">Không tìm thấy đơn hàng cần thanh toán.</p>
        <Link href="/cart" className="inline-block px-5 py-3 rounded-2xl bg-[#3D2615] text-white font-bold text-sm">
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-5 py-16 text-center space-y-4">
        <p className="text-rose-700 text-sm">{loadError}</p>
        <Link href="/cart" className="inline-block px-5 py-3 rounded-2xl bg-[#3D2615] text-white font-bold text-sm">
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="mx-5 mt-6 h-64 rounded-2xl bg-white border border-[#EDE7DF] animate-pulse" />;
  }

  if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
    return (
      <div className="px-5 py-16 text-center space-y-4">
        <p className="text-stone-600 text-sm">
          {order.status === 'CANCELLED'
            ? 'Đơn hàng này đã bị hủy (quá 15 phút chưa thanh toán).'
            : 'Đơn hàng này đã được thanh toán.'}
        </p>
        <Link
          href={order.status === 'CANCELLED' ? '/menu' : `/orders/${encodeURIComponent(order.orderId)}/receipt`}
          className="inline-block px-5 py-3 rounded-2xl bg-[#3D2615] text-white font-bold text-sm"
        >
          {order.status === 'CANCELLED' ? 'Đặt lại từ thực đơn' : 'Xem biên nhận'}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 pb-56 space-y-5">
        <section>
          <h2 className="font-bold text-[#3D2615] mb-2.5">Hình thức nhận món</h2>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#EFE8DF]" role="radiogroup">
            {(
              [
                ['TAKEAWAY', 'Tại quầy (Take-away)'],
                ['DINE_IN', 'Dùng tại bàn'],
              ] as [FulfillmentMode, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => setMode(value)}
                className={`min-h-[44px] rounded-full text-sm font-semibold transition cursor-pointer ${
                  mode === value ? 'bg-[#3D2615] text-white' : 'text-stone-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 bg-white rounded-2xl p-3.5 flex items-center gap-3 border border-[#F1ECE5]">
            <User className="w-5 h-5 text-stone-500" />
            <div className="text-sm">
              <p className="font-bold text-[#3D2615]">{user?.name ?? 'Khách hàng'}</p>
              <p className="text-stone-500">{user?.email ?? ''}</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-bold text-[#3D2615] mb-2.5">Phương thức thanh toán</h2>
          <div role="radiogroup" className="space-y-3">
            {VNPAY_OPTIONS.map(({ id, title, subtitle, detail, detailClass, icon: Icon }) => {
              const selected = selectedId === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isPaying}
                  onClick={() => handleSelectMethod(id)}
                  data-testid={`method-${id}`}
                  className={`w-full min-h-[88px] rounded-2xl border p-3.5 flex items-center gap-3.5 text-left transition cursor-pointer disabled:cursor-not-allowed ${
                    selected ? 'border-[#D97706] bg-[#FFF4E2]' : 'border-[#EDE7DF] bg-white'
                  }`}
                >
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selected ? 'bg-[#3D2615] text-white' : 'bg-[#EFE8DF] text-[#3D2615]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-sm leading-snug">
                    <span className="block font-bold text-[#3D2615]">{title}</span>
                    <span className="block text-stone-600">{subtitle}</span>
                    <span className={`block ${detailClass}`}>{detail}</span>
                  </span>
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-[#D97706]' : 'border-stone-300'
                    }`}
                  >
                    {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Thanh tổng tiền cố định phía dưới */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-white rounded-t-3xl shadow-[0_-6px_24px_rgba(61,38,21,0.08)]">
        <div className="max-w-md mx-auto px-5 pt-4 pb-5 space-y-3">
          <div className="space-y-1">
            <p className="text-sm text-stone-600">
              Món {formatVND(subtotal)}
              {discount > 0 ? ` − giảm giá ${formatVND(discount)}` : ''}
            </p>
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-[#3D2615]">Tổng thanh toán</span>
              <span data-testid="checkout-total" className="font-extrabold text-2xl text-[#3D2615]">
                {formatVND(total)}
              </span>
            </div>
          </div>

          {payError && (
            <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{payError}</span>
            </div>
          )}

          <button
            type="button"
            disabled={isPaying}
            onClick={handlePay}
            data-testid="pay-button"
            className="w-full min-h-[52px] rounded-full bg-[#3D2615] hover:bg-[#2A190D] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kết nối Cổng VNPay...</span>
              </>
            ) : (
              <span>Thanh toán qua VNPay {formatVND(total)}</span>
            )}
          </button>
          <p className="text-center text-xs text-stone-500">
            Đơn hàng sẽ được tự động hoàn kho nếu không thanh toán trong 15 phút.
          </p>
        </div>
      </div>

    </>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900">
      <div className="max-w-md mx-auto">
        <header className="px-5 h-16 flex items-center gap-3">
          <Link href="/cart" aria-label="Quay lại Giỏ hàng" className="min-w-[44px] min-h-[44px] flex items-center text-[#3D2615]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-extrabold text-xl text-[#3D2615]">Xác nhận & Thanh toán</h1>
        </header>
        {/* useSearchParams cần Suspense khi build Next 14 */}
        <Suspense fallback={<div className="mx-5 mt-6 h-64 rounded-2xl bg-white border border-[#EDE7DF] animate-pulse" />}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
