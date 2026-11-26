'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { syncLoyaltyPoints } from '@/lib/auth';
import { formatVND } from '@/lib/cartPricing';
import { API_BASE } from '@/lib/orderApi';

interface VnpayReturnResult {
  success: boolean;
  message?: string;
  orderId?: string;
  amount?: number;
  responseCode?: string;
  pointsEarned?: number;
}

function VnpayReturnContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const calledRef = useRef(false); // chỉ xác minh một lần (React Strict Mode chạy effect 2 lần ở dev)

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const query = searchParams.toString();
    if (!searchParams.get('vnp_ResponseCode')) {
      setResult({ success: false, message: 'Không tìm thấy kết quả giao dịch từ VNPay.' });
      setLoading(false);
      return;
    }

    // Backend xác minh chữ ký HMAC-SHA512, đối soát số tiền rồi cập nhật Payment/đơn hàng
    fetch(`${API_BASE}/payments/vnpay/return?${query}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = Array.isArray(payload.message)
            ? payload.message.join(', ')
            : payload.message;
          setResult({
            success: false,
            message: message || 'Không thể xác thực giao dịch VNPay.',
          });
          return;
        }
        setResult(payload as VnpayReturnResult);
        if (payload.success) void syncLoyaltyPoints(); // cập nhật số điểm hiển thị
      })
      .catch(() => {
        setResult({ success: false, message: 'Mất kết nối tới máy chủ khi xác minh giao dịch.' });
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  if (loading) {
    return (
      <div className="px-5 py-16 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#D97706] mx-auto" />
        <p className="font-bold text-[#3D2615]">Đang đối soát giao dịch VNPay...</p>
        <p className="text-xs text-stone-500">Hệ thống đang xác minh chữ ký số từ Cổng VNPay Sandbox.</p>
      </div>
    );
  }

  const orderId = result?.orderId;

  if (result?.success) {
    return (
      <div className="px-5 py-10">
        <div
          role="status"
          data-testid="payment-success-dialog"
          className="bg-white rounded-3xl px-6 py-8 text-center shadow-md border border-[#EDE7DF]"
        >
          <div className="w-16 h-16 rounded-full bg-[#E8F5EE] text-[#2D7A4D] flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-[#3D2615] leading-tight">
            Thanh toán VNPay thành công
          </h2>
          {typeof result.amount === 'number' && (
            <p className="mt-3 text-3xl font-extrabold text-[#3D2615]">{formatVND(result.amount)}</p>
          )}
          <p className="mt-3 text-sm text-stone-500">
            Giao dịch qua Cổng VNPay Sandbox (môi trường thử nghiệm).
            <br />
            BrewLite đã nhận đơn hàng của bạn.
          </p>
          {Number(result.pointsEarned) > 0 && (
            <p className="mt-2 text-sm font-bold text-[#2D7A4D]">
              Bạn được cộng +{result.pointsEarned} điểm thưởng
            </p>
          )}
          {orderId && (
            <Link
              href={`/orders/${encodeURIComponent(orderId)}/receipt`}
              data-testid="view-receipt"
              className="mt-6 w-full min-h-[52px] rounded-full bg-[#3D2615] hover:bg-[#2A190D] text-white font-bold transition flex items-center justify-center"
            >
              Xem biên nhận
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-10">
      <div
        role="alert"
        data-testid="payment-failed-card"
        className="bg-white rounded-3xl px-6 py-8 text-center shadow-md border border-rose-200"
      >
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="mt-4 text-xl font-extrabold text-[#3D2615]">Thanh toán không thành công</h2>
        <p className="mt-2 text-sm text-stone-600">
          {result?.message || 'Giao dịch bị từ chối hoặc xảy ra lỗi trong quá trình xử lý.'}
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Đơn hàng vẫn được giữ trong 15 phút kể từ lúc đặt, bạn có thể thanh toán lại.
        </p>
        <div className="mt-6 space-y-2.5">
          {orderId && (
            <>
              <Link
                href={`/checkout?orderId=${encodeURIComponent(orderId)}`}
                className="w-full min-h-[52px] rounded-full bg-[#3D2615] hover:bg-[#2A190D] text-white font-bold transition flex items-center justify-center"
              >
                Thanh toán lại
              </Link>
              <Link
                href={`/orders/${encodeURIComponent(orderId)}/receipt`}
                className="w-full min-h-[48px] rounded-full bg-[#EFE8DF] text-[#3D2615] font-semibold transition flex items-center justify-center"
              >
                Xem biên nhận
              </Link>
            </>
          )}
          <Link
            href="/menu"
            className="w-full min-h-[44px] rounded-full text-stone-600 text-sm font-semibold flex items-center justify-center"
          >
            Về thực đơn
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VnpayReturnPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900">
      <div className="max-w-md mx-auto">
        <header className="px-5 h-16 flex items-center">
          <h1 className="font-extrabold text-xl text-[#3D2615]">Kết quả thanh toán</h1>
        </header>
        {/* useSearchParams cần Suspense khi build Next 14 */}
        <Suspense fallback={<div className="mx-5 mt-6 h-64 rounded-2xl bg-white border border-[#EDE7DF] animate-pulse" />}>
          <VnpayReturnContent />
        </Suspense>
      </div>
    </div>
  );
}
