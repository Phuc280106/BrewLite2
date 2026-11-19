'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertCircle, Check, Clock, Coffee, Home, ShoppingBag, Wallet } from 'lucide-react';
import { formatVND } from '@/lib/cartPricing';
import { fetchOrder, lineBase, METHOD_LABEL, OrderDto, pickupCode, receiptCode } from '@/lib/orderApi';
import { BarcodePlaceholder, QrPlaceholder } from '@/components/orders/PickupCode';

const POLL_INTERVAL_MS = 5000;
const FINAL_STATUSES = ['COMPLETED', 'CANCELLED'];

const STEPS = [
  { label: 'Chờ tiếp nhận', icon: Check },
  { label: 'Đang pha chế', icon: Coffee },
  { label: 'Sẵn sàng lấy món', icon: ShoppingBag },
  { label: 'Hoàn tất', icon: Check },
];

/** Bước đang diễn ra (các bước phía trước coi như đã xong). 4 = tất cả đã xong. */
function currentStep(status: string): number {
  switch (status) {
    case 'PAID':
    case 'PREPARING':
      return 1;
    case 'READY':
      return 2;
    case 'COMPLETED':
      return 4;
    default:
      return -1;
  }
}

export default function OrderTrackerPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Order Tracker: tải đơn rồi poll định kỳ cho tới khi đơn kết thúc
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();

    const load = async () => {
      try {
        const data = await fetchOrder(orderId, controller.signal);
        if (cancelled) return;
        setOrder(data);
        setError(null);
        if (!FINAL_STATUSES.includes(data.status)) {
          timer = setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'Không tải được đơn hàng.');
        timer = setTimeout(load, POLL_INTERVAL_MS * 2); // lỗi tạm thời thì thử lại
      }
    };
    load();

    return () => {
      cancelled = true;
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  const step = order ? currentStep(order.status) : -1;
  const isPaid = step >= 1;
  const isCancelled = order?.status === 'CANCELLED';
  const payment = order?.payments.find((p) => p.status === 'SUCCESS');
  const total = order ? Number(order.totalAmount) : 0;
  const discount = order ? Number(order.discountAmount) : 0;
  const pointsEarned = (order?.loyaltyTransactions ?? [])
    .filter((t) => t.type === 'EARN')
    .reduce((sum, t) => sum + t.pointsAmount, 0);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900">
      <div className="max-w-md mx-auto pb-36">
        <header className="px-5 h-16 flex items-center gap-3">
          <Link href="/menu" aria-label="Về trang chủ" className="min-w-[44px] min-h-[44px] flex items-center text-[#3D2615]">
            <Home className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-[#3D2615]">
            Biên nhận đơn hàng {order ? receiptCode(order.orderId) : ''}
          </h1>
        </header>

        {!order && !error && <div className="mx-5 h-72 rounded-2xl bg-white border border-[#EDE7DF] animate-pulse" />}
        {!order && error && (
          <div role="alert" className="mx-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 p-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {order && (
          <div className="px-5 space-y-4">
            {/* Banner trạng thái thanh toán */}
            {isPaid && (
              <div className="rounded-2xl bg-[#E8F5EE] p-4 flex items-center gap-3.5">
                <span className="w-12 h-12 rounded-full bg-white/60 text-[#2D7A4D] flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6" />
                </span>
                <div className="text-sm">
                  <p className="font-extrabold text-lg text-[#2D7A4D] leading-tight">Thanh toán thành công!</p>
                  <p className="text-stone-600">
                    {step >= 4 ? 'Đơn hàng đã hoàn tất. Cảm ơn bạn!' : step === 2 ? 'Món của bạn đã sẵn sàng tại quầy.' : 'Quầy đang chuẩn bị món.'}
                  </p>
                  {step === 1 && <p className="font-bold text-[#2D7A4D]">Dự kiến có sau 8-10 phút</p>}
                </div>
              </div>
            )}
            {isCancelled && (
              <div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700">
                <p className="font-bold">Đơn hàng đã bị hủy</p>
                <p>Đơn quá 15 phút chưa thanh toán nên hệ thống đã hoàn kho nguyên liệu.</p>
              </div>
            )}
            {!isPaid && !isCancelled && (
              <div className="rounded-2xl bg-[#FFF4E2] border border-[#F3D9AE] p-4 flex items-center gap-3.5 text-sm">
                <Clock className="w-6 h-6 text-[#D97706] shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-[#3D2615]">Đơn hàng đang chờ thanh toán</p>
                  <p className="text-stone-600">Đơn sẽ tự hủy nếu quá 15 phút chưa thanh toán.</p>
                </div>
                <Link href={`/checkout?orderId=${order.orderId}`} className="px-4 min-h-[40px] rounded-full bg-[#D97706] text-white font-bold flex items-center">
                  Thanh toán
                </Link>
              </div>
            )}

            {/* Order tracker */}
            {!isCancelled && (
              <ol className="flex" aria-label="Tiến trình đơn hàng" data-testid="order-tracker">
                {STEPS.map(({ label, icon: Icon }, i) => {
                  const done = i < step;
                  const active = i === step;
                  return (
                    <li key={label} className="flex-1 flex flex-col items-center text-center relative" aria-current={active ? 'step' : undefined}>
                      {i < STEPS.length - 1 && (
                        <span className={`absolute top-5 left-1/2 w-full h-0.5 ${i < step ? 'bg-[#2D7A4D]' : 'bg-[#E2DBD2]'}`} />
                      )}
                      <span
                        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${
                          done
                            ? 'bg-[#2D7A4D] text-white'
                            : active
                              ? 'bg-[#D97706] text-white ring-4 ring-[#F6D9A8]'
                              : 'bg-[#E9E3DC] text-stone-400'
                        }`}
                      >
                        {done ? <Check className="w-5 h-5" /> : active ? <Icon className="w-5 h-5" /> : <span className="w-2 h-2 rounded-full bg-stone-400" />}
                      </span>
                      <span
                        className={`mt-2 text-xs leading-tight font-semibold ${
                          done ? 'text-[#2D7A4D]' : active ? 'text-[#D97706]' : 'text-stone-400'
                        }`}
                      >
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* Mã nhận món */}
            {isPaid && (
              <section className="bg-white rounded-2xl border border-[#EDE7DF] p-4 flex items-center gap-4">
                <QrPlaceholder seed={order.orderId} />
                <div className="flex-1 text-left">
                  <p className="text-sm text-stone-500">Mã nhận món</p>
                  <p data-testid="pickup-code" className="text-4xl font-extrabold text-[#3D2615] leading-tight">
                    {pickupCode(order.orderId)}
                  </p>
                  <div className="mt-1.5"><BarcodePlaceholder seed={order.orderId} /></div>
                  <p className="text-xs text-stone-500 mt-1">Quét mã khi nhận món</p>
                </div>
              </section>
            )}

            {/* Chi tiết biên nhận */}
            <section className="bg-white rounded-2xl border border-[#EDE7DF] p-4 space-y-2 text-sm">
              <h2 className="font-extrabold text-[#3D2615]">Chi tiết biên nhận</h2>
              {order.items.map((item) => (
                <div key={item.orderItemId}>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>{item.quantity}× {item.productName}</span>
                    <span>{formatVND(lineBase(item))}</span>
                  </div>
                  <p className="text-stone-500">Size {item.size.name}</p>
                  {item.toppings.map((t) => (
                    <div key={t.toppingId} className="flex justify-between text-stone-500">
                      <span>{t.name}</span>
                      <span>+{formatVND(Number(t.price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div className="border-t border-stone-200 pt-2 space-y-1">
                {discount > 0 && (
                  <div className="flex justify-between text-[#2D7A4D]">
                    <span>Giảm giá</span>
                    <span>-{formatVND(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline font-bold text-[#3D2615]">
                  <span>{isPaid ? 'Tổng đã thanh toán' : 'Tổng thanh toán'}</span>
                  <span className="text-xl font-extrabold">{formatVND(total)}</span>
                </div>
                {payment && (
                  <div className="flex justify-between items-center text-stone-700">
                    <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />{METHOD_LABEL[payment.paymentMethod] ?? payment.paymentMethod}</span>
                    <span className="text-[#2D7A4D] font-semibold">Thành công</span>
                  </div>
                )}
                {pointsEarned > 0 && (
                  <div data-testid="points-earned" className="flex justify-between rounded-lg bg-[#E8F5EE] px-3 py-1.5 text-[#2D7A4D]">
                    <span>Điểm thưởng tích lũy</span>
                    <span className="font-extrabold">+{pointsEarned} Điểm</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {order && (
        <div className="fixed bottom-0 inset-x-0 bg-white">
          <div className="max-w-md mx-auto px-5 pt-3 pb-5 space-y-3">
            <p className="text-center text-sm text-stone-500">
              {isCancelled ? 'Đơn hàng đã bị hủy.' : step >= 2 ? 'Đơn đã sẵn sàng, không thể hủy.' : isPaid ? 'Đơn đang pha chế, không thể hủy.' : 'Đơn chưa thanh toán.'}
            </p>
            <div className="flex gap-3">
              {/* Backend chưa có API hủy đơn của khách nên nút luôn bị khóa */}
              <button type="button" disabled className="min-h-[48px] px-5 rounded-full border border-rose-200 text-rose-300 font-bold text-sm cursor-not-allowed">
                Hủy đơn hàng
              </button>
              <Link href="/menu" className="flex-1 min-h-[48px] rounded-full bg-[#D97706] hover:bg-[#C26804] text-white font-bold text-sm flex items-center justify-center transition">
                Tiếp tục đặt món khác
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
