export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

export type PaymentStatus = 'SUCCESS' | 'FAILED';

export type LoyaltyTransactionType = 'EARN' | 'REDEEM';

export interface OrderItemSize {
  sizeId: string;
  name: string;
  priceAdjustment: number | string;
}

export interface OrderItemTopping {
  toppingId: string;
  name: string;
  price: number | string;
}

export interface OrderItemReceipt {
  orderItemId: string;
  orderId: string;
  productId: string;
  sizeId: string;
  productName: string;
  unitPrice: number | string;
  quantity: number;
  sugarLevel?: string;
  iceLevel?: string;
  size?: OrderItemSize | null;
  toppings?: OrderItemTopping[];
  product?: {
    productId: string;
    imageUrl?: string | null;
  } | null;
}

export interface OrderPayment {
  paymentId: string;
  orderId: string;
  paymentMethod: string;
  status: PaymentStatus;
  transactionId?: string | null;
  idempotencyKey?: string;
  amount: number | string;
  createdAt?: string;
}

export interface OrderPromotion {
  promotionId: string;
  promotionCode: string;
  description?: string | null;
  discountAmount: number | string;
  discountPercentage: number;
}

export interface OrderLoyaltyTransaction {
  transactionId: string;
  loyaltyId?: string;
  orderId?: string | null;
  type: LoyaltyTransactionType;
  pointsAmount: number;
  createdAt?: string;
}

export interface OrderRecord {
  orderId: string;
  userId: string;
  promotionId?: string | null;
  status: OrderStatus;
  totalAmount: number | string;
  discountAmount: number | string;
  pointsRedeemed: number;
  createdAt: string;
  items: OrderItemReceipt[];
  promotion?: OrderPromotion | null;
  payments?: OrderPayment[];
  loyaltyTransactions?: OrderLoyaltyTransaction[];
}

export type OrderHistoryFilter = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface OrderStatusDisplayMeta {
  label: string;
  shortLabel: string;
  badgeClassName: string;
  bannerBgClassName: string;
  bannerIconBgClassName: string;
  bannerTitleClassName: string;
  bannerSubtextClassName: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerEstimate: string;
  cancelHint: string;
  isActiveTracking: boolean;
}
