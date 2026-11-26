import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;

  const mockTx = {
    user: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    ingredient: {
      update: jest.fn(),
    },
    topping: {
      update: jest.fn(),
    },
    promotion: {
      findUnique: jest.fn(),
    },
    loyalty: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    loyaltyTransaction: {
      create: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  };

  const mockPrisma = {
    $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) =>
      callback(mockTx),
    ),
  };

  const sampleProduct = {
    productId: 'prod-1',
    name: 'Trà Sữa Oolong Nướng',
    basePrice: 38000,
    sizes: [{ sizeId: 'size-l', name: 'L (Lớn)', priceAdjustment: 8000 }],
    toppings: [{ toppingId: 'top-1', name: 'Trân châu đen', price: 5000 }],
    recipeItems: [
      { sizeId: 'size-l', ingredientId: 'ing-oolong', requiredAmount: 22 },
      { sizeId: 'size-l', ingredientId: 'ing-milk', requiredAmount: 250 },
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

  it('should create order, lock & deduct stock, and calculate server-side total', async () => {
    mockTx.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    mockTx.product.findMany.mockResolvedValue([sampleProduct]);
    mockTx.$queryRaw.mockImplementation(async (query: any) => {
      const sqlText = query?.strings ? query.strings.join(' ') : String(query);
      if (sqlText.includes('from toppings') || sqlText.includes('FROM toppings')) {
        return [
          { topping_id: 'top-1', name: 'Trân châu đen', stock: 100 },
        ];
      }
      return [
        { ingredient_id: 'ing-milk', name: 'Sữa tươi', stock: 5000 },
        { ingredient_id: 'ing-oolong', name: 'Trà Oolong', stock: 500 },
      ];
    });
    mockTx.order.create.mockResolvedValue({
      orderId: 'order-1',
      status: OrderStatus.PENDING,
      totalAmount: 102000,
      discountAmount: 0,
    });

    const result = await service.createOrder('user-1', {
      pickupMethod: 'DINE_IN',
      items: [
        {
          productId: 'prod-1',
          sizeId: 'size-l',
          quantity: 2,
          toppingIds: ['top-1'],
          sugarLevel: '50%',
          iceLevel: 'Ít đá',
          note: '  Không ống hút  ',
        },
      ],
    });

    // (38000 + 8000 + 5000) * 2 = 102000
    expect(mockTx.ingredient.update).toHaveBeenCalledTimes(2);
    expect(mockTx.ingredient.update).toHaveBeenCalledWith({
      where: { ingredientId: 'ing-milk' },
      data: { stock: { decrement: 500 }, version: { increment: 1 } },
    });
    expect(mockTx.ingredient.update).toHaveBeenCalledWith({
      where: { ingredientId: 'ing-oolong' },
      data: { stock: { decrement: 44 }, version: { increment: 1 } },
    });
    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          status: OrderStatus.PENDING,
          pickupMethod: 'DINE_IN',
          totalAmount: 102000,
          discountAmount: 0,
          items: {
            create: [
              expect.objectContaining({
                sugarLevel: '50%',
                iceLevel: 'Ít đá',
                note: 'Không ống hút',
              }),
            ],
          },
        }),
      }),
    );
    expect(result.orderId).toBe('order-1');
  });

  it('should throw ConflictException and not create order when ingredient stock is insufficient', async () => {
    mockTx.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    mockTx.product.findMany.mockResolvedValue([sampleProduct]);
    mockTx.$queryRaw.mockResolvedValue([
      { ingredient_id: 'ing-milk', name: 'Sữa tươi', stock: 100 },
      { ingredient_id: 'ing-oolong', name: 'Trà Oolong', stock: 500 },
    ]);

    await expect(
      service.createOrder('user-1', {
        items: [{ productId: 'prod-1', sizeId: 'size-l', quantity: 2 }],
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockTx.ingredient.update).not.toHaveBeenCalled();
    expect(mockTx.order.create).not.toHaveBeenCalled();
  });

  it('should apply valid promotion code and loyalty points redemption', async () => {
    mockTx.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    mockTx.product.findMany.mockResolvedValue([sampleProduct]);
    mockTx.$queryRaw.mockImplementation(async (query: any) => {
      const sqlText = query?.strings ? query.strings.join(' ') : String(query);
      if (sqlText.includes('from toppings') || sqlText.includes('FROM toppings')) {
        return [
          { topping_id: 'top-1', name: 'Trân châu đen', stock: 100 },
        ];
      }
      return [
        { ingredient_id: 'ing-milk', name: 'Sữa tươi', stock: 5000 },
        { ingredient_id: 'ing-oolong', name: 'Trà Oolong', stock: 500 },
      ];
    });
    mockTx.promotion.findUnique.mockResolvedValue({
      promotionId: 'promo-1',
      promotionCode: 'BREWLITE10',
      minimumOrderAmount: 50000,
      discountAmount: 0,
      discountPercentage: 10,
    });
    mockTx.loyalty.findUnique.mockResolvedValue({
      loyaltyId: 'loy-1',
      userId: 'user-1',
      points: 120,
    });
    mockTx.order.create.mockResolvedValue({
      orderId: 'order-2',
      status: OrderStatus.PENDING,
      totalAmount: 81800,
      discountAmount: 20200,
    });

    await service.createOrder('user-1', {
      items: [
        {
          productId: 'prod-1',
          sizeId: 'size-l',
          quantity: 2,
          toppingIds: ['top-1'],
        },
      ],
      promotionCode: 'BREWLITE10',
      pointsToRedeem: 10,
    });

    // subtotal = 102000; promo 10% = 10200; loyalty 10 pts * 1000 = 10000; totalDiscount = 20200; total = 81800
    expect(mockTx.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          promotionId: 'promo-1',
          totalAmount: 81800,
          discountAmount: 20200,
          pointsRedeemed: 10,
        }),
      }),
    );
    expect(mockTx.loyalty.update).toHaveBeenCalledWith({
      where: { loyaltyId: 'loy-1' },
      data: { points: { decrement: 10 } },
    });
    expect(mockTx.loyaltyTransaction.create).toHaveBeenCalledTimes(1);
  });

  it('should throw BadRequestException when subtotal is below promotion minimumOrderAmount', async () => {
    mockTx.user.findUnique.mockResolvedValue({ userId: 'user-1' });
    mockTx.product.findMany.mockResolvedValue([sampleProduct]);
    mockTx.$queryRaw.mockImplementation(async (query: any) => {
      const sqlText = query?.strings ? query.strings.join(' ') : String(query);
      if (sqlText.includes('from toppings') || sqlText.includes('FROM toppings')) {
        return [
          { topping_id: 'top-1', name: 'Trân châu đen', stock: 100 },
        ];
      }
      return [
        { ingredient_id: 'ing-milk', name: 'Sữa tươi', stock: 5000 },
        { ingredient_id: 'ing-oolong', name: 'Trà Oolong', stock: 500 },
      ];
    });
    mockTx.promotion.findUnique.mockResolvedValue({
      promotionId: 'promo-2',
      promotionCode: 'GIAM15K',
      minimumOrderAmount: 80000,
      discountAmount: 15000,
      discountPercentage: 0,
    });

    await expect(
      service.createOrder('user-1', {
        items: [{ productId: 'prod-1', sizeId: 'size-l', quantity: 1 }],
        promotionCode: 'GIAM15K',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockTx.order.create).not.toHaveBeenCalled();
  });
});
