'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  Lock,
  StickyNote,
  User,
  Wallet,
} from 'lucide-react';
import { AuthUser } from '@/types/auth';
import { getAuthToken, onAuthStateChange, syncLoyaltyPoints } from '@/lib/auth';
import { formatVND } from '@/lib/cartPricing';
import { API_BASE, fetchOrder, OrderDto } from '@/lib/orderApi';

type PaymentMethod = 'MOCK_CARD' | 'MOCK_WALLET';
type FulfillmentMode = 'TAKEAWAY' | 'DINE_IN';

const METHODS: {
  value: PaymentMethod;
  title: string;
  subtitle: string;
  detail: string;
  detailClass: string;
  icon: typeof Wallet;
}[] = [
  {
    value: 'MOCK_WALLET',
    title: 'Ví điện tử Giả lập',
    subtitle: '(Mock Wallet)',
    detail: 'Thanh toán ngay',
    detailClass: 'text-[#2D7A4D] font-semibold',
    icon: Wallet,
  },
  {
    value: 'MOCK_CARD',
    title: 'Thẻ ATM / Visa Mô phỏng',
    subtitle: '(Mock Card)',
    detail: '**** **** **** 4242',
    detailClass: 'text-stone-500',
    icon: CreditCard,
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [user, setUser] = useState<AuthUser | null>(null);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Hai lựa chọn dưới chỉ là giao diện (backend chưa có trường lưu), không gửi lên API
  const [mode, setMode] = useState<FulfillmentMode>('TAKEAWAY');
  const [note, setNote] = useState('');

  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [pointsEarned, setPointsEarned] = useState(0);
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

  // 1-2: selectMethod -> generateIdempotencyKey
  const handleSelectMethod = (value: PaymentMethod) => {
    if (isPaying) return;
    setMethod(value);
    setIdempotencyKey(crypto.randomUUID());
    setPayError(null);
  };

  // 3-5: onClickPay -> disablePayButton -> createPayment(orderId, method, key)
  const handlePay = async () => {
    if (!orderId || !method || !idempotencyKey || payingRef.current) return;

    const token = getAuthToken();
    if (!token) {
      setPayError('Vui lòng đăng nhập lại để thanh toán.');
      return;
    }

    payingRef.current = true;
    setIsPaying(true);
    setPayError(null);

    try {
      const response = await fetch(`${API_BASE}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ orderId, method }),
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok) {
        setPointsEarned(Number(payload.pointsEarned ?? 0));
        void syncLoyaltyPoints(); // cập nhật số điểm hiển thị ở trang chủ/giỏ hàng
        setPaidAmount(Number(payload.amount ?? total));
        return;
      }

      // showError, rồi sinh key mới để lượt thanh toán sau là một giao dịch mới
      const message = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message || 'Thanh toán không thành công. Vui lòng thử lại.';
      setPayError(message);
      setIdempotencyKey(crypto.randomUUID());
    } catch {
      // Lỗi mạng: GIỮ NGUYÊN key để bấm lại là gửi lặp an toàn (server trả kết quả cũ, không trừ tiền 2 lần)
      setPayError('Mất kết nối tới máy chủ. Bấm "Xác nhận Thanh toán" lại để thử tiếp, bạn sẽ không bị trừ tiền hai lần.');
    } finally {
      payingRef.current = false;
      setIsPaying(false);
    }
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

  if (order.status !== 'PENDING' && paidAmount === null) {
    return (
      <div className="px-5 py-16 text-center space-y-4">
        <p className="text-stone-600 text-sm">
          {order.status === 'CANCELLED'
            ? 'Đơn hàng này đã bị hủy (quá 15 phút chưa thanh toán).'
            : 'Đơn hàng này đã được thanh toán.'}
        </p>
        <Link
          href={order.status === 'CANCELLED' ? '/menu' : `/orders/${order.orderId}`}
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
          <h2 className="font-bold text-[#3D2615] mb-2.5">Ghi chú cho Barista</h2>
          <label className="bg-white rounded-2xl border border-[#EDE7DF] px-3.5 min-h-[48px] flex items-center gap-3">
            <StickyNote className="w-4 h-4 text-stone-500 shrink-0" />
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              placeholder="Lấy thêm muỗng ăn kem cheese"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-stone-500"
            />
          </label>
        </section>

        <section>
          <h2 className="font-bold text-[#3D2615] mb-2.5">Phương thức thanh toán</h2>
          <div role="radiogroup" className="space-y-3">
            {METHODS.map(({ value, title, subtitle, detail, detailClass, icon: Icon }) => {
              const selected = method === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isPaying}
                  onClick={() => handleSelectMethod(value)}
                  data-testid={`method-${value}`}
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

          <div className="mt-3 rounded-2xl bg-[#E8F5EE] text-[#2D7A4D] p-3.5 flex items-start gap-2.5 text-sm">
            <Lock className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Giao dịch an toàn được bảo vệ bởi Idempotency Key. Không sợ bị trừ tiền trùng lặp khi mạng chậm.</p>
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
            disabled={!method || isPaying}
            onClick={handlePay}
            data-testid="pay-button"
            className="w-full min-h-[52px] rounded-full bg-[#3D2615] hover:bg-[#2A190D] disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPaying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý thanh toán...</span>
              </>
            ) : (
              <span>Xác nhận Thanh toán {formatVND(total)}</span>
            )}
          </button>
          <p className="text-center text-xs text-stone-500">
            Đơn hàng sẽ được tự động hoàn kho nếu không thanh toán trong 15 phút.
          </p>
        </div>
      </div>

      {/* Popup thanh toán mô phỏng thành công */}
      {paidAmount !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6">
          <div
            role="dialog"
            aria-modal="true"
            data-testid="payment-success-dialog"
            className="w-full max-w-sm bg-[#FBF9F5] rounded-3xl px-6 py-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#E8F5EE] text-[#2D7A4D] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-[#3D2615] leading-tight">
              Thanh toán mô phỏng thành công
            </h2>
            <p className="mt-3 text-3xl font-extrabold text-[#3D2615]">{formatVND(paidAmount)}</p>
            <p className="mt-3 text-sm text-stone-500">
              Không có giao dịch tiền thật.
              <br />
              BrewLite đã nhận đơn hàng của bạn.
            </p>
            {pointsEarned > 0 && (
              <p className="mt-2 text-sm font-bold text-[#2D7A4D]">Bạn được cộng +{pointsEarned} điểm thưởng</p>
            )}
            <button
              type="button"
              onClick={() => router.push(`/orders/${orderId}`)}
              data-testid="view-receipt"
              className="mt-6 w-full min-h-[52px] rounded-full bg-[#3D2615] hover:bg-[#2A190D] text-white font-bold transition cursor-pointer"
            >
              Xem biên nhận
            </button>
          </div>
        </div>
      )}
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
