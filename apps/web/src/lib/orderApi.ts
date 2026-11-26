import { getAuthToken } from '@/lib/auth';

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');
export const API_BASE = CLEAN_URL.endsWith('/api/v1') ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

export interface OrderToppingDto {
  toppingId: string;
  name: string;
  price: string | number;
}

export interface OrderItemDto {
  orderItemId: string;
  productName: string;
  unitPrice: string | number; // đã gồm phụ thu size + topping
  quantity: number;
  size: { name: string };
  toppings: OrderToppingDto[];
}

export interface OrderPaymentDto {
  paymentId: string;
  status: 'SUCCESS' | 'FAILED';
  paymentMethod: 'VNPAY' | string;
  transactionId: string | null;
}

export interface OrderDto {
  orderId: string;
  status: string;
  totalAmount: string | number;
  discountAmount: string | number;
  createdAt: string;
  items: OrderItemDto[];
  payments: OrderPaymentDto[];
}

/** GET /orders/:orderId — ném Error với message tiếng Việt khi thất bại. */
export async function fetchOrder(orderId: string, signal?: AbortSignal): Promise<OrderDto> {
  const token = getAuthToken();
  if (!token) throw new Error('Vui lòng đăng nhập để xem đơn hàng.');

  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
    throw new Error(msg || 'Không tải được đơn hàng.');
  }
  return payload as OrderDto;
}
