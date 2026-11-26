import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';

jest.mock('@nestjs/jwt', () => ({
  JwtService: class MockJwtService {},
}));

import { PrismaService } from '../prisma/prisma.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { assertTransition } from './order-state-machine';

describe('Order State Machine & Status Updates (Tuấn Thành - Module 6)', () => {
  describe('assertTransition (State Machine Rules)', () => {
    describe('Valid Transitions', () => {
      it('should allow PAID -> PREPARING (Barista nhận đơn)', () => {
        expect(() =>
          assertTransition(OrderStatus.PAID, OrderStatus.PREPARING),
        ).not.toThrow();
      });

      it('should allow PREPARING -> READY (Pha xong)', () => {
        expect(() =>
          assertTransition(OrderStatus.PREPARING, OrderStatus.READY),
        ).not.toThrow();
      });

      it('should allow READY -> COMPLETED (Đã giao khách)', () => {
        expect(() =>
          assertTransition(OrderStatus.READY, OrderStatus.COMPLETED),
        ).not.toThrow();
      });

      it('should allow PENDING -> CANCELLED (Hủy đơn & hoàn kho)', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.CANCELLED),
        ).not.toThrow();
      });

      it('should allow PAID -> CANCELLED (Hủy đơn & hoàn kho trước pha chế)', () => {
        expect(() =>
          assertTransition(OrderStatus.PAID, OrderStatus.CANCELLED),
        ).not.toThrow();
      });

      it('should allow PAYMENT_FAILED -> CANCELLED (Hủy đơn & hoàn kho khi lỗi thanh toán)', () => {
        expect(() =>
          assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED),
        ).not.toThrow();
      });

      it('should allow PAYMENT_FAILED -> PENDING (Thử thanh toán lại)', () => {
        expect(() =>
          assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING),
        ).not.toThrow();
      });

      it('should allow PENDING -> PAID (Khách thanh toán thành công)', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.PAID),
        ).not.toThrow();
      });

      it('should allow PENDING -> PAYMENT_FAILED (Thanh toán thất bại)', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED),
        ).not.toThrow();
      });
    });

    describe('Invalid Transitions (Must throw 400 BadRequestException)', () => {
      it('should reject jumping states: PENDING -> COMPLETED', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
        ).toThrow(BadRequestException);
      });

      it('should reject jumping states: PENDING -> READY', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.READY),
        ).toThrow(BadRequestException);
      });

      it('should reject starting prep before payment: PENDING -> PREPARING', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.PREPARING),
        ).toThrow(BadRequestException);
      });

      it('should reject backward transitions: PREPARING -> PAID', () => {
        expect(() =>
          assertTransition(OrderStatus.PREPARING, OrderStatus.PAID),
        ).toThrow(BadRequestException);
      });

      it('should reject backward transitions: READY -> PREPARING', () => {
        expect(() =>
          assertTransition(OrderStatus.READY, OrderStatus.PREPARING),
        ).toThrow(BadRequestException);
      });

      it('should reject cancelling completed orders: COMPLETED -> CANCELLED', () => {
        expect(() =>
          assertTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
        ).toThrow(BadRequestException);
      });

      it('should reject reviving cancelled orders: CANCELLED -> PREPARING', () => {
        expect(() =>
          assertTransition(OrderStatus.CANCELLED, OrderStatus.PREPARING),
        ).toThrow(BadRequestException);
      });

      it('should reject advancing failed payments to prep: PAYMENT_FAILED -> PREPARING', () => {
        expect(() =>
          assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PREPARING),
        ).toThrow(BadRequestException);
      });

      it('should include meaningful message with valid next states in BadRequestException', () => {
        expect(() =>
          assertTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
        ).toThrow(
          expect.objectContaining({
            message: expect.stringContaining(
              'Chuyển trạng thái đơn hàng không hợp lệ',
            ),
          }),
        );
      });
    });
  });

  describe('OrdersService.updateOrderStatus', () => {
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
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) =>
        callback(mockTx),
      ),
    };

    const sampleOrder = {
      orderId: 'order-101',
      userId: 'customer-1',
      status: OrderStatus.PAID,
      items: [
        {
          orderItemId: 'oi-1',
          productId: 'prod-1',
          sizeId: 'size-m',
          quantity: 2,
          product: {
            recipeItems: [
              {
                sizeId: 'size-m',
                ingredientId: 'ing-tea',
                requiredAmount: 10,
              },
            ],
          },
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

    it('should successfully transition PAID -> PREPARING when called by BARISTA staff', async () => {
      mockTx.order.findUnique.mockResolvedValue(sampleOrder);
      mockTx.order.update.mockResolvedValue({
        ...sampleOrder,
        status: OrderStatus.PREPARING,
      });

      const result = await service.updateOrderStatus(
        'order-101',
        OrderStatus.PREPARING,
        'barista-user',
        'BARISTA',
      );

      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 'order-101' },
          data: { status: OrderStatus.PREPARING },
        }),
      );
      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('should reject invalid transition PREPARING -> PAID with 400 BadRequestException', async () => {
      mockTx.order.findUnique.mockResolvedValue({
        ...sampleOrder,
        status: OrderStatus.PREPARING,
      });

      await expect(
        service.updateOrderStatus(
          'order-101',
          OrderStatus.PAID,
          'barista-user',
          'BARISTA',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockTx.order.update).not.toHaveBeenCalled();
    });

    it('should forbid customer from advancing order to PREPARING', async () => {
      mockTx.order.findUnique.mockResolvedValue(sampleOrder);

      await expect(
        service.updateOrderStatus(
          'order-101',
          OrderStatus.PREPARING,
          'customer-1',
          'CUSTOMER',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockTx.order.update).not.toHaveBeenCalled();
    });

    it('should forbid customer from cancelling their own PAID order', async () => {
      mockTx.order.findUnique.mockResolvedValue(sampleOrder);

      await expect(
        service.updateOrderStatus(
          'order-101',
          OrderStatus.CANCELLED,
          'customer-1',
          'CUSTOMER',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockTx.order.update).not.toHaveBeenCalled();
    });

    it('should allow BARISTA to cancel a PAID order and refund ingredients', async () => {
      mockTx.order.findUnique.mockResolvedValue(sampleOrder);
      mockTx.order.update.mockResolvedValue({
        ...sampleOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.updateOrderStatus(
        'order-101',
        OrderStatus.CANCELLED,
        'barista-1',
        'BARISTA',
      );

      expect(mockTx.ingredient.update).toHaveBeenCalledWith({
        where: { ingredientId: 'ing-tea' },
        data: { stock: { increment: 20 }, version: { increment: 1 } },
      });
      expect(mockTx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 'order-101' },
          data: { status: OrderStatus.CANCELLED },
        }),
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should allow customer to cancel their own PENDING or PAYMENT_FAILED order and refund ingredients', async () => {
      const pendingOrder = { ...sampleOrder, status: OrderStatus.PAYMENT_FAILED };
      mockTx.order.findUnique.mockResolvedValue(pendingOrder);
      mockTx.order.update.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.updateOrderStatus(
        'order-101',
        OrderStatus.CANCELLED,
        'customer-1',
        'CUSTOMER',
      );

      expect(mockTx.ingredient.update).toHaveBeenCalledWith({
        where: { ingredientId: 'ing-tea' },
        data: { stock: { increment: 20 }, version: { increment: 1 } },
      });
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should forbid user from updating someone else order', async () => {
      mockTx.order.findUnique.mockResolvedValue(sampleOrder);

      await expect(
        service.updateOrderStatus(
          'order-101',
          OrderStatus.CANCELLED,
          'other-customer',
          'CUSTOMER',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockTx.order.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockTx.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(
          'non-existent-order',
          OrderStatus.PREPARING,
          'barista-1',
          'BARISTA',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('OrdersController.updateOrderStatus', () => {
    let controller: OrdersController;

    const mockOrdersService = {
      updateOrderStatus: jest.fn(),
      cancelMyOrder: jest.fn(),
      createOrder: jest.fn(),
      findMyOrders: jest.fn(),
      findOneForUser: jest.fn(),
    };

    beforeEach(() => {
      controller = new OrdersController(mockOrdersService as unknown as OrdersService);
      jest.clearAllMocks();
    });

    it('should call ordersService.updateOrderStatus with id, status, userId, and role', async () => {
      mockOrdersService.updateOrderStatus.mockResolvedValue({
        orderId: 'order-1',
        status: OrderStatus.READY,
      });

      const user = { userId: 'staff-1', role: 'BARISTA' };
      const dto = { status: OrderStatus.READY };

      const result = await controller.updateOrderStatus('order-1', user, dto);

      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith(
        'order-1',
        OrderStatus.READY,
        'staff-1',
        'BARISTA',
      );
      expect(result).toEqual({ orderId: 'order-1', status: OrderStatus.READY });
    });
  });
});
