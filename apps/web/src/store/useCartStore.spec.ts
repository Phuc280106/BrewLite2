import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Product, Size, Topping } from '@/types';
import { PromotionRule } from '@/types/cart';
import {
  calculateCartTotals,
  calculateItemUnitPrice,
  CART_STORAGE_KEY,
  normalizePromotionRule,
} from '@/lib/cartPricing';
import { useCartStore } from './useCartStore';

const samplePromotions: PromotionRule[] = [
  {
    promotionId: 'promo-1',
    promotionCode: 'BREWLITE10',
    description: 'Giảm 10% cho đơn từ 50.000đ',
    minimumOrderAmount: 50000,
    discountAmount: 0,
    discountPercentage: 10,
  },
  {
    promotionId: 'promo-2',
    promotionCode: 'GIAM15K',
    description: 'Giảm 15.000đ cho đơn từ 80.000đ',
    minimumOrderAmount: 80000,
    discountAmount: 15000,
    discountPercentage: 0,
  },
];

const sizeM: Size = { sizeId: 'size-m', name: 'M (Vừa)', priceAdjustment: 0 };
const sizeL: Size = { sizeId: 'size-l', name: 'L (Lớn)', priceAdjustment: 8000 };
const topBoba: Topping = { toppingId: 'top-1', name: 'Trân châu đen', price: 5000 };
const topCheese: Topping = { toppingId: 'top-2', name: 'Kem cheese', price: 10000 };

const oolongMilkTea: Product = {
  productId: 'prod-1',
  name: 'Trà Sữa Oolong Nướng',
  basePrice: 38000,
  categoryId: 'cat-1',
  sizes: [sizeM, sizeL],
  toppings: [topBoba, topCheese],
};

const saltedCoffee: Product = {
  productId: 'prod-2',
  name: 'Cà Phê Muối Hoàng Gia',
  basePrice: 35000,
  categoryId: 'cat-2',
  sizes: [sizeM, sizeL],
  toppings: [topCheese],
};

