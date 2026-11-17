import { Product, Size, Topping } from './index';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string | null;
  basePrice: number;
  size: Size;
  sugar: string;
  ice: string;
  toppings: Topping[];
  note: string;
  quantity: number;
  unitPrice: number;
}

export interface AddToCartInput {
  product: Product;
  size?: Size;
  sugar: string;
  ice: string;
  toppings?: Topping[];
  note?: string;
  quantity: number;
}

export interface PromotionRule {
  promotionCode: string;
  description: string;
  minimumOrderAmount: number;
  discountAmount: number;
  discountPercentage: number;
}

export interface CartTotals {
  totalItems: number;
  subtotal: number;
  promotionDiscount: number;
  loyaltyDiscount: number;
  totalDiscount: number;
  grandTotal: number;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  appliedPoints?: number;
}
