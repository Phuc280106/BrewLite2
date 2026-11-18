import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService (FR-07 & FR-08: Order History, Receipt & Cancel)', () => {
  let service: OrdersService;

  const mockTx = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ingredient: {
      update: jest.fn(),
    },
  };

  const mockPrisma = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx),
    ),
  };

  const sampleOrder = {
    orderId: 'order-8921',
    userId: 'user-1',
    status: OrderStatus.PREPARING,
    totalAmount: 64000,
    discountAmount: 0,
    pointsRedeemed: 0,
    createdAt: new Date('2026-11-18T02:41:00.000Z'),
    items: [
      {
        orderItemId: 'oi-1',
        orderId: 'order-8921',
        productId: 'prod-1',
        sizeId: 'size-m',
        productName: 'Trà Sữa Oolong Nướng',
        unitPrice: 55000,
        quantity: 1,
        size: { sizeId: 'size-m', name: 'M', priceAdjustment: 0 },
        toppings: [
          { toppingId: 'top-1', name: 'Trân châu hoàng kim', price: 7000 },
          { toppingId: 'top-2', name: 'Kem Cheese Macchiato', price: 10000 },
        ],
        product: { productId: 'prod-1', imageUrl: null },
      },
    ],
    promotion: null,
    payments: [
      {
        paymentId: 'pay-1',
        paymentMethod: 'MOCK_WALLET',
        status: 'SUCCESS',
        amount: 64000,
      },
    ],
    loyaltyTransactions: [
      {
        transactionId: 'lt-1',
        type: 'EARN',
        pointsAmount: 6,
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('findMyOrders (FR-08)', () => {
    it('should return orders owned by current user sorted by createdAt desc', async () => {
      mockPrisma.order.findMany.mockResolvedValue([sampleOrder]);

      const result = await service.findMyOrders('user-1');

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0].orderId).toBe('order-8921');
    });

    it('should throw UnauthorizedException when authUserId is empty', async () => {
      await expect(service.findMyOrders('')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockPrisma.order.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOneForUser (FR-07)', () => {
    it('should return order receipt when requested by the owner', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.findOneForUser('order-8921', 'user-1', 'CUSTOMER');

      expect(result.orderId).toBe('order-8921');
      expect(result.items[0].productName).toBe('Trà Sữa Oolong Nướng');
    });

    it('should allow BARISTA role to view any customer order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(sampleOrder);

      const result = await service.findOneForUser('order-8921', 'barista-1', 'BARISTA');

      expect(result.orderId).toBe('order-8921');
    });

    it('should throw ForbiddenException when another customer tries to view the order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(sampleOrder);

      await expect(
        service.findOneForUser('order-8921', 'user-2', 'CUSTOMER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findOneForUser('missing-order', 'user-1', 'CUSTOMER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelMyOrder (FR-12)', () => {
    it('should cancel a PENDING order and refund ingredient stock', async () => {
      mockTx.order.findUnique.mockResolvedValue({
        orderId: 'order-pending',
        userId: 'user-1',
        status: OrderStatus.PENDING,
        items: [
          {
            sizeId: 'size-m',
            quantity: 2,
            product: {
              recipeItems: [
                { sizeId: 'size-m', ingredientId: 'ing-oolong', requiredAmount: 15 },
                { sizeId: 'size-l', ingredientId: 'ing-oolong', requiredAmount: 22 },
              ],
            },
          },
        ],
      });
      mockTx.order.update.mockResolvedValue({
        ...sampleOrder,
        orderId: 'order-pending',
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelMyOrder('order-pending', 'user-1');

      expect(mockTx.ingredient.update).toHaveBeenCalledWith({
        where: { ingredientId: 'ing-oolong' },
        data: { stock: { increment: 30 }, version: { increment: 1 } },
      });
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 'order-pending' },
          data: { status: OrderStatus.CANCELLED },
        }),
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should reject cancelling an order already in PREPARING status', async () => {
      mockTx.order.findUnique.mockResolvedValue({
        orderId: 'order-8921',
        userId: 'user-1',
        status: OrderStatus.PREPARING,
        items: [],
      });

      await expect(service.cancelMyOrder('order-8921', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockTx.order.update).not.toHaveBeenCalled();
    });
  });
});
