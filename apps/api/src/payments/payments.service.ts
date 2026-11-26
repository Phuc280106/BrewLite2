import { ConflictException, Injectable } from '@nestjs/common';
import {
  LoyaltyTransactionType,
  Order,
  OrderStatus,
  Payment,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { ORDER_PAYMENT_TTL_MS } from '../orders/order-expiry.constants';
import { PrismaService } from '../prisma/prisma.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { InvalidOrderException } from './exceptions/invalid-order.exception';
import { VnpayService } from './vnpay.service';

export const VNPAY_METHOD = 'VNPAY';
/** Số tiền tối thiểu VNPay chấp nhận cho một giao dịch (VND). */
export const VNPAY_MIN_AMOUNT = 5000;

type PaymentWithOrder = Payment & {
  order: {
    status: OrderStatus;
    loyaltyTransactions: { pointsAmount: number }[];
  };
};

export interface VnpayReturnResponse {
  success: boolean;
  orderId: string;
  message: string;
  responseCode?: string;
  paymentId?: string;
  status?: PaymentStatus;
  method?: string;
  transactionId?: string | null;
  amount?: number;
  orderStatus?: OrderStatus;
  pointsEarned?: number;
  idempotentReplay?: boolean;
}

/** Mặc định 10.000đ = 1 điểm (SRS AC-10.1), có thể đổi bằng LOYALTY_POINT_RATE. */
function pointsForAmount(amount: number): number {
  const rate = Number(process.env.LOYALTY_POINT_RATE) || 10000;
  return Math.floor(amount / rate);
}

/** Khóa chống trùng của một lượt thanh toán VNPay: duy nhất theo vnp_TxnRef. */
export function idempotencyKeyForTxnRef(txnRef: string): string {
  return `VNPAY_${txnRef}`;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vnpay: VnpayService,
  ) {}

  /**
   * Bước 1 — khách bấm thanh toán: kiểm tra đơn rồi sinh URL sang Cổng VNPay Sandbox.
   * Chưa ghi gì vào DB; đơn vẫn PENDING cho tới khi VNPay redirect về.
   */
  async initiatePayment(
    userId: string,
    dto: InitiatePaymentDto,
    ipAddr?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { orderId: dto.orderId },
    });
    this.validateOrder(order, userId);

    const amount = Number(order.totalAmount);
    if (amount < VNPAY_MIN_AMOUNT) {
      throw new InvalidOrderException(
        'Số tiền thanh toán qua VNPay tối thiểu phải từ 5.000đ trở lên',
      );
    }

    const paymentUrl = this.vnpay.createPaymentUrl({
      orderId: order.orderId,
      orderInfo: `Thanh toan don hang ${order.orderId}`,
      amount,
      ipAddr,
      bankCode: dto.bankCode,
    });

    return {
      orderId: order.orderId,
      amount,
      method: VNPAY_METHOD,
      bankCode: dto.bankCode || null,
      paymentUrl,
    };
  }

  /**
   * Bước 2 — VNPay redirect khách về ReturnUrl:
   * 1. Xác minh chữ ký HMAC-SHA512 (sai -> 400)
   * 2. Tra khóa chống trùng theo vnp_TxnRef -> đã xử lý thì trả lại kết quả cũ
   * 3. Kiểm tra đơn + đối soát số tiền
   * 4. Thành công (00): lưu Payment SUCCESS + đơn PENDING->PREPARING + tích điểm
   *    Thất bại / khách hủy: lưu Payment FAILED, đơn giữ PENDING để thanh toán lại
   */
  async handleVnpayReturn(
    query: Record<string, string>,
  ): Promise<VnpayReturnResponse> {
    const result = this.vnpay.verifyReturn(query);
    if (!result.isValid) {
      throw new InvalidOrderException(
        'Chữ ký số phản hồi từ VNPay không hợp lệ',
      );
    }

    const key = idempotencyKeyForTxnRef(result.txnRef);

    const existing = await this.findPaymentByKey(key);
    if (existing) return this.replayPayment(existing);

    const order = await this.prisma.order.findUnique({
      where: { orderId: result.orderId },
    });
    if (!order) {
      throw new InvalidOrderException('Đơn hàng không tồn tại');
    }

    // Đối soát: số tiền VNPay ghi nhận phải khớp giá trị đơn
    if (Math.abs(result.amount - Number(order.totalAmount)) > 1) {
      throw new InvalidOrderException(
        'Số tiền thanh toán từ VNPay không khớp với giá trị đơn hàng',
      );
    }

    try {
      if (result.isSuccess) {
        const { payment, pointsEarned } =
          await this.saveSuccessPaymentAndMarkPreparing(
            order,
            key,
            result.transactionNo,
          );
        return {
          success: true,
          message: 'Thanh toán qua VNPay Sandbox thành công!',
          ...this.toResponse(payment, OrderStatus.PREPARING, pointsEarned, false),
        };
      }

      const failed = await this.saveFailedPayment(
        order,
        key,
        result.transactionNo,
      );
      return {
        success: false,
        orderId: order.orderId,
        responseCode: result.responseCode,
        paymentId: failed.paymentId,
        status: PaymentStatus.FAILED,
        message: result.message,
      };
    } catch (error) {
      // Hai lần gọi song song cùng vnp_TxnRef: unique index idempotency_key chặn bản ghi thứ hai
      if (this.isUniqueViolation(error)) {
        const winner = await this.findPaymentByKey(key);
        if (winner) return this.replayPayment(winner);
        throw new ConflictException('Giao dịch VNPay này đã được xử lý');
      }
      throw error;
    }
  }

  private findPaymentByKey(
    idempotencyKey: string,
  ): Promise<PaymentWithOrder | null> {
    return this.prisma.payment.findFirst({
      where: { idempotencyKey },
      include: {
        order: {
          select: {
            status: true,
            loyaltyTransactions: {
              where: { type: LoyaltyTransactionType.EARN },
              select: { pointsAmount: true },
            },
          },
        },
      },
    });
  }

  private replayPayment(payment: PaymentWithOrder): VnpayReturnResponse {
    if (payment.status === PaymentStatus.SUCCESS) {
      const pointsEarned = payment.order.loyaltyTransactions.reduce(
        (sum, t) => sum + t.pointsAmount,
        0,
      );
      return {
        success: true,
        message: 'Thanh toán qua VNPay Sandbox thành công!',
        ...this.toResponse(payment, payment.order.status, pointsEarned, true),
      };
    }
    return {
      success: false,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      status: PaymentStatus.FAILED,
      idempotentReplay: true,
      message: 'Giao dịch VNPay này đã được ghi nhận là không thành công.',
    };
  }

  private validateOrder(
    order: Order | null,
    userId: string,
  ): asserts order is Order {
    // Đơn của người khác được coi như "không tồn tại" để không lộ thông tin
    if (!order || order.userId !== userId) {
      throw new InvalidOrderException('Đơn hàng không tồn tại');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new InvalidOrderException('Đơn hàng đã bị hủy');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new InvalidOrderException('Đơn hàng đã được thanh toán');
    }
    if (Date.now() - order.createdAt.getTime() > ORDER_PAYMENT_TTL_MS) {
      throw new InvalidOrderException(
        'Đơn hàng đã quá 15 phút chưa thanh toán và sắp bị hủy',
      );
    }
  }

  private saveSuccessPaymentAndMarkPreparing(
    order: Order,
    idempotencyKey: string,
    transactionId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Chỉ chuyển trạng thái nếu đơn vẫn PENDING (tránh đua với scheduler hủy đơn)
      const updated = await tx.order.updateMany({
        where: { orderId: order.orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.PREPARING },
      });
      if (updated.count !== 1) {
        throw new InvalidOrderException(
          'Đơn hàng không còn ở trạng thái chờ thanh toán',
        );
      }

      const payment = await tx.payment.create({
        data: {
          orderId: order.orderId,
          paymentMethod: VNPAY_METHOD,
          status: PaymentStatus.SUCCESS,
          transactionId,
          idempotencyKey,
          amount: order.totalAmount,
        },
      });

      // Tích điểm (FR-10): floor(số tiền thanh toán / LOYALTY_POINT_RATE), cùng transaction
      // nên gọi lặp cùng vnp_TxnRef không bao giờ cộng điểm hai lần.
      const pointsEarned = pointsForAmount(Number(order.totalAmount));
      if (pointsEarned > 0) {
        const loyalty = await tx.loyalty.upsert({
          where: { userId: order.userId },
          create: { userId: order.userId, points: pointsEarned },
          update: { points: { increment: pointsEarned } },
        });
        await tx.loyaltyTransaction.create({
          data: {
            loyaltyId: loyalty.loyaltyId,
            orderId: order.orderId,
            type: LoyaltyTransactionType.EARN,
            pointsAmount: pointsEarned,
          },
        });
      }

      return { payment, pointsEarned };
    });
  }

  private saveFailedPayment(
    order: Order,
    idempotencyKey: string,
    transactionId?: string,
  ) {
    // Đơn giữ nguyên PENDING để khách thanh toán lại bằng một phiên VNPay mới
    return this.prisma.payment.create({
      data: {
        orderId: order.orderId,
        paymentMethod: VNPAY_METHOD,
        status: PaymentStatus.FAILED,
        transactionId: transactionId || undefined,
        idempotencyKey,
        amount: order.totalAmount,
      },
    });
  }

  private toResponse(
    payment: Payment,
    orderStatus: OrderStatus,
    pointsEarned: number,
    idempotentReplay: boolean,
  ) {
    return {
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      status: payment.status,
      method: payment.paymentMethod,
      transactionId: payment.transactionId,
      amount: Number(payment.amount),
      orderStatus,
      pointsEarned,
      idempotentReplay,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
