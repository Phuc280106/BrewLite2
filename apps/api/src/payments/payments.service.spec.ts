import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InvalidOrderException } from './exceptions/invalid-order.exception';
import { PaymentsService } from './payments.service';
import { VnpayService } from './vnpay.service';

describe('PaymentsService (VNPay Sandbox)', () => {
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
  const mockVnpay = { createPaymentUrl: jest.fn(), verifyReturn: jest.fn() };

  const TXN_REF = 'order-1_1700000000000';
  const KEY = `VNPAY_${TXN_REF}`;
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
    paymentMethod: 'VNPAY',
    status: PaymentStatus.SUCCESS,
    transactionId: '14000001',
    idempotencyKey: KEY,
    amount: 102000,
    createdAt: new Date(),
  };
  const okReturn = {
    isValid: true,
    isSuccess: true,
    txnRef: TXN_REF,
    orderId: 'order-1',
    amount: 102000,
    transactionNo: '14000001',
    responseCode: '00',
    message: 'ok',
  };
  const p2002 = () =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: 'test',
    });

  beforeEach(async () => {
    jest.resetAllMocks();
    mockPrisma.$transaction.mockImplementation((cb: (tx: typeof mockTx) => unknown) =>
      cb(mockTx),
    );
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VnpayService, useValue: mockVnpay },
      ],
    }).compile();
    service = module.get(PaymentsService);
    mockPrisma.payment.findFirst.mockResolvedValue(null);
    mockTx.loyalty.upsert.mockResolvedValue({ loyaltyId: 'loy-1' });
    delete process.env.LOYALTY_POINT_RATE;
  });

  describe('initiatePayment', () => {
    const dto = { orderId: 'order-1', bankCode: 'VNBANK' };

    it('đơn PENDING hợp lệ: trả paymentUrl, không ghi DB', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockVnpay.createPaymentUrl.mockReturnValue('https://sandbox.vnpayment.vn/x');

      const res = await service.initiatePayment('user-1', dto, '127.0.0.1');

      expect(mockVnpay.createPaymentUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          orderId: 'order-1',
          amount: 102000,
          ipAddr: '127.0.0.1',
          bankCode: 'VNBANK',
        }),
      );
      expect(res).toMatchObject({
        orderId: 'order-1',
        amount: 102000,
        method: 'VNPAY',
        paymentUrl: 'https://sandbox.vnpayment.vn/x',
      });
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('đơn dưới 5.000đ: từ chối, không sinh URL', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({ ...pendingOrder, totalAmount: 4000 });

      await expect(service.initiatePayment('user-1', dto)).rejects.toBeInstanceOf(
        InvalidOrderException,
      );
      expect(mockVnpay.createPaymentUrl).not.toHaveBeenCalled();
    });

    it.each([
      ['không tồn tại', null],
      ['của người khác', { ...pendingOrder, userId: 'other' }],
      ['đã CANCELLED', { ...pendingOrder, status: OrderStatus.CANCELLED }],
      ['đã thanh toán', { ...pendingOrder, status: OrderStatus.PREPARING }],
      ['quá 15 phút', { ...pendingOrder, createdAt: new Date(Date.now() - 16 * 60 * 1000) }],
    ])('đơn %s: ném InvalidOrderException, không sinh URL', async (_label, order) => {
      mockPrisma.order.findUnique.mockResolvedValue(order);

      await expect(service.initiatePayment('user-1', dto)).rejects.toBeInstanceOf(
        InvalidOrderException,
      );
      expect(mockVnpay.createPaymentUrl).not.toHaveBeenCalled();
    });
  });

  describe('handleVnpayReturn', () => {
    it('chữ ký sai: ném InvalidOrderException, không đụng DB', async () => {
      mockVnpay.verifyReturn.mockReturnValue({ ...okReturn, isValid: false, isSuccess: false });

      await expect(service.handleVnpayReturn({})).rejects.toBeInstanceOf(InvalidOrderException);
      expect(mockPrisma.payment.findFirst).not.toHaveBeenCalled();
      expect(mockPrisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('thành công: lưu Payment SUCCESS (VNPAY) và chuyển đơn PENDING -> PREPARING', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.payment.create.mockResolvedValue(successPayment);

      const res = await service.handleVnpayReturn({});

      expect(mockTx.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: OrderStatus.PREPARING } }),
      );
      expect(mockTx.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentMethod: 'VNPAY',
          status: PaymentStatus.SUCCESS,
          idempotencyKey: KEY,
          transactionId: '14000001',
        }),
      });
      expect(res).toMatchObject({
        success: true,
        status: 'SUCCESS',
        orderStatus: 'PREPARING',
        idempotentReplay: false,
      });
    });

    it('thành công: cộng floor(102.000 / 10.000) = 10 điểm và ghi LoyaltyTransaction EARN', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.payment.create.mockResolvedValue(successPayment);

      const res = await service.handleVnpayReturn({});

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

    it('đơn dưới mức quy đổi (< 10.000đ): không cộng điểm', async () => {
      mockVnpay.verifyReturn.mockReturnValue({ ...okReturn, amount: 9000 });
      mockPrisma.order.findUnique.mockResolvedValue({ ...pendingOrder, totalAmount: 9000 });
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.payment.create.mockResolvedValue(successPayment);

      const res = await service.handleVnpayReturn({});

      expect(res).toMatchObject({ pointsEarned: 0 });
      expect(mockTx.loyalty.upsert).not.toHaveBeenCalled();
      expect(mockTx.loyaltyTransaction.create).not.toHaveBeenCalled();
    });

    it('gọi lại cùng vnp_TxnRef (đã SUCCESS): trả kết quả cũ, KHÔNG tạo Payment/điểm mới', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...successPayment,
        order: { status: OrderStatus.PREPARING, loyaltyTransactions: [{ pointsAmount: 10 }] },
      });

      const res = await service.handleVnpayReturn({});

      expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { idempotencyKey: KEY } }),
      );
      expect(res).toMatchObject({
        success: true,
        paymentId: 'pay-1',
        idempotentReplay: true,
        pointsEarned: 10,
      });
      expect(mockTx.payment.create).not.toHaveBeenCalled();
      expect(mockTx.loyalty.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('gọi lại cùng vnp_TxnRef (đã FAILED): trả kết quả thất bại cũ, không tạo bản ghi mới', async () => {
      mockVnpay.verifyReturn.mockReturnValue({ ...okReturn, isSuccess: false, responseCode: '51' });
      mockPrisma.payment.findFirst.mockResolvedValue({
        ...successPayment,
        status: PaymentStatus.FAILED,
        order: { status: OrderStatus.PENDING, loyaltyTransactions: [] },
      });

      const res = await service.handleVnpayReturn({});

      expect(res).toMatchObject({ success: false, idempotentReplay: true });
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('VNPay báo thất bại (vd. 51): lưu Payment FAILED, đơn GIỮ PENDING', async () => {
      mockVnpay.verifyReturn.mockReturnValue({
        ...okReturn,
        isSuccess: false,
        responseCode: '51',
        message: 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      });
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockPrisma.payment.create.mockResolvedValue({
        ...successPayment,
        status: PaymentStatus.FAILED,
      });

      const res = await service.handleVnpayReturn({});

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
          paymentMethod: 'VNPAY',
          idempotencyKey: KEY,
        }),
      });
      expect(mockTx.order.updateMany).not.toHaveBeenCalled();
      expect(res).toMatchObject({
        success: false,
        orderId: 'order-1',
        responseCode: '51',
        status: 'FAILED',
      });
    });

    it('khách bấm Hủy trên VNPay (24): lưu Payment FAILED, đơn vẫn PENDING (không tự hủy đơn)', async () => {
      mockVnpay.verifyReturn.mockReturnValue({
        ...okReturn,
        isSuccess: false,
        responseCode: '24',
        message: 'Khách hàng hủy giao dịch thanh toán.',
      });
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockPrisma.payment.create.mockResolvedValue({
        ...successPayment,
        status: PaymentStatus.FAILED,
      });

      const res = await service.handleVnpayReturn({});

      expect(res).toMatchObject({ success: false, responseCode: '24' });
      expect(mockTx.order.updateMany).not.toHaveBeenCalled();
    });

    it('số tiền VNPay không khớp đơn: từ chối, không ghi gì', async () => {
      mockVnpay.verifyReturn.mockReturnValue({ ...okReturn, amount: 1000 });
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);

      await expect(service.handleVnpayReturn({})).rejects.toBeInstanceOf(InvalidOrderException);
      expect(mockTx.payment.create).not.toHaveBeenCalled();
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });

    it('đơn không tồn tại: ném InvalidOrderException', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.handleVnpayReturn({})).rejects.toBeInstanceOf(InvalidOrderException);
    });

    it('đơn đã bị hủy trước khi VNPay trả về (scheduler 15 phút): không chuyển trạng thái, báo lỗi', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.order.findUnique.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CANCELLED,
      });
      mockTx.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.handleVnpayReturn({})).rejects.toBeInstanceOf(InvalidOrderException);
      expect(mockTx.payment.create).not.toHaveBeenCalled();
    });

    it('hai lần gọi song song cùng vnp_TxnRef: bên thua (P2002) nhận lại kết quả của bên thắng', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.payment.create.mockRejectedValue(p2002());
      mockPrisma.payment.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...successPayment,
        order: { status: OrderStatus.PREPARING, loyaltyTransactions: [{ pointsAmount: 10 }] },
      });

      const res = await service.handleVnpayReturn({});

      expect(res).toMatchObject({ success: true, paymentId: 'pay-1', idempotentReplay: true });
    });

    it('P2002 nhưng không tìm thấy bản ghi thắng: ném ConflictException', async () => {
      mockVnpay.verifyReturn.mockReturnValue(okReturn);
      mockPrisma.order.findUnique.mockResolvedValue(pendingOrder);
      mockTx.order.updateMany.mockResolvedValue({ count: 1 });
      mockTx.payment.create.mockRejectedValue(p2002());

      await expect(service.handleVnpayReturn({})).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
