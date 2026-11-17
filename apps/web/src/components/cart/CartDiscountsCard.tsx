import React, { useState } from 'react';
import Link from 'next/link';
import { AuthUser } from '@/types/auth';
import { ActionResult, PromotionRule } from '@/types/cart';
import {
  AVAILABLE_PROMOTIONS,
  formatVND,
  LOYALTY_REDEEM_RATE,
} from '@/lib/cartPricing';
import { Ticket, Coins, CheckCircle2, X, AlertCircle } from 'lucide-react';

interface CartDiscountsCardProps {
  subtotal: number;
  appliedPromotion: PromotionRule | null;
  promotionDiscount: number;
  pointsRedeemed: number;
  loyaltyDiscount: number;
  currentUser: AuthUser | null;
  onApplyPromotion: (code: string) => ActionResult;
  onRemovePromotion: () => void;
  onApplyLoyaltyPoints: (points: number, userPoints: number) => ActionResult;
  onClearLoyaltyPoints: () => void;
}

export const CartDiscountsCard: React.FC<CartDiscountsCardProps> = ({
  subtotal,
  appliedPromotion,
  promotionDiscount,
  pointsRedeemed,
  loyaltyDiscount,
  currentUser,
  onApplyPromotion,
  onRemovePromotion,
  onApplyLoyaltyPoints,
  onClearLoyaltyPoints,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<ActionResult | null>(null);

  const [pointsInput, setPointsInput] = useState(
    pointsRedeemed > 0 ? String(pointsRedeemed) : '',
  );
  const [pointsFeedback, setPointsFeedback] = useState<ActionResult | null>(null);

  const userPoints = currentUser?.points ?? 0;
  const afterPromo = Math.max(0, subtotal - promotionDiscount);
  const maxUsablePoints = Math.min(
    userPoints,
    Math.floor(afterPromo / LOYALTY_REDEEM_RATE),
  );

  const handleApplyPromo = (codeToApply: string) => {
    const result = onApplyPromotion(codeToApply);
    setPromoFeedback(result);
    if (result.ok) {
      setPromoInput('');
    }
  };

  const handleApplyPoints = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (trimmed === '') {
      setPointsFeedback({
        ok: false,
        message: 'Vui lòng nhập số điểm muốn quy đổi.',
      });
      return;
    }

    const parsed = Number(trimmed);
    const result = onApplyLoyaltyPoints(parsed, userPoints);
    setPointsFeedback(result);
    if (result.ok && result.appliedPoints !== undefined) {
      setPointsInput(result.appliedPoints > 0 ? String(result.appliedPoints) : '');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Khối Mã khuyến mãi */}
      <div className="bg-white rounded-2xl border border-[#EDE7DF] p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Ticket className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-bold text-sm text-[#3D2615]">Mã khuyến mãi</h3>
        </div>

        {appliedPromotion ? (
          <div className="bg-[#EEF7F2] border border-[#C8E6C9] rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2D7A4D]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{appliedPromotion.promotionCode}</span>
                <span>(-{formatVND(promotionDiscount)})</span>
              </div>
              <p className="text-[11px] text-[#2D7A4D]/90 mt-0.5 truncate">
                {appliedPromotion.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onRemovePromotion();
                setPromoFeedback(null);
              }}
              aria-label="Gỡ mã khuyến mãi"
              className="min-w-[44px] min-h-[44px] rounded-lg flex items-center justify-center text-[#2D7A4D] hover:bg-white/70 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Nhập mã (VD: BREWLITE10)"
                aria-label="Mã khuyến mãi"
                className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#3D2615] uppercase"
              />
              <button
                type="button"
                onClick={() => handleApplyPromo(promoInput)}
                className="min-h-[44px] px-4 rounded-xl bg-[#3D2615] hover:bg-[#2A190D] text-white text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
              >
                Áp dụng
              </button>
            </div>

            {/* Gợi ý nhanh 2 mã khuyến mãi từ hệ thống */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {AVAILABLE_PROMOTIONS.map((promo) => {
                const eligible = subtotal >= promo.minimumOrderAmount;
                return (
                  <button
                    key={promo.promotionCode}
                    type="button"
                    onClick={() => handleApplyPromo(promo.promotionCode)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition cursor-pointer ${
                      eligible
                        ? 'border-amber-300 bg-[#FFF8ED] text-[#9A4E04] hover:bg-amber-100/70 font-semibold'
                        : 'border-stone-200 bg-stone-50 text-stone-400'
                    }`}
                    title={promo.description}
                  >
                    {promo.promotionCode} • {promo.description}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {promoFeedback && !promoFeedback.ok && (
          <p className="mt-2.5 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{promoFeedback.message}</span>
          </p>
        )}
      </div>

      {/* 2. Khối Đổi điểm thưởng (UC-CART-01.6) */}
      <div className="bg-white rounded-2xl border border-[#EDE7DF] p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#2D7A4D]" />
            <h3 className="font-bold text-sm text-[#3D2615]">Đổi điểm thưởng</h3>
          </div>
          {currentUser && (
            <span className="text-xs font-bold text-[#2D7A4D] bg-[#EEF7F2] px-2.5 py-1 rounded-full">
              Số dư: {userPoints} điểm
            </span>
          )}
        </div>

        {!currentUser ? (
          <div className="bg-[#FBF9F5] border border-[#EDE7DF] rounded-xl p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-stone-600">
              Đăng nhập để sử dụng điểm thưởng tích lũy (1 điểm = 1.000đ).
            </p>
            <Link
              href="/auth"
              className="shrink-0 min-h-[40px] px-3.5 py-2 rounded-xl bg-[#3D2615] text-white text-xs font-bold flex items-center justify-center hover:bg-[#2A190D] transition"
            >
              Đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                step={1}
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder={`Nhập số điểm (tối đa ${maxUsablePoints})`}
                aria-label="Số điểm muốn đổi"
                className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:border-[#3D2615]"
              />
              <button
                type="button"
                onClick={() => handleApplyPoints(pointsInput)}
                className="min-h-[44px] px-4 rounded-xl bg-[#2D7A4D] hover:bg-[#23613C] text-white text-xs sm:text-sm font-bold transition cursor-pointer shrink-0"
              >
                Áp dụng
              </button>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
              <span>Quy đổi: 1 điểm = 1.000đ</span>
              <div className="flex items-center gap-3">
                {maxUsablePoints > 0 && (
                  <button
                    type="button"
                    onClick={() => handleApplyPoints(String(maxUsablePoints))}
                    className="font-semibold text-[#2D7A4D] hover:underline cursor-pointer"
                  >
                    Dùng tối đa ({maxUsablePoints} điểm)
                  </button>
                )}
                {pointsRedeemed > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearLoyaltyPoints();
                      setPointsInput('');
                      setPointsFeedback(null);
                    }}
                    className="font-semibold text-stone-500 hover:text-rose-600 cursor-pointer"
                  >
                    Hủy đổi điểm
                  </button>
                )}
              </div>
            </div>

            {pointsRedeemed > 0 && (
              <div className="mt-2.5 bg-[#EEF7F2] border border-[#C8E6C9] rounded-xl px-3 py-2 flex items-center justify-between text-xs font-bold text-[#2D7A4D]">
                <span>Đã áp dụng {pointsRedeemed} điểm thưởng</span>
                <span>-{formatVND(loyaltyDiscount)}</span>
              </div>
            )}

            {pointsFeedback && !pointsFeedback.ok && (
              <p className="mt-2.5 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{pointsFeedback.message}</span>
              </p>
            )}

            {pointsFeedback && pointsFeedback.ok && pointsRedeemed > 0 && (
              <p className="mt-2 text-xs text-[#2D7A4D] font-medium">
                {pointsFeedback.message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
