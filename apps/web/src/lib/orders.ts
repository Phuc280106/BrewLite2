// ============================================================
// BrewLite Order History & Receipt API Client (FR-07 & FR-08)
// Direct integration with NestJS API endpoints
// ============================================================

import { getAuthToken } from '@/lib/auth';
import {
  OrderHistoryFilter,
  OrderRecord,
  OrderStatus,
  OrderStatusDisplayMeta,
} from '@/types/order';

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL.endsWith('/api/v1') ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

export class OrderApiError extends Error {
  status: number;
  isNetworkError: boolean;

  constructor(message: string, status = 500, isNetworkError = false) {
    super(message);
    this.name = 'OrderApiError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Chuẩn hóa mã biên nhận hiển thị dạng #BL-XXXX từ orderId (UUID hoặc mã tùy chỉnh).
 */
export function formatOrderCode(orderId: string): string {
  const trimmed = (orderId || '').trim();
  if (!trimmed) return 'BL-0000';

  const existingMatch = trimmed.match(/^#?BL-([A-Z0-9]{4,8})$/i);
  if (existingMatch) {
    return `BL-${existingMatch[1].toUpperCase()}`;
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 4 && trimmed.length <= 16) {
    return `BL-${digitsOnly.slice(-4)}`;
  }

  // Deterministic 4-digit numeric hash from UUID so every order gets a stable readable pickup code
  let hash = 0;
  for (let i = 0; i < trimmed.length; i += 1) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) % 9000;
  }
  const codeNumber = String(1000 + Math.abs(hash)).slice(0, 4);
  return `BL-${codeNumber}`;
}

/**
 * Trả về mã nhận món ngắn dạng #8921 theo đúng Figma 14:46.
 */
export function getShortPickupCode(orderId: string): string {
  const fullCode = formatOrderCode(orderId);
  return `#${fullCode.replace(/^BL-/i, '')}`;
}

/**
 * Định dạng thời gian đặt đơn chuẩn tiếng Việt (HH:mm · dd/MM/yyyy).
 */
export function formatOrderDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Vừa đặt';
  }
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes} · ${day}/${month}/${year}`;
}

/**
 * Ánh xạ OrderStatus -> chỉ số bước trên OrderStatusStepper (0..4),
 * hiển thị rõ ràng 5 bước: Chờ tiếp nhận -> Đã thanh toán -> Đang pha chế -> Sẵn sàng -> Hoàn tất.
 * Trả về -1 cho trạng thái ngoại lệ CANCELLED / PAYMENT_FAILED.
 */
export function getOrderStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PAID':
      return 1;
    case 'PREPARING':
      return 2;
    case 'READY':
      return 3;
    case 'COMPLETED':
      return 4;
    case 'CANCELLED':
    case 'PAYMENT_FAILED':
    default:
      return -1;
  }
}

/**
 * FR-12 & State Machine: Khách hàng có thể hủy đơn khi đang ở trạng thái
 * PENDING, PAID (chưa vào quầy pha chế) hoặc PAYMENT_FAILED.
 * Đơn đã sang PREPARING, READY hoặc COMPLETED không thể hủy.
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return status === 'PENDING' || status === 'PAYMENT_FAILED';
}

/**
 * Tính điểm thưởng tích lũy (FR-10: ưu tiên LoyaltyTransaction EARN thực tế,
 * nếu chưa ghi nhận giao dịch EARN thì tính theo công thức floor(totalAmount / 10.000)).
 */
export function calculateEarnedPoints(order: OrderRecord): number {
  if (order.status === 'CANCELLED' || order.status === 'PAYMENT_FAILED') {
    return 0;
  }
  const earnedTx = order.loyaltyTransactions?.find((tx) => tx.type === 'EARN');
  if (earnedTx) {
    return Math.max(0, Number(earnedTx.pointsAmount) || 0);
  }
  const total = Number(order.totalAmount) || 0;
  return Math.max(0, Math.floor(total / 10000));
}

/**
 * Tính tổng giá đơn vị cơ sở của 1 món (tách riêng giá topping để hiển thị giống biên nhận Figma).
 */
export function getItemBaseLinePrice(
  unitPrice: number | string,
  quantity: number,
  toppings: Array<{ price: number | string }> = [],
): number {
  const unit = Number(unitPrice) || 0;
  const toppingsTotal = toppings.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
  const baseUnit = Math.max(0, unit - toppingsTotal);
  return baseUnit * Math.max(1, quantity);
}

/**
 * Định dạng tên phương thức thanh toán thân thiện người dùng.
 */
export function formatPaymentMethod(method?: string | null): string {
  if (!method) return 'Cổng VNPay (Sandbox)';
  const normalized = method.toUpperCase();
  if (normalized === 'VNPAY') return 'Cổng VNPay (Sandbox)';
  if (normalized === 'CASH') return 'Thanh toán tại quầy';
  return method;
}

/**
 * Lọc danh sách đơn hàng theo tab trạng thái trên màn hình Lịch sử đơn hàng (FR-08).
 */
export function filterOrdersByTab(
  orders: OrderRecord[],
  filter: OrderHistoryFilter,
): OrderRecord[] {
  if (filter === 'ALL') return orders;
  if (filter === 'ACTIVE') {
    return orders.filter((o) =>
      ['PENDING', 'PAID', 'PREPARING', 'READY'].includes(o.status),
    );
  }
  if (filter === 'COMPLETED') {
    return orders.filter((o) => o.status === 'COMPLETED');
  }
  return orders.filter(
    (o) => o.status === 'CANCELLED' || o.status === 'PAYMENT_FAILED',
  );
}

/**
 * Metadata hiển thị trạng thái chuẩn theo thiết kế Figma 14:46 & SRS FR-07/FR-08.
 */
export function getStatusDisplayMeta(status: OrderStatus): OrderStatusDisplayMeta {
  switch (status) {
    case 'PENDING':
      return {
        label: 'Chờ tiếp nhận',
        shortLabel: 'Chờ tiếp nhận',
        badgeClassName: 'bg-[#FEF3C7] text-[#9A5305] border border-[#F5D7A9]',
        bannerBgClassName: 'bg-[#FFF8EB] border border-[#F5D7A9]',
        bannerIconBgClassName: 'bg-[#FEF0D4] text-[#D97706]',
        bannerTitleClassName: 'text-[#9A5305]',
        bannerSubtextClassName: 'text-[#7C4A15]',
        bannerTitle: 'Đơn hàng đang chờ tiếp nhận',
        bannerSubtitle: 'Quầy đã nhận yêu cầu đặt món của bạn.',
        bannerEstimate: 'Vui lòng hoàn tất thanh toán hoặc chờ xác nhận',
        cancelHint: 'Bạn có thể hủy đơn khi quầy chưa bắt đầu pha chế.',
        isActiveTracking: true,
      };
    case 'PAID':
      return {
        label: 'Đã thanh toán',
        shortLabel: 'Đã thanh toán',
        badgeClassName: 'bg-[#EAF7EE] text-[#147D56] border border-[#BCE5CC]',
        bannerBgClassName: 'bg-[#EAF7EE]',
        bannerIconBgClassName: 'bg-[#ECF8F1] text-[#147D56]',
        bannerTitleClassName: 'text-[#126844]',
        bannerSubtextClassName: 'text-[#285F49]',
        bannerTitle: 'Đã thanh toán thành công!',
        bannerSubtitle: 'Đơn hàng đang chờ quầy tiếp nhận pha chế.',
        bannerEstimate: 'Dự kiến quầy tiếp nhận trong 1-3 phút',
        cancelHint: 'Bạn có thể hủy đơn trước khi quầy bắt đầu pha chế.',
        isActiveTracking: true,
      };
    case 'PREPARING':
      return {
        label: 'Đang pha chế',
        shortLabel: 'Đang pha chế',
        badgeClassName: 'bg-[#FEF3C7] text-[#9A5305] border border-[#F5D7A9]',
        bannerBgClassName: 'bg-[#FFF8EB] border border-[#F5D7A9]',
        bannerIconBgClassName: 'bg-[#FEF0D4] text-[#D97706]',
        bannerTitleClassName: 'text-[#9A5305]',
        bannerSubtextClassName: 'text-[#7C4A15]',
        bannerTitle: 'Quầy đang chuẩn bị món!',
        bannerSubtitle: 'Barista đang pha chế đồ uống theo yêu cầu của bạn.',
        bannerEstimate: 'Dự kiến hoàn thành sau 5-8 phút',
        cancelHint: 'Đơn đang pha chế, không thể hủy.',
        isActiveTracking: true,
      };
    case 'READY':
      return {
        label: 'Sẵn sàng lấy món',
        shortLabel: 'Sẵn sàng',
        badgeClassName: 'bg-[#DCFCE7] text-[#126844] border border-[#86EFAC]',
        bannerBgClassName: 'bg-[#EAF7EE]',
        bannerIconBgClassName: 'bg-[#DCFCE7] text-[#147D56]',
        bannerTitleClassName: 'text-[#126844]',
        bannerSubtextClassName: 'text-[#285F49]',
        bannerTitle: 'Đồ uống đã sẵn sàng!',
        bannerSubtitle: 'Mời bạn đến quầy đưa mã QR để nhận món.',
        bannerEstimate: 'Vui lòng nhận món để thưởng thức trọn vị',
        cancelHint: 'Đơn đã pha chế xong, không thể hủy.',
        isActiveTracking: true,
      };
    case 'COMPLETED':
      return {
        label: 'Hoàn tất',
        shortLabel: 'Hoàn tất',
        badgeClassName: 'bg-[#ECF8F1] text-[#147D56] border border-[#BCE5CC]',
        bannerBgClassName: 'bg-[#EAF7EE]',
        bannerIconBgClassName: 'bg-[#ECF8F1] text-[#147D56]',
        bannerTitleClassName: 'text-[#126844]',
        bannerSubtextClassName: 'text-[#285F49]',
        bannerTitle: 'Đơn hàng đã hoàn tất!',
        bannerSubtitle: 'Cảm ơn bạn đã thưởng thức cùng BrewLite.',
        bannerEstimate: 'Điểm thưởng đã được cộng vào tài khoản của bạn',
        cancelHint: 'Đơn hàng đã hoàn tất.',
        isActiveTracking: false,
      };
    case 'PAYMENT_FAILED':
      return {
        label: 'Thanh toán thất bại',
        shortLabel: 'Lỗi thanh toán',
        badgeClassName: 'bg-[#FEF2F2] text-[#D92D2D] border border-[#FECACA]',
        bannerBgClassName: 'bg-[#FEF2F2] border border-[#FECACA]',
        bannerIconBgClassName: 'bg-[#FEE2E2] text-[#D92D2D]',
        bannerTitleClassName: 'text-[#B91C1C]',
        bannerSubtextClassName: 'text-[#991B1B]',
        bannerTitle: 'Thanh toán không thành công',
        bannerSubtitle: 'Giao dịch chưa thể hoàn tất. Vui lòng thử lại.',
        bannerEstimate: 'Đơn hàng chưa được chuyển xuống quầy pha chế',
        cancelHint: 'Bạn có thể tạo đơn mới từ thực đơn BrewLite.',
        isActiveTracking: false,
      };
    case 'CANCELLED':
    default:
      return {
        label: 'Đã hủy',
        shortLabel: 'Đã hủy',
        badgeClassName: 'bg-[#FEF2F2] text-[#D92D2D] border border-[#FECACA]',
        bannerBgClassName: 'bg-[#FEF2F2] border border-[#FECACA]',
        bannerIconBgClassName: 'bg-[#FEE2E2] text-[#D92D2D]',
        bannerTitleClassName: 'text-[#B91C1C]',
        bannerSubtextClassName: 'text-[#991B1B]',
        bannerTitle: 'Đơn hàng đã bị hủy',
        bannerSubtitle: 'Đơn hàng này đã được hủy và hoàn trả nguyên liệu.',
        bannerEstimate: 'Bạn có thể đặt lại món yêu thích bất cứ lúc nào',
        cancelHint: 'Đơn hàng đã được hủy trước đó.',
        isActiveTracking: false,
      };
  }
}

// ============================================================
// API Calls (FR-07 & FR-08)
// ============================================================

/**
 * FR-08: Gọi API GET /api/v1/orders/my-orders lấy danh sách đơn hàng cá nhân.
 */
export async function fetchMyOrders(): Promise<OrderRecord[]> {
  const token = getAuthToken();

  if (!token) {
    throw new OrderApiError(
      'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      401,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/orders/my-orders`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch {
    throw new OrderApiError(
      'Kết nối bị gián đoạn, vui lòng kiểm tra lại mạng',
      0,
      true,
    );
  }

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new OrderApiError(
      'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      401,
    );
  }

  if (!response.ok) {
    const message =
      (data && (Array.isArray(data.message) ? data.message.join(', ') : data.message)) ||
      'Không thể tải danh sách đơn hàng. Vui lòng thử lại.';
    throw new OrderApiError(message, response.status);
  }

  const list = Array.isArray(data) ? (data as OrderRecord[]) : [];
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

