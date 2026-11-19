import { ConflictException, HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from './dto/process-payment.dto';
import { InvalidOrderException } from './exceptions/invalid-order.exception';
import { MockPaymentGateway } from './mock-payment-gateway';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockTx = {
    order: { updateMany: jest.fn() },
    payment: { create: jest.fn() },
    loyalty: { upsert: jest.fn() },
    loyaltyTransaction: { create: jest.fn() },
  };
  const mockPrisma = {
    payment: { findFirst: jest.fn(), create: jest.fn() },
    order: { findUnique: jest.fn() },
    $transaction: jest.fn((cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
  };
  const mockGateway = { charge: jest.fn() };

  const dto = { orderId: 'order-1', method: PaymentMethod.MOCK_CARD };
  const KEY = '3f2b8c7e-6a1d-4c55-9a0e-1b2c3d4e5f60';
  const pendingOrder = {
    orderId: 'order-1',
    userId: 'user-1',
    status: OrderStatus.PENDING,
    totalAmount: 102000,
    createdAt: new Date(),
  };
  const successPayment = {
    paymentId: 'pay-1',
    orderId: 'order-1',
    paymentMethod: 'MOCK_CARD',
    status: PaymentStatus.SUCCESS,
    transactionId: 'MOCK-1',
    idempotencyKey: KEY,
    amount: 102000,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MockPaymentGateway, useValue: mockGateway },
      ],
    }).compile();
    service = module.get(PaymentsService);
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    mockTx.loyalty.upsert.mockResolvedValue({ loyaltyId: 'loy-1' });
    delete process.env.LOYALTY_POINT_RATE;
  });

  it('thành công: lưu Payment SUCCESS và chuyển đơn sang PREPARING', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
    mockGateway.charge.mockResolvedValue({ success: true, transactionId: 'MOCK-1' });
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });
    mockTx.payment.create.mockResolvedValue(successPayment);

    const res = await service.processPayment('user-1', dto, KEY);

    expect(mockGateway.charge).toHaveBeenCalledWith(102000, PaymentMethod.MOCK_CARD);
    expect(mockTx.order.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: OrderStatus.PREPARING } }),
    );
    expect(res).toMatchObject({ status: 'SUCCESS', orderStatus: 'PREPARING', idempotentReplay: false });
  });

  it('thành công: cộng floor(102.000 / 10.000) = 10 điểm và ghi LoyaltyTransaction EARN', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
    mockGateway.charge.mockResolvedValue({ success: true, transactionId: 'MOCK-1' });
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });
    mockTx.payment.create.mockResolvedValue(successPayment);

    const res = await service.processPayment('user-1', dto, KEY);

    expect(mockTx.loyalty.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', points: 10 },
      update: { points: { increment: 10 } },
    });
    expect(mockTx.loyaltyTransaction.create).toHaveBeenCalledWith({
      data: { loyaltyId: 'loy-1', orderId: 'order-1', type: 'EARN', pointsAmount: 10 },
    });
    expect(res).toMatchObject({ pointsEarned: 10 });
  });

  it('đơn dưới mức quy đổi (< 10.000đ): không cộng điểm, không tạo giao dịch EARN', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...pendingOrder, totalAmount: 9000 });
    mockGateway.charge.mockResolvedValue({ success: true, transactionId: 'MOCK-1' });
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });
    mockTx.payment.create.mockResolvedValue(successPayment);

    const res = await service.processPayment('user-1', dto, KEY);

    expect(res).toMatchObject({ pointsEarned: 0 });
    expect(mockTx.loyalty.upsert).not.toHaveBeenCalled();
    expect(mockTx.loyaltyTransaction.create).not.toHaveBeenCalled();
  });

  it('key đã tồn tại (SUCCESS): trả kết quả cũ, KHÔNG charge và KHÔNG tạo Payment mới', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({
      ...successPayment,
      order: { status: OrderStatus.PREPARING, loyaltyTransactions: [{ pointsAmount: 10 }] },
    });

    const res = await service.processPayment('user-1', dto, KEY);

    expect(res).toMatchObject({ paymentId: 'pay-1', idempotentReplay: true, pointsEarned: 10 });
    expect(mockGateway.charge).not.toHaveBeenCalled();
    expect(mockTx.loyalty.upsert).not.toHaveBeenCalled(); // gửi lặp không cộng điểm lần nữa
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    expect(mockTx.payment.create).not.toHaveBeenCalled();
  });

  it('key đã tồn tại (FAILED): trả lỗi 402, không charge lại', async () => {
    mockPrisma.payment.findFirst.mockResolvedValue({
      ...successPayment,
      status: PaymentStatus.FAILED,
      order: { status: OrderStatus.PENDING, loyaltyTransactions: [] },
    });

    await expect(service.processPayment('user-1', dto, KEY)).rejects.toMatchObject({ status: 402 });
    expect(mockGateway.charge).not.toHaveBeenCalled();
  });

  it('cổng từ chối: lưu Payment FAILED, đơn giữ PENDING, trả 402', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
    mockGateway.charge.mockResolvedValue({ success: false, reason: 'Thẻ bị từ chối' });
    mockPrisma.payment.create.mockResolvedValue({ ...successPayment, status: PaymentStatus.FAILED });

    await expect(service.processPayment('user-1', dto, KEY)).rejects.toBeInstanceOf(HttpException);
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: PaymentStatus.FAILED }) }),
    );
    expect(mockTx.order.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['không tồn tại', null],
    ['của người khác', { ...pendingOrder, userId: 'other' }],
    ['đã CANCELLED', { ...pendingOrder, status: OrderStatus.CANCELLED }],
    ['đã thanh toán', { ...pendingOrder, status: OrderStatus.PREPARING }],
    ['quá 15 phút', { ...pendingOrder, createdAt: new Date(Date.now() - 16 * 60 * 1000) }],
  ])('đơn %s: ném InvalidOrderException, không charge', async (_label, order) => {
    mockPrisma.order.findUnique.mockResolvedValue(order);

    await expect(service.processPayment('user-1', dto, KEY)).rejects.toBeInstanceOf(InvalidOrderException);
    expect(mockGateway.charge).not.toHaveBeenCalled();
  });

  it('hai request song song cùng key: bên thua (P2002) nhận lại kết quả của bên thắng', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
    mockGateway.charge.mockResolvedValue({ success: true, transactionId: 'MOCK-1' });
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });
    mockTx.payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: 'test' }),
    );
    mockPrisma.payment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        ...successPayment,
        order: { status: OrderStatus.PREPARING, loyaltyTransactions: [{ pointsAmount: 10 }] },
      });

    const res = await service.processPayment('user-1', dto, KEY);
    expect(res).toMatchObject({ paymentId: 'pay-1', idempotentReplay: true });
  });

  it('key thuộc người dùng khác: ném ConflictException', async () => {
    mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
    mockGateway.charge.mockResolvedValue({ success: true, transactionId: 'MOCK-1' });
    mockTx.order.updateMany.mockResolvedValue({ count: 1 });
    mockTx.payment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: 'test' }),
    );

    await expect(service.processPayment('user-1', dto, KEY)).rejects.toBeInstanceOf(ConflictException);
  });
});