describe('useCartStore & cartPricing (FR-03 / UNIT-T01)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().setAvailablePromotions(samplePromotions);
    vi.restoreAllMocks();
  });

  it('computes unitPrice accurately even when API returns Decimal strings', () => {
    const unitPrice = calculateItemUnitPrice('38000' as unknown as number, '8000', [
      { ...topBoba, price: '5000' as unknown as number },
      { ...topCheese, price: '10000' as unknown as number },
    ]);
    expect(unitPrice).toBe(61000);
  });

  it('adds new items, merges identical customizations regardless of topping order, and separates different options', () => {
    const store = useCartStore.getState();

    // Lần 1: Size L + 2 topping (Boba, Cheese)
    store.addItem({
      product: oolongMilkTea,
      size: sizeL,
      sugar: '50%',
      ice: '50% đá',
      toppings: [topBoba, topCheese],
      note: 'Ít ngọt',
      quantity: 1,
    });

    // Lần 2: Cùng cấu hình nhưng đảo thứ tự topping & khoảng trắng note -> phải gộp quantity = 3
    store.addItem({
      product: oolongMilkTea,
      size: sizeL,
      sugar: '50%',
      ice: '50% đá',
      toppings: [topCheese, topBoba],
      note: '  ít ngọt  ',
      quantity: 2,
    });

    // Lần 3: Khác mức đường (70%) -> tách thành dòng riêng (AC-03.3)
    store.addItem({
      product: oolongMilkTea,
      size: sizeL,
      sugar: '70%',
      ice: '50% đá',
      toppings: [topBoba],
      quantity: 1,
    });

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].quantity).toBe(3);
    expect(items[0].unitPrice).toBe(38000 + 8000 + 5000 + 10000); // 61.000đ
    expect(items[1].quantity).toBe(1);
    expect(items[1].unitPrice).toBe(38000 + 8000 + 5000); // 51.000đ

    const totals = calculateCartTotals({
      items,
      appliedPromotion: null,
      pointsRedeemed: 0,
    });
    expect(totals.totalItems).toBe(4);
    expect(totals.subtotal).toBe(61000 * 3 + 51000); // 234.000đ
  });

  it('updates quantity with minimum bound of 1, removes items, and clears cart', () => {
    const store = useCartStore.getState();
    const added = store.addItem({
      product: saltedCoffee,
      size: sizeM,
      sugar: '50%',
      ice: '50% đá',
      quantity: 2,
    });

    store.updateQuantity(added.id, 4);
    expect(useCartStore.getState().items[0].quantity).toBe(4);

    // Không cho phép giảm trực tiếp dưới 1 (UI hiển thị modal xác nhận xóa trước)
    store.updateQuantity(added.id, 0);
    expect(useCartStore.getState().items[0].quantity).toBe(1);

    store.removeItem(added.id);
    expect(useCartStore.getState().items).toHaveLength(0);

    store.addItem({
      product: saltedCoffee,
      size: sizeM,
      sugar: '50%',
      ice: '50% đá',
      quantity: 1,
    });
    store.clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('validates promotion codes (BREWLITE10, GIAM15K) and auto-revalidates when subtotal drops', () => {
    const store = useCartStore.getState();
    const item = store.addItem({
      product: oolongMilkTea,
      size: sizeM,
      sugar: '50%',
      ice: '50% đá',
      quantity: 1,
    }); // 38.000đ

    // Dưới 50.000đ -> không đủ điều kiện BREWLITE10
    const failLow = store.applyPromotion('BREWLITE10');
    expect(failLow.ok).toBe(false);
    expect(useCartStore.getState().appliedPromotion).toBeNull();

    // Mã không tồn tại
    const failUnknown = store.applyPromotion('INVALID99');
    expect(failUnknown.ok).toBe(false);

    // Tăng lên 2 ly = 76.000đ -> đủ BREWLITE10 (>= 50k) nhưng chưa đủ GIAM15K (>= 80k)
    store.updateQuantity(item.id, 2);
    const ok10 = store.applyPromotion('brewlite10');
    expect(ok10.ok).toBe(true);
    expect(store.applyPromotion('GIAM15K').ok).toBe(false);

    let totals = calculateCartTotals({
      items: useCartStore.getState().items,
      appliedPromotion: useCartStore.getState().appliedPromotion,
      pointsRedeemed: 0,
    });
    expect(totals.promotionDiscount).toBe(7600); // 10% của 76.000đ
    expect(totals.grandTotal).toBe(68400);

    // Giảm về 1 ly = 38.000đ -> tự động hủy BREWLITE10 vì dưới 50.000đ
    store.updateQuantity(item.id, 1);
    expect(useCartStore.getState().appliedPromotion).toBeNull();

    totals = calculateCartTotals({
      items: useCartStore.getState().items,
      appliedPromotion: useCartStore.getState().appliedPromotion,
      pointsRedeemed: 0,
    });
    expect(totals.grandTotal).toBe(38000);
  });

  it('validates loyalty point redemption (E1 exceed balance, E2 cap to grandTotal, combined promo + loyalty)', () => {
    const store = useCartStore.getState();
    store.addItem({
      product: oolongMilkTea,
      size: sizeL,
      sugar: '50%',
      ice: '50% đá',
      toppings: [topBoba],
      quantity: 2,
    }); // 51.000 * 2 = 102.000đ

    // Áp dụng GIAM15K (-15.000đ) -> còn 87.000đ
    expect(store.applyPromotion('GIAM15K').ok).toBe(true);

    // E1: Đổi vượt quá số dư userPoints (50 < 60)
    const exceedBalance = store.applyLoyaltyPoints(60, 50);
    expect(exceedBalance.ok).toBe(false);
    expect(useCartStore.getState().pointsRedeemed).toBe(0);

    // Điểm âm / không nguyên -> từ chối
    expect(store.applyLoyaltyPoints(-5, 50).ok).toBe(false);
    expect(store.applyLoyaltyPoints(1.5, 50).ok).toBe(false);

    // Đổi 10 điểm hợp lệ -> giảm thêm 10.000đ
    const validRes = store.applyLoyaltyPoints(10, 50);
    expect(validRes.ok).toBe(true);
    expect(useCartStore.getState().pointsRedeemed).toBe(10);

    let totals = calculateCartTotals({
      items: useCartStore.getState().items,
      appliedPromotion: useCartStore.getState().appliedPromotion,
      pointsRedeemed: useCartStore.getState().pointsRedeemed,
    });
    expect(totals.subtotal).toBe(102000);
    expect(totals.promotionDiscount).toBe(15000);
    expect(totals.loyaltyDiscount).toBe(10000);
    expect(totals.grandTotal).toBe(77000);

    // E2: Đổi 200 điểm (200.000đ > 87.000đ sau promo) -> giữ lại tối thiểu 5.000đ nên chỉ đổi tối đa 82 điểm
    const cappedRes = store.applyLoyaltyPoints(200, 300);
    expect(cappedRes.ok).toBe(true);
    expect(cappedRes.appliedPoints).toBe(82);
    expect(useCartStore.getState().pointsRedeemed).toBe(82);

    totals = calculateCartTotals({
      items: useCartStore.getState().items,
      appliedPromotion: useCartStore.getState().appliedPromotion,
      pointsRedeemed: useCartStore.getState().pointsRedeemed,
    });
    expect(totals.grandTotal).toBe(5000);
  });

  it('persists cart to localStorage under brewlite-cart and handles storage errors gracefully (E3)', () => {
    const storeMap = new Map<string, string>();
    const setItemMock = vi.fn((k: string, v: string) => {
      storeMap.set(k, v);
    });

    vi.stubGlobal('window', {
      localStorage: {
        getItem: vi.fn((k: string) => storeMap.get(k) ?? null),
        setItem: setItemMock,
        removeItem: vi.fn((k: string) => {
          storeMap.delete(k);
        }),
      },
    });

    const store = useCartStore.getState();
    expect(CART_STORAGE_KEY).toBe('brewlite-cart');

    // Khi localStorage ném lỗi SecurityError/QuotaExceededError -> không crash ứng dụng
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    setItemMock.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() =>
      store.addItem({
        product: saltedCoffee,
        size: sizeM,
        sugar: '50%',
        ice: '50% đá',
        quantity: 1,
      }),
    ).not.toThrow();

    expect(useCartStore.getState().items).toHaveLength(1);
    warnSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('supports dynamic promotions fetched from API and clears stale applied codes when DB updates', () => {
    const store = useCartStore.getState();

    // Chuẩn hóa dữ liệu Prisma Decimal từ API /promotions
    const normalizedSummer = normalizePromotionRule({
      promotionId: 'promo-summer',
      promotionCode: ' summer20 ',
      description: 'Giảm 20% mùa hè',
      minimumOrderAmount: '40000.00',
      discountAmount: '0.00',
      discountPercentage: 20,
    });
    expect(normalizedSummer).toEqual({
      promotionId: 'promo-summer',
      promotionCode: 'SUMMER20',
      description: 'Giảm 20% mùa hè',
      minimumOrderAmount: 40000,
      discountAmount: 0,
      discountPercentage: 20,
    });
    expect(normalizePromotionRule({ description: 'thiếu code' })).toBeNull();

    store.setAvailablePromotions([normalizedSummer!]);
    store.addItem({
      product: oolongMilkTea,
      size: sizeL,
      sugar: '50%',
      ice: '50% đá',
      quantity: 1,
    }); // 46.000đ

    const applied = store.applyPromotion('summer20');
    expect(applied.ok).toBe(true);
    expect(
      calculateCartTotals({
        items: useCartStore.getState().items,
        appliedPromotion: useCartStore.getState().appliedPromotion,
        pointsRedeemed: 0,
      }).promotionDiscount,
    ).toBe(9200); // 20% của 46.000đ

    // Khi DB không còn mã SUMMER20 -> tự động gỡ khỏi appliedPromotion
    store.setAvailablePromotions(samplePromotions);
    expect(useCartStore.getState().appliedPromotion).toBeNull();

    // Khi danh sách mã từ API trống -> báo lỗi rõ ràng
    store.setAvailablePromotions([]);
    const emptyCatalogRes = store.applyPromotion('BREWLITE10');
    expect(emptyCatalogRes.ok).toBe(false);
  });
});
