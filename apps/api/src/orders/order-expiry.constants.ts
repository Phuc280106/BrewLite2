/** Đơn PENDING quá 15 phút chưa thanh toán sẽ bị hủy và hoàn kho (FR-06). */
export const ORDER_PAYMENT_TTL_MS = 15 * 60 * 1000;

/** Chu kỳ quét đơn quá hạn: mỗi phút. */
export const ORDER_EXPIRY_SCAN_INTERVAL_MS = 60 * 1000;
