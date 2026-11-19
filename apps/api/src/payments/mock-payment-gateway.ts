import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentMethod } from './dto/process-payment.dto';

export interface GatewayResult {
  success: boolean;
  transactionId?: string;
  reason?: string;
}

/**
 * Cổng thanh toán mô phỏng (MockPaymentGateway trong sequence diagram).
 * - PAYMENT_MOCK_DELAY_MS: độ trễ giả lập (mặc định 1500ms theo .env.example)
 * - PAYMENT_MOCK_FAILURE_RATE: xác suất bị từ chối 0..1 (mặc định 0) để demo luồng FAILED
 */
@Injectable()
export class MockPaymentGateway {
  async charge(amount: number, method: PaymentMethod): Promise<GatewayResult> {
    const delay = Number(process.env.PAYMENT_MOCK_DELAY_MS ?? 1500);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const failureRate = Number(process.env.PAYMENT_MOCK_FAILURE_RATE ?? 0);
    if (amount < 0 || Math.random() < failureRate) {
      return {
        success: false,
        reason:
          method === PaymentMethod.MOCK_CARD
            ? 'Thẻ bị từ chối bởi ngân hàng phát hành (mô phỏng)'
            : 'Ví điện tử không đủ số dư (mô phỏng)',
      };
    }

    return { success: true, transactionId: `MOCK-${randomUUID()}` };
  }
}
