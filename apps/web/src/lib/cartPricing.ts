import { CartItem, CartTotals, PromotionRule } from '@/types/cart';
import { Topping } from '@/types';

export const CART_STORAGE_KEY = 'brewlite-cart';
export const LOYALTY_REDEEM_RATE = 1000;

/**
 * Danh sách mã khuyến mãi khớp với dữ liệu seed trong apps/api/prisma/seed.ts
 */
export const AVAILABLE_PROMOTIONS: PromotionRule[] = [
  {
    promotionCode: 'BREWLITE10',
    description: 'Giảm 10% cho đơn từ 50.000đ',
    minimumOrderAmount: 50000,
    discountAmount: 0,
    discountPercentage: 10,
  },
  {
    promotionCode: 'GIAM15K',
    description: 'Giảm 15.000đ cho đơn từ 80.000đ',
    minimumOrderAmount: 80000,
    discountAmount: 15000,
    discountPercentage: 0,
  },
];

export function toNumeric(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function calculateItemUnitPrice(
  basePrice: unknown,
  sizePriceAdjustment: unknown,
  toppings: Topping[] = [],
): number {
  const base = toNumeric(basePrice);
  const sizeAdj = toNumeric(sizePriceAdjustment);
  const toppingsTotal = toppings.reduce((sum, t) => sum + toNumeric(t.price), 0);
  return Math.max(0, base + sizeAdj + toppingsTotal);
}

export function calculateItemLineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity'>): number {
  return toNumeric(item.unitPrice) * Math.max(1, Math.floor(toNumeric(item.quantity)));
}

export function buildCartItemId(params: {
  productId: string;
  sizeId: string;
  sugar: string;
  ice: string;
  toppings: Topping[];
  note?: string;
}): string {
  const sortedToppingIds = params.toppings
    .map((t) => t.toppingId)
    .sort()
    .join(',');
  const cleanNote = (params.note ?? '').trim().toLowerCase();
  return [
    params.productId,
    params.sizeId,
    params.sugar,
    params.ice,
    sortedToppingIds,
    cleanNote,
  ].join('::');
}

export function findPromotionByCode(code: string): PromotionRule | undefined {
  const normalized = code.trim().toUpperCase();
  return AVAILABLE_PROMOTIONS.find((p) => p.promotionCode === normalized);
}

export function calculatePromotionDiscount(
  subtotal: number,
  promotion: PromotionRule | null,
): number {
  if (!promotion || subtotal <= 0) {
    return 0;
  }
  if (subtotal < promotion.minimumOrderAmount) {
    return 0;
  }

  const rawDiscount =
    promotion.discountPercentage > 0
      ? Math.floor((subtotal * promotion.discountPercentage) / 100)
      : promotion.discountAmount;

  return Math.min(subtotal, Math.max(0, rawDiscount));
}

export function calculateCartTotals(params: {
  items: CartItem[];
  appliedPromotion: PromotionRule | null;
  pointsRedeemed: number;
}): CartTotals {
  const totalItems = params.items.reduce(
    (sum, item) => sum + Math.max(0, Math.floor(toNumeric(item.quantity))),
    0,
  );
  const subtotal = params.items.reduce(
    (sum, item) => sum + calculateItemLineTotal(item),
    0,
  );

  const promotionDiscount = calculatePromotionDiscount(
    subtotal,
    params.appliedPromotion,
  );
  const afterPromo = Math.max(0, subtotal - promotionDiscount);

  const safePoints = Math.max(0, Math.floor(toNumeric(params.pointsRedeemed)));
  const loyaltyDiscount = Math.min(afterPromo, safePoints * LOYALTY_REDEEM_RATE);

  const totalDiscount = promotionDiscount + loyaltyDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount);

  return {
    totalItems,
    subtotal,
    promotionDiscount,
    loyaltyDiscount,
    totalDiscount,
    grandTotal,
  };
}

export function isItemAvailable(item: {
  isAvailable?: boolean;
  product?: { isAvailable?: boolean };
  size?: { isAvailable?: boolean };
}): boolean {
  if (item.isAvailable === false) return false;
  if (item.product && item.product.isAvailable === false) return false;
  if (item.size && item.size.isAvailable === false) return false;
  return true;
}

export function formatVND(amount: number): string {
  return `${Math.round(toNumeric(amount)).toLocaleString('vi-VN')}đ`;
}