/**
 * FR-07: Gọi API GET /api/v1/orders/:id lấy chi tiết biên nhận & tiến trình đơn hàng.
 */
export async function fetchOrderById(orderId: string): Promise<OrderRecord> {
  const token = getAuthToken();

  if (!token) {
    throw new OrderApiError(
      'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      401,
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
  } catch {
    throw new OrderApiError(
      'Kết nối bị gián đoạn, vui lòng kiểm tra lại mạng',
      0,
      true,
    );
  }

  const data = await response.json().catch(() => null);

  if (response.status === 401) {
    throw new OrderApiError(
      'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      401,
    );
  }

  if (response.status === 404) {
    throw new OrderApiError('Không tìm thấy thông tin đơn hàng này', 404);
  }

  if (response.status === 403) {
    throw new OrderApiError('Bạn không có quyền xem thông tin đơn hàng này', 403);
  }

  if (!response.ok) {
    const message =
      (data && (Array.isArray(data.message) ? data.message.join(', ') : data.message)) ||
      'Không thể tải thông tin biên nhận đơn hàng.';
    throw new OrderApiError(message, response.status);
  }

  return data as OrderRecord;
}

/**
 * FR-12: Gọi API PATCH /api/v1/orders/:id/cancel khi đơn hàng còn ở trạng thái PENDING / PAID / PAYMENT_FAILED.
 */
export async function cancelOrderById(orderId: string): Promise<OrderRecord> {
  const token = getAuthToken();

  if (!token) {
    throw new OrderApiError(
      'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
      401,
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${API_BASE}/orders/${encodeURIComponent(orderId)}/cancel`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );
  } catch {
    throw new OrderApiError(
      'Kết nối bị gián đoạn, vui lòng kiểm tra lại mạng',
      0,
      true,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && (Array.isArray(data.message) ? data.message.join(', ') : data.message)) ||
      'Không thể hủy đơn hàng này.';
    throw new OrderApiError(message, response.status);
  }

  return data as OrderRecord;
}
