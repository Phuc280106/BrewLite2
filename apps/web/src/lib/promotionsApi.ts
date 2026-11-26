import { normalizePromotionRule } from '@/lib/cartPricing';
import { PromotionRule } from '@/types/cart';

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL.endsWith('/api/v1') ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

/**
 * Lấy danh sách mã khuyến mãi động từ Backend API (GET /api/v1/promotions).
 */
export async function fetchPromotions(signal?: AbortSignal): Promise<PromotionRule[]> {
  const response = await fetch(`${API_BASE}/promotions`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Không thể tải danh sách mã khuyến mãi (${response.status}).`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('Dữ liệu mã khuyến mãi từ máy chủ không hợp lệ.');
  }

  return data
    .map((item) => normalizePromotionRule(item))
    .filter((item): item is PromotionRule => item !== null);
}
