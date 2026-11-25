// ============================================================
// Types Định nghĩa Dữ liệu Phân hệ Thực đơn (BrewLite)
// Khớp 100% với class-domain.puml và schema.prisma
// ============================================================

export interface Category {
  categoryId: string;
  name: string;
  description?: string | null;
}

export interface Size {
  sizeId: string;
  name: string;
  priceAdjustment: number;
  isAvailable?: boolean;
  maxServings?: number;
}

export interface Topping {
  toppingId: string;
  name: string;
  price: number;
}

export interface Product {
  productId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  imageUrl?: string | null;
  categoryId: string;
  category?: Category;
  sizes?: Size[];
  toppings?: Topping[];
  isAvailable?: boolean;
  maxServings?: number;
}

export interface QueryProductParams {
  categoryId?: string;
  search?: string;
}
