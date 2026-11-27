import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, PaymentStatus } from '@prisma/client';

jest.mock('@nestjs/jwt', () => {
  class MockJwtService {
    async signAsync(payload: Record<string, unknown>) {
      return Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    }
    async verifyAsync(token: string) {
      return JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
    }
  }
  class MockJwtModule {
    static register() {
      return {
        module: MockJwtModule,
        providers: [MockJwtService],
        exports: [MockJwtService],
      };
    }
  }

  return {
    JwtService: MockJwtService,
    JwtModule: MockJwtModule,
  };
});

import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { VnpayService } from '../payments/vnpay.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersModule } from './orders.module';

describe('Orders & Payments (HTTP Integration)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let accessToken: string;

  const USER_ID = '11111111-1111-4111-8111-111111111111';
  const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';
  const SIZE_ID = '33333333-3333-4333-8333-333333333333';
  const TOPPING_ID = '44444444-4444-4444-8444-444444444444';
  const ORDER_ID = '55555555-5555-4555-8555-555555555555';
  const PAYMENT_ID = '66666666-6666-4666-8666-666666666666';

  const sampleProduct = {
    productId: PRODUCT_ID,
    name: 'Trà Sữa Oolong Nướng',
    basePrice: 38000,
    sizes: [{ sizeId: SIZE_ID, name: 'L (Lớn)', priceAdjustment: 8000 }],
    toppings: [{ toppingId: TOPPING_ID, name: 'Trân châu đen', price: 5000 }],
    recipeItems: [
      { sizeId: SIZE_ID, ingredientId: 'ing-oolong', requiredAmount: 22 },
      { sizeId: SIZE_ID, ingredientId: 'ing-milk', requiredAmount: 250 },
    ],
  };

  let ordersDb: Map<string, any>;
  let paymentsDb: Map<string, any>;
  let loyaltyPointsDb: number;
  let ingredientStocks: Record<string, number>;
  let toppingStock: number;

  const createInMemoryTx = () => ({
    user: {
      findUnique: jest.fn(({ where }: { where: { userId: string } }) =>
        Promise.resolve(where.userId === USER_ID ? { userId: USER_ID } : null),
      ),
    },
    product: {
      findMany: jest.fn().mockResolvedValue([sampleProduct]),
    },
    $queryRaw: jest.fn(async (query: any) => {
      const sql = query?.strings ? query.strings.join(' ') : String(query);
      if (sql.toLowerCase().includes('from toppings')) {
        return [{ topping_id: TOPPING_ID, name: 'Trân châu đen', stock: toppingStock }];
      }
      return [
        { ingredient_id: 'ing-milk', name: 'Sữa tươi', stock: ingredientStocks['ing-milk'] },
        { ingredient_id: 'ing-oolong', name: 'Trà Oolong', stock: ingredientStocks['ing-oolong'] },
      ];
    }),
    ingredient: {
      update: jest.fn(({ where, data }: any) => {
        const dec = data?.stock?.decrement ?? 0;
        ingredientStocks[where.ingredientId] -= dec;
        return Promise.resolve({ ingredientId: where.ingredientId });
      }),
    },
    topping: {
      update: jest.fn(({ data }: any) => {
        const dec = data?.stock?.decrement ?? 0;
        toppingStock -= dec;
        return Promise.resolve({ toppingId: TOPPING_ID });
      }),
    },
    promotion: { findUnique: jest.fn().mockResolvedValue(null) },
    loyalty: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(({ update }: any) => {
        const inc = update?.points?.increment ?? 0;
        loyaltyPointsDb += inc;
        return Promise.resolve({ loyaltyId: 'loy-1', userId: USER_ID, points: loyaltyPointsDb });
      }),
    },
    loyaltyTransaction: {
      create: jest.fn(({ data }: any) => Promise.resolve({ id: 'lt-1', ...data })),
    },
    order: {
      create: jest.fn(({ data }: any) => {
        const order = {
          orderId: ORDER_ID,
          ...data,
          createdAt: new Date(),
          items: data.items?.create ?? [],
        };
        ordersDb.set(ORDER_ID, order);
        return Promise.resolve(order);
      }),
      updateMany: jest.fn(({ where, data }: any) => {
        const existing = ordersDb.get(where.orderId);
        const statusOk =
          !where.status ||
          (typeof where.status === 'string' && existing?.status === where.status) ||
          (Array.isArray(where.status?.in) && where.status.in.includes(existing?.status));
        if (!existing || !statusOk) {
          return Promise.resolve({ count: 0 });
        }
        ordersDb.set(where.orderId, { ...existing, ...data });
        return Promise.resolve({ count: 1 });
      }),
    },
    payment: {
      create: jest.fn(({ data }: any) => {
        const payment = {
          paymentId: PAYMENT_ID,
          ...data,
          createdAt: new Date(),
        };
        paymentsDb.set(data.idempotencyKey, payment);
        return Promise.resolve(payment);
      }),
    },
  });

  const mockPrisma = {
    $transaction: jest.fn((cb: (tx: any) => unknown) => cb(createInMemoryTx())),
    order: {
      findUnique: jest.fn(({ where }: { where: { orderId: string } }) =>
        Promise.resolve(ordersDb.get(where.orderId) ?? null),
      ),
    },
    payment: {
      findFirst: jest.fn(({ where }: { where: { idempotencyKey: string } }) => {
        const payment = paymentsDb.get(where.idempotencyKey);
        if (!payment) return Promise.resolve(null);
        const order = ordersDb.get(payment.orderId);
        return Promise.resolve({
          ...payment,
          order: {
            status: order?.status ?? OrderStatus.PAID,
            loyaltyTransactions:
              payment.status === PaymentStatus.SUCCESS
                ? [{ pointsAmount: Math.floor(Number(payment.amount) / 10000) }]
                : [],
          },
        });
      }),
    },
  };

  const mockVnpayService = {
    createPaymentUrl: jest.fn(
      ({ orderId, amount }: { orderId: string; amount: number }) =>
        `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${orderId}_1700000000000&vnp_Amount=${amount * 100}&vnp_SecureHash=valid_hash`,
    ),
    verifyReturn: jest.fn((query: Record<string, string>) => {
      const isValid = query.vnp_SecureHash === 'valid_hash';
      const txnRef = query.vnp_TxnRef || '';
      const responseCode = query.vnp_ResponseCode || '';
      const isSuccess = isValid && responseCode === '00';
      return {
        isValid,
        isSuccess,
        txnRef,
        orderId: txnRef.split('_')[0] || '',
        amount: Number(query.vnp_Amount || 0) / 100,
        transactionNo: query.vnp_TransactionNo || '14000001',
        responseCode,
        message: isSuccess ? 'Giao dịch VNPay thành công' : 'Giao dịch thất bại',
      };
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, AuthModule, OrdersModule, PaymentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(VnpayService)
      .useValue(mockVnpayService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.listen(0, '127.0.0.1');
    const address = app.getHttpServer().address() as { port: number };
    baseUrl = `http://127.0.0.1:${address.port}/api/v1`;

    const jwtService = moduleFixture.get(JwtService);
    accessToken = await jwtService.signAsync({
      sub: USER_ID,
      userId: USER_ID,
      role: 'CUSTOMER',
    });
  });

  beforeEach(() => {
    ordersDb = new Map();
    paymentsDb = new Map();
    loyaltyPointsDb = 0;
    ingredientStocks = { 'ing-milk': 5000, 'ing-oolong': 500 };
    toppingStock = 100;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('từ chối tạo đơn (401) khi thiếu JWT token', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: PRODUCT_ID, sizeId: SIZE_ID, quantity: 1 }],
      }),
    });

    expect(res.status).toBe(401);
  });

  it('từ chối tạo đơn (400) khi payload sai ValidationPipe', async () => {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ items: [] }),
    });

    expect(res.status).toBe(400);
  });

  it('luồng End-to-End: Tạo đơn -> Khởi tạo VNPay -> Callback thành công -> Replay Idempotency', async () => {
    // 1. Tạo đơn hàng PENDING
    const createOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            productId: PRODUCT_ID,
            sizeId: SIZE_ID,
            quantity: 2,
            toppingIds: [TOPPING_ID],
          },
        ],
        pickupMethod: 'TAKEAWAY',
      }),
    });

    const createdOrder = await createOrderRes.json();
    expect(createOrderRes.status).toBe(201);
    expect(createdOrder.orderId).toBe(ORDER_ID);
    expect(createdOrder.status).toBe(OrderStatus.PENDING);
    expect(createdOrder.totalAmount).toBe(102000);
    expect(toppingStock).toBe(98);

    // 2. Khởi tạo phiên thanh toán
    const initiateRes = await fetch(`${baseUrl}/payments/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ orderId: ORDER_ID, bankCode: 'VNBANK' }),
    });

    const initiated = await initiateRes.json();
    expect(initiateRes.status).toBe(200);
    expect(initiated.orderId).toBe(ORDER_ID);
    expect(initiated.amount).toBe(102000);
    expect(initiated.paymentUrl).toContain('vnp_TxnRef=');

    const parsedUrl = new URL(initiated.paymentUrl);
    const txnRef = parsedUrl.searchParams.get('vnp_TxnRef')!;

    // 3. Callback thanh toán thành công
    const qs = new URLSearchParams({
      vnp_Amount: '10200000',
      vnp_ResponseCode: '00',
      vnp_TransactionNo: '14000001',
      vnp_TxnRef: txnRef,
      vnp_SecureHash: 'valid_hash',
    });

    const returnRes1 = await fetch(`${baseUrl}/payments/vnpay/return?${qs.toString()}`);
    const returnBody1 = await returnRes1.json();

    expect(returnRes1.status).toBe(200);
    expect(returnBody1).toMatchObject({
      success: true,
      orderId: ORDER_ID,
      orderStatus: OrderStatus.PAID,
      pointsEarned: 10,
      idempotentReplay: false,
    });
    expect(loyaltyPointsDb).toBe(10);

    // 4. Gọi lại ReturnUrl cùng vnp_TxnRef -> phải replay idempotent, không cộng điểm lần 2
    const returnRes2 = await fetch(`${baseUrl}/payments/vnpay/return?${qs.toString()}`);
    const returnBody2 = await returnRes2.json();

    expect(returnRes2.status).toBe(200);
    expect(returnBody2).toMatchObject({
      success: true,
      orderId: ORDER_ID,
      orderStatus: OrderStatus.PAID,
      pointsEarned: 10,
      idempotentReplay: true,
    });
    expect(loyaltyPointsDb).toBe(10);
  });

  it('từ chối callback VNPay (400) khi chữ ký bị giả mạo', async () => {
    const qs = new URLSearchParams({
      vnp_Amount: '10200000',
      vnp_ResponseCode: '00',
      vnp_TxnRef: `${ORDER_ID}_1700000000000`,
      vnp_SecureHash: 'invalid_tampered_hash',
    });

    const res = await fetch(`${baseUrl}/payments/vnpay/return?${qs.toString()}`);
    expect(res.status).toBe(400);
  });
});
