import { describe, expect, it } from 'vitest';
import {
  calculateEarnedPoints,
  canCancelOrder,
  filterOrdersByTab,
  formatOrderCode,
  formatPaymentMethod,
  getItemBaseLinePrice,
  getOrderStepIndex,
  getShortPickupCode,
  getStatusDisplayMeta,
} from './orders';
import { OrderRecord } from '@/types/order';

const baseOrder: OrderRecord = {
  orderId: 'BL-8921',
  userId: 'user-1',
  status: 'PREPARING',
  totalAmount: 64000,
  discountAmount: 0,
  pointsRedeemed: 0,
  createdAt: '2026-11-18T02:41:00.000Z',
  items: [],
};

describe('Order History & Receipt helpers (FR-07 & FR-08)', () => {
  it('formats custom BL codes and UUIDs deterministically', () => {
    expect(formatOrderCode('BL-8921')).toBe('BL-8921');
    expect(getShortPickupCode('BL-8921')).toBe('#8921');

    const uuidCodeA = formatOrderCode('550e8400-e29b-41d4-a716-446655440000');
    const uuidCodeB = formatOrderCode('550e8400-e29b-41d4-a716-446655440000');
    expect(uuidCodeA).toMatch(/^BL-\d{4}$/);
    expect(uuidCodeA).toBe(uuidCodeB);
  });

  it('maps OrderStatus accurately to 5-step OrderStatusStepper index', () => {
    expect(getOrderStepIndex('PENDING')).toBe(0);
    expect(getOrderStepIndex('PAID')).toBe(1);
    expect(getOrderStepIndex('PREPARING')).toBe(2);
    expect(getOrderStepIndex('READY')).toBe(3);
    expect(getOrderStepIndex('COMPLETED')).toBe(4);
    expect(getOrderStepIndex('CANCELLED')).toBe(-1);
    expect(getOrderStepIndex('PAYMENT_FAILED')).toBe(-1);
  });

  it('calculates earned loyalty points from transaction or totalAmount / 10,000', () => {
    expect(calculateEarnedPoints(baseOrder)).toBe(6);
    expect(
      calculateEarnedPoints({
        ...baseOrder,
        loyaltyTransactions: [
          { transactionId: 'tx-1', type: 'EARN', pointsAmount: 12 },
        ],
      }),
    ).toBe(12);
    expect(
      calculateEarnedPoints({ ...baseOrder, status: 'CANCELLED' }),
    ).toBe(0);
  });

  it('allows cancelling when status is PENDING, PAID, or PAYMENT_FAILED (FR-12 & State Machine)', () => {
    expect(canCancelOrder('PENDING')).toBe(true);
    expect(canCancelOrder('PAID')).toBe(true);
    expect(canCancelOrder('PAYMENT_FAILED')).toBe(true);
    expect(canCancelOrder('PREPARING')).toBe(false);
    expect(canCancelOrder('READY')).toBe(false);
    expect(canCancelOrder('COMPLETED')).toBe(false);
    expect(canCancelOrder('CANCELLED')).toBe(false);
  });

  it('separates base line price from toppings accurately', () => {
    expect(
      getItemBaseLinePrice(55000, 1, [{ price: 7000 }, { price: 10000 }]),
    ).toBe(38000);
    expect(
      getItemBaseLinePrice(55000, 2, [{ price: 7000 }, { price: 10000 }]),
    ).toBe(76000);
  });

  it('filters orders cleanly by tab and returns Figma status metadata', () => {
    const orders: OrderRecord[] = [
      { ...baseOrder, orderId: 'BL-1', status: 'PENDING' },
      { ...baseOrder, orderId: 'BL-2', status: 'PREPARING' },
      { ...baseOrder, orderId: 'BL-3', status: 'COMPLETED' },
      { ...baseOrder, orderId: 'BL-4', status: 'CANCELLED' },
    ];

    expect(filterOrdersByTab(orders, 'ALL')).toHaveLength(4);
    expect(filterOrdersByTab(orders, 'ACTIVE')).toHaveLength(2);
    expect(filterOrdersByTab(orders, 'COMPLETED')).toHaveLength(1);
    expect(filterOrdersByTab(orders, 'CANCELLED')).toHaveLength(1);

    const paidMeta = getStatusDisplayMeta('PAID');
    expect(paidMeta.bannerTitle).toBe('Đã thanh toán thành công!');
    expect(paidMeta.cancelHint).toBe('Bạn có thể hủy đơn trước khi quầy bắt đầu pha chế.');

    const preparingMeta = getStatusDisplayMeta('PREPARING');
    expect(preparingMeta.bannerTitle).toBe('Quầy đang chuẩn bị món!');
    expect(preparingMeta.cancelHint).toBe('Đơn đang pha chế, không thể hủy.');
    expect(formatPaymentMethod('VNPAY')).toBe('Cổng VNPay (Sandbox)');
  });
});
