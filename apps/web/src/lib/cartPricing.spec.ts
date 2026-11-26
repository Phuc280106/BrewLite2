import { describe, expect, it } from 'vitest';
import {
  calculateItemUnitPrice,
  calculateItemLineTotal,
  calculatePromotionDiscount,
  calculateCartTotals,
  formatVND,
  findPromotionByCode,
  buildCartItemId,
  isItemAvailable,
} from './cartPricing';
import { CartItem, PromotionRule } from '@/types/cart';
import { Topping } from '@/types';

describe('cartPricing logic', () => {
  describe('calculateItemUnitPrice', () => {
    it('tính đơn giá đúng chuẩn: base + size + toppings', () => {
      const toppings: Topping[] = [
        { toppingId: 't1', name: 'Trân châu', price: 5000 },
        { toppingId: 't2', name: 'Thạch', price: 7000 },
      ];
      const unitPrice = calculateItemUnitPrice(35000, 5000, toppings);
      expect(unitPrice).toBe(52000);
    });

    it('xử lý giá trị null/undefined an toàn không gây crash', () => {
      expect(calculateItemUnitPrice(null, undefined, [])).toBe(0);
    });
  });

  describe('calculateItemLineTotal', () => {
    it('tính thành tiền dòng = unitPrice * quantity', () => {
      expect(calculateItemLineTotal({ unitPrice: 30000, quantity: 3 })).toBe(90000);
      expect(calculateItemLineTotal({ unitPrice: 30000, quantity: 0 })).toBe(30000); // Tối thiểu 1
    });
  });

  describe('buildCartItemId', () => {
    it('sinh cùng cartItemId khi các thuộc tính giống nhau', () => {
      const toppings: Topping[] = [
        { toppingId: 't2', name: 'Thạch', price: 7000 },
        { toppingId: 't1', name: 'Trân châu', price: 5000 },
      ];
      const id1 = buildCartItemId({
        productId: 'p1',
        sizeId: 's1',
        sugar: '50%',
        ice: '100% đá',
        toppings,
        note: 'Ít ngọt',
      });
      const id2 = buildCartItemId({
        productId: 'p1',
        sizeId: 's1',
        sugar: '50%',
        ice: '100% đá',
        toppings: [toppings[1], toppings[0]], // khác thứ tự mảng topping
        note: '  ít ngọt  ',
      });
      expect(id1).toBe(id2);
    });
  });

  describe('calculatePromotionDiscount', () => {
    const percentPromo: PromotionRule = {
      promotionCode: 'BREWLITE10',
      description: 'Giảm 10%',
      minimumOrderAmount: 50000,
      discountAmount: 0,
      discountPercentage: 10,
    };

    const fixedPromo: PromotionRule = {
      promotionCode: 'GIAM15K',
      description: 'Giảm 15k',
      minimumOrderAmount: 80000,
      discountAmount: 15000,
      discountPercentage: 0,
    };

    it('không giảm giá nếu chưa đạt giá trị đơn tối thiểu', () => {
      expect(calculatePromotionDiscount(40000, percentPromo)).toBe(0);
      expect(calculatePromotionDiscount(70000, fixedPromo)).toBe(0);
    });

    it('tính giảm giá theo % khi đạt điều kiện tối thiểu', () => {
      expect(calculatePromotionDiscount(60000, percentPromo)).toBe(6000);
    });

    it('tính giảm giá cố định khi đạt điều kiện tối thiểu', () => {
      expect(calculatePromotionDiscount(100000, fixedPromo)).toBe(15000);
    });
  });

  describe('calculateCartTotals', () => {
    it('tính toán tổng giỏ hàng, điểm thưởng và khuyến mãi chính xác', () => {
      const items: CartItem[] = [
        {
          cartItemId: 'item-1',
          productId: 'p1',
          productName: 'Trà Sữa',
          unitPrice: 40000,
          quantity: 2,
          sizeId: 's1',
          sizeName: 'Size M',
          sugar: '50%',
          ice: '50% đá',
          toppings: [],
        },
      ];

      const totals = calculateCartTotals({
        items,
        appliedPromotion: {
          promotionCode: 'BREWLITE10',
          description: '',
          minimumOrderAmount: 50000,
          discountAmount: 0,
          discountPercentage: 10,
        },
        pointsRedeemed: 10, // 10 điểm * 1.000đ = 10.000đ
      });

      expect(totals.totalItems).toBe(2);
      expect(totals.subtotal).toBe(80000);
      expect(totals.promotionDiscount).toBe(8000); // 10% của 80.000
      expect(totals.loyaltyDiscount).toBe(10000);
      expect(totals.totalDiscount).toBe(18000);
      expect(totals.grandTotal).toBe(62000);
    });
  });

  describe('isItemAvailable', () => {
    it('trả về true khi món và size đều còn hàng', () => {
      expect(isItemAvailable({ isAvailable: true })).toBe(true);
      expect(
        isItemAvailable({
          product: { isAvailable: true },
          size: { isAvailable: true },
        }),
      ).toBe(true);
    });

    it('trả về false khi món hoặc size bị hết hàng (isAvailable = false)', () => {
      expect(isItemAvailable({ isAvailable: false })).toBe(false);
      expect(
        isItemAvailable({
          product: { isAvailable: false },
          size: { isAvailable: true },
        }),
      ).toBe(false);
      expect(
        isItemAvailable({
          product: { isAvailable: true },
          size: { isAvailable: false },
        }),
      ).toBe(false);
    });
  });

  describe('formatVND', () => {
    it('định dạng tiền tệ chuẩn vi-VN', () => {
      expect(formatVND(50000)).toBe('50.000đ');
      expect(formatVND(0)).toBe('0đ');
    });
  });
});
