import { Test } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService.cancelExpiredOrders', () => {
  let service: OrdersService;

  const mockTx = {
    order: { updateMany: jest.fn(), findUniqueOrThrow: jest.fn() },
    recipeItems: { findMany: jest.fn() },
    ingredient: { update: jest.fn() },
  };
  const mockPrisma = {
    order: { findMany: jest.fn() },
    $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get(OrdersService);
  });

  it('hủy đơn quá hạn: chuyển CANCELLED và hoàn đúng lượng nguyên liệu', async () => {
    mockPrisma.order.findMany.mockResolvedValue([{ orderId: 'o1' }]);
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });
    mockTx.order.findUniqueOrThrow.mockResolvedValue({
      orderId: 'o1',
      items: [{ productId: 'p1', sizeId: 's1', quantity: 2 }],
    });
    mockTx.recipeItems.findMany.mockResolvedValue([
      { ingredientId: 'ing-milk', requiredAmount: 250 },
    ]);

    const cancelled = await service.cancelExpiredOrders();

    expect(cancelled).toBe(1);
    expect(mockTx.order.updateMany).toHaveBeenCalledWith({
      where: {
        orderId: 'o1',
        status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
      },
      data: { status: OrderStatus.CANCELLED },
    });
    expect(mockTx.ingredient.update).toHaveBeenCalledWith({
      where: { ingredientId: 'ing-milk' },
      data: { stock: { increment: 500 }, version: { increment: 1 } },
    });
  });

  it('đơn vừa được thanh toán (không còn PENDING): bỏ qua, không hoàn kho', async () => {
    mockPrisma.order.findMany.mockResolvedValue([{ orderId: 'o1' }]);
    mockTx.order.updateMany.mockResolvedValue({ count: 0 });

    expect(await service.cancelExpiredOrders()).toBe(0);
    expect(mockTx.ingredient.update).not.toHaveBeenCalled();
  });
});
