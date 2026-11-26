import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * Ma trận chuyển đổi trạng thái đơn hàng (Order State Machine)
 * Tuân thủ yêu cầu:
 *   - PAID -> PREPARING (Barista nhận đơn)
 *   - PREPARING -> READY (Pha xong)
 *   - READY -> COMPLETED (Đã giao khách)
 *   - PENDING / PAID / PAYMENT_FAILED -> CANCELLED (Hủy đơn & hoàn kho)
 *   - PENDING -> PAID (Khách thanh toán thành công)
 *   - PENDING -> PAYMENT_FAILED (Thanh toán thất bại)
 */
export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
    OrderStatus.PAYMENT_FAILED,
  ],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PENDING, OrderStatus.CANCELLED],
};

/**
 * Kiểm tra tính hợp lệ của việc chuyển trạng thái đơn hàng.
 * Ném lỗi 400 Bad Request nếu chuyển trạng thái không hợp lệ hoặc đi lùi.
 */
export function assertTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus,
): void {
  const allowed = VALID_ORDER_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw new BadRequestException(
      `Chuyển trạng thái đơn hàng không hợp lệ: không thể chuyển từ ${fromStatus} sang ${toStatus}. Các trạng thái hợp lệ tiếp theo: [${allowed.join(', ') || 'không có'}]`,
    );
  }
}
