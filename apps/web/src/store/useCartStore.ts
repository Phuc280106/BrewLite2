import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';
import {
  ActionResult,
  AddToCartInput,
  CartItem,
  PromotionRule,
} from '@/types/cart';
import {
  buildCartItemId,
  calculateCartTotals,
  calculateItemUnitPrice,
  CART_STORAGE_KEY,
  findPromotionByCode,
  formatVND,
  LOYALTY_REDEEM_RATE,
  normalizePromotionRule,
  toNumeric,
} from '@/lib/cartPricing';

/**
 * Storage an toàn cho Zustand Persist:
 * - Hoạt động bình thường với localStorage trên trình duyệt.
 * - Khi trình duyệt chặn hoặc đầy bộ nhớ (Exception Flow E3), log cảnh báo nhẹ và giữ state trên RAM.
 */
function createSafeLocalStorage(): StateStorage {
  const memoryFallback = new Map<string, string>();

  return {
    getItem: (name: string): string | null => {
      if (typeof window === 'undefined') {
        return memoryFallback.get(name) ?? null;
      }
      try {
        return window.localStorage.getItem(name);
      } catch (err) {
        console.warn('[CartStore] Không thể đọc localStorage, dùng bộ nhớ tạm:', err);
        return memoryFallback.get(name) ?? null;
      }
    },
    setItem: (name: string, value: string): void => {
      memoryFallback.set(name, value);
      if (typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.setItem(name, value);
      } catch (err) {
        console.warn('[CartStore] Không thể lưu localStorage, giỏ hàng vẫn được giữ trong phiên hiện tại:', err);
      }
    },
    removeItem: (name: string): void => {
      memoryFallback.delete(name);
      if (typeof window === 'undefined') {
        return;
      }
      try {
        window.localStorage.removeItem(name);
      } catch (err) {
        console.warn('[CartStore] Không thể xóa khóa localStorage:', err);
      }
    },
  };
}

export interface CartState {
  items: CartItem[];
  availablePromotions: PromotionRule[];
  appliedPromotion: PromotionRule | null;
  pointsRedeemed: number;
  hasHydrated: boolean;

  setHasHydrated: (value: boolean) => void;
  setAvailablePromotions: (promotions: PromotionRule[]) => void;
  addItem: (input: AddToCartInput) => CartItem;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  applyPromotion: (code: string, promotions?: PromotionRule[]) => ActionResult;
  removePromotion: () => void;
  applyLoyaltyPoints: (requestedPoints: number, userPoints: number) => ActionResult;
  clearLoyaltyPoints: () => void;
}

