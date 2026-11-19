import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
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
import { PaymentMethod, ProcessPaymentDto } from './dto/process-payment.dto';
import { InvalidOrderException } from './exceptions/invalid-order.exception';
import { MockPaymentGateway } from './mock-payment-gateway';

type PaymentWithOrder = Payment & {
  order: {
    status: OrderStatus;
    loyaltyTransactions: { pointsAmount: number }[];
  };
};

/** Mặc định 10.000đ = 1 điểm (SRS AC-10.1), có thể đổi bằng LOYALTY_POINT_RATE. */
function pointsForAmount(amount: number): number {
  const rate = Number(process.env.LOYALTY_POINT_RATE) || 10000;
  return Math.floor(amount / rate);
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockPaymentGateway,
  ) {}

  /**
   * Sequence "Thanh toán mô phỏng & chống trùng lặp" (FR-06):
   * 1. Tra Idempotency-Key -> đã có thì trả lại kết quả cũ (không charge lại)
   * 2. Chưa có -> kiểm tra đơn -> charge qua cổng mô phỏng
   * 3. Lưu Payment SUCCESS + đơn PENDING->PREPARING, hoặc lưu Payment FAILED
   */
  async processPayment(
    userId: string,
    dto: ProcessPaymentDto,
    idempotencyKey: string,
  ) {
    // 11-14: findPaymentByKey
    const existing = await this.findPaymentByKey(idempotencyKey, userId);
    if (existing) {
      return this.replayPayment(existing); // 15-20
    }

    // 22-29: findOrder + validateOrder
    const order = await this.findOrder(dto.orderId);
    this.validateOrder(order, userId);

    // 30-31: charge
    const result = await this.gateway.charge(
      Number(order.totalAmount),
      dto.method,
    );

    try {
      if (result.success) {
        // 32-38
        const { payment, pointsEarned } =
          await this.saveSuccessPaymentAndMarkPreparing(
            order,
            idempotencyKey,
            dto.method,
            result.transactionId,
          );
        return this.toResponse(
          payment,
          OrderStatus.PREPARING,
          pointsEarned,
          false,
        );
      }

      // 39-45
      const failed = await this.saveFailedPayment(
        order,
        idempotencyKey,
        dto.method,
      );
      throw this.paymentDeclined(failed, result.reason);
    } catch (error) {
      // Hai request cùng key chạy song song: unique index idempotency_key chặn bản ghi thứ hai
      if (this.isUniqueViolation(error)) {
        const winner = await this.findPaymentByKey(idempotencyKey, userId);
        if (winner) return this.replayPayment(winner);
        throw new ConflictException('Idempotency-Key đã được sử dụng');
      }
      throw error;
    }
  }

  private findPaymentByKey(
    idempotencyKey: string,
    userId: string,
  ): Promise<PaymentWithOrder | null> {
    return this.prisma.payment.findFirst({
      where: { idempotencyKey, order: { userId } },
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

  private replayPayment(payment: PaymentWithOrder) {
    if (payment.status === PaymentStatus.SUCCESS) {
      const pointsEarned = payment.order.loyaltyTransactions.reduce(
        (sum, t) => sum + t.pointsAmount,
        0,
      );
      return this.toResponse(payment, payment.order.status, pointsEarned, true);
    }
    throw this.paymentDeclined(payment, undefined);
  }

  private findOrder(orderId: string): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { orderId } });
  }

  private validateOrder(order: Order | null, userId: string): asserts order is Order {
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
    method: PaymentMethod,
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
          paymentMethod: method,
          status: PaymentStatus.SUCCESS,
          transactionId,
          idempotencyKey,
          amount: order.totalAmount,
        },
      });

      // Tích điểm (FR-10): floor(số tiền thanh toán / LOYALTY_POINT_RATE), cùng transaction
      // nên gửi lặp cùng Idempotency-Key không bao giờ cộng điểm hai lần.
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
    method: PaymentMethod,
  ) {
    // Đơn giữ nguyên PENDING để khách thanh toán lại bằng key mới
    return this.prisma.payment.create({
      data: {
        orderId: order.orderId,
        paymentMethod: method,
        status: PaymentStatus.FAILED,
        idempotencyKey,
        amount: order.totalAmount,
      },
    });
  }

  private paymentDeclined(payment: Payment, reason?: string) {
    return new HttpException(
      {
        statusCode: HttpStatus.PAYMENT_REQUIRED,
        message: reason ?? 'Giao dịch bị từ chối. Vui lòng thử lại.',
        paymentId: payment.paymentId,
        status: PaymentStatus.FAILED,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
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
      createdAt: payment.createdAt,
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