function reconcileDiscounts(
  items: CartItem[],
  currentPromo: PromotionRule | null,
  currentPoints: number,
): { appliedPromotion: PromotionRule | null; pointsRedeemed: number } {
  const { subtotal } = calculateCartTotals({
    items,
    appliedPromotion: null,
    pointsRedeemed: 0,
  });

  if (items.length === 0 || subtotal <= 0) {
    return { appliedPromotion: null, pointsRedeemed: 0 };
  }

  let nextPromo = currentPromo;
  if (nextPromo && subtotal < nextPromo.minimumOrderAmount) {
    nextPromo = null;
  }

  const afterPromo = calculateCartTotals({
    items,
    appliedPromotion: nextPromo,
    pointsRedeemed: 0,
  }).grandTotal;

  const maxPointsByTotal = Math.floor(afterPromo / LOYALTY_REDEEM_RATE);
  const nextPoints = Math.max(0, Math.min(currentPoints, maxPointsByTotal));

  return {
    appliedPromotion: nextPromo,
    pointsRedeemed: nextPoints,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      availablePromotions: [],
      appliedPromotion: null,
      pointsRedeemed: 0,
      hasHydrated: false,

      setHasHydrated: (value: boolean) => set({ hasHydrated: value }),

      setAvailablePromotions: (promotions: PromotionRule[]) => {
        const normalized = promotions
          .map((promo) => normalizePromotionRule(promo))
          .filter((promo): promo is PromotionRule => promo !== null);
        const state = get();
        const refreshedApplied = state.appliedPromotion
          ? (findPromotionByCode(state.appliedPromotion.promotionCode, normalized) ?? null)
          : null;
        const reconciled = reconcileDiscounts(
          state.items,
          refreshedApplied,
          state.pointsRedeemed,
        );

        set({
          availablePromotions: normalized,
          ...reconciled,
        });
      },

      addItem: (input: AddToCartInput) => {
        const safeQuantity = Math.max(1, Math.floor(toNumeric(input.quantity) || 1));
        const resolvedSize = input.size ??
          input.product.sizes?.[0] ?? {
            sizeId: 'default-size-m',
            name: 'M (Vừa)',
            priceAdjustment: 0,
          };
        const normalizedSize = {
          sizeId: resolvedSize.sizeId,
          name: resolvedSize.name,
          priceAdjustment: toNumeric(resolvedSize.priceAdjustment),
        };
        const normalizedToppings = (input.toppings ?? []).map((t) => ({
          toppingId: t.toppingId,
          name: t.name,
          price: toNumeric(t.price),
        }));
        const cleanNote = (input.note ?? '').trim();

        const itemId = buildCartItemId({
          productId: input.product.productId,
          sizeId: normalizedSize.sizeId,
          sugar: input.sugar,
          ice: input.ice,
          toppings: normalizedToppings,
          note: cleanNote,
        });

        const unitPrice = calculateItemUnitPrice(
          input.product.basePrice,
          normalizedSize.priceAdjustment,
          normalizedToppings,
        );

        const state = get();
        const existingIndex = state.items.findIndex((i) => i.id === itemId);
        let nextItems: CartItem[];
        let resultingItem: CartItem;

        if (existingIndex >= 0) {
          nextItems = state.items.map((item, idx) =>
            idx === existingIndex
              ? {
                  ...item,
                  quantity: item.quantity + safeQuantity,
                  unitPrice,
                }
              : item,
          );
          resultingItem = nextItems[existingIndex];
        } else {
          resultingItem = {
            id: itemId,
            productId: input.product.productId,
            productName: input.product.name,
            imageUrl: input.product.imageUrl ?? null,
            basePrice: toNumeric(input.product.basePrice),
            size: normalizedSize,
            sugar: input.sugar,
            ice: input.ice,
            toppings: normalizedToppings,
            note: cleanNote,
            quantity: safeQuantity,
            unitPrice,
          };
          nextItems = [...state.items, resultingItem];
        }

        const reconciled = reconcileDiscounts(
          nextItems,
          state.appliedPromotion,
          state.pointsRedeemed,
        );

        set({
          items: nextItems,
          ...reconciled,
        });

        return resultingItem;
      },

      updateQuantity: (itemId: string, quantity: number) => {
        const safeQty = Math.max(1, Math.floor(toNumeric(quantity) || 1));
        const state = get();
        const nextItems = state.items.map((item) =>
          item.id === itemId ? { ...item, quantity: safeQty } : item,
        );
        const reconciled = reconcileDiscounts(
          nextItems,
          state.appliedPromotion,
          state.pointsRedeemed,
        );

        set({
          items: nextItems,
          ...reconciled,
        });
      },

      removeItem: (itemId: string) => {
        const state = get();
        const nextItems = state.items.filter((item) => item.id !== itemId);
        const reconciled = reconcileDiscounts(
          nextItems,
          state.appliedPromotion,
          state.pointsRedeemed,
        );

        set({
          items: nextItems,
          ...reconciled,
        });
      },

      clearCart: () => {
        set({
          items: [],
          appliedPromotion: null,
          pointsRedeemed: 0,
        });
      },

      applyPromotion: (code: string, promotions?: PromotionRule[]): ActionResult => {
        const trimmed = code.trim();
        if (!trimmed) {
          return { ok: false, message: 'Vui lòng nhập mã khuyến mãi.' };
        }

        const state = get();
        if (state.items.length === 0) {
          return { ok: false, message: 'Giỏ hàng đang trống, chưa thể áp dụng mã.' };
        }

        const catalog = promotions ?? state.availablePromotions;
        if (catalog.length === 0) {
          return {
            ok: false,
            message: 'Chưa có mã khuyến mãi khả dụng từ hệ thống. Vui lòng thử lại.',
          };
        }

        const promo = findPromotionByCode(trimmed, catalog);
        if (!promo) {
          return {
            ok: false,
            message: `Mã khuyến mãi "${trimmed}" không hợp lệ hoặc không tồn tại.`,
          };
        }

        const { subtotal } = calculateCartTotals({
          items: state.items,
          appliedPromotion: null,
          pointsRedeemed: 0,
        });

        if (subtotal < promo.minimumOrderAmount) {
          return {
            ok: false,
            message: `Đơn hàng cần tối thiểu ${formatVND(promo.minimumOrderAmount)} để áp dụng mã ${promo.promotionCode}.`,
          };
        }

        const reconciled = reconcileDiscounts(
          state.items,
          promo,
          state.pointsRedeemed,
        );

        set(reconciled);

        return {
          ok: true,
          message: `Đã áp dụng mã ${promo.promotionCode}: ${promo.description}`,
        };
      },

      removePromotion: () => {
        const state = get();
        const reconciled = reconcileDiscounts(
          state.items,
          null,
          state.pointsRedeemed,
        );
        set(reconciled);
      },

      applyLoyaltyPoints: (requestedPoints: number, userPoints: number): ActionResult => {
        const state = get();
        if (state.items.length === 0) {
          return { ok: false, message: 'Giỏ hàng đang trống, chưa thể đổi điểm.' };
        }

        if (!Number.isInteger(requestedPoints) || requestedPoints < 0) {
          return { ok: false, message: 'Số điểm quy đổi phải là số nguyên không âm.' };
        }

        const safeUserPoints = Math.max(0, Math.floor(toNumeric(userPoints)));
        if (requestedPoints > safeUserPoints) {
          return {
            ok: false,
            message: 'Số điểm quy đổi không được vượt quá số dư hiện có.',
          };
        }

        if (requestedPoints === 0) {
          set({ pointsRedeemed: 0 });
          return {
            ok: true,
            appliedPoints: 0,
            message: 'Đã hủy áp dụng điểm thưởng.',
          };
        }

        const afterPromoSubtotal = calculateCartTotals({
          items: state.items,
          appliedPromotion: state.appliedPromotion,
          pointsRedeemed: 0,
        }).grandTotal;

        const maxApplicablePoints = Math.floor(
          afterPromoSubtotal / LOYALTY_REDEEM_RATE,
        );

        if (maxApplicablePoints <= 0) {
          set({ pointsRedeemed: 0 });
          return {
            ok: false,
            appliedPoints: 0,
            message: 'Giá trị đơn hàng sau khuyến mãi đã bằng 0đ, không cần đổi thêm điểm.',
          };
        }

        if (requestedPoints > maxApplicablePoints) {
          set({ pointsRedeemed: maxApplicablePoints });
          return {
            ok: true,
            appliedPoints: maxApplicablePoints,
            message: `Tự động giới hạn tối đa ${maxApplicablePoints} điểm để khớp tổng tiền đơn hàng.`,
          };
        }

        set({ pointsRedeemed: requestedPoints });
        return {
          ok: true,
          appliedPoints: requestedPoints,
          message: `Đã áp dụng ${requestedPoints} điểm (-${formatVND(requestedPoints * LOYALTY_REDEEM_RATE)}).`,
        };
      },

      clearLoyaltyPoints: () => {
        set({ pointsRedeemed: 0 });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeLocalStorage()),
      partialize: (state) => ({
        items: state.items,
        appliedPromotion: state.appliedPromotion,
        pointsRedeemed: state.pointsRedeemed,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
