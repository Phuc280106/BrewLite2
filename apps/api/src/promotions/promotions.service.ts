import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PromotionListItem {
  promotionId: string;
  promotionCode: string;
  description: string;
  minimumOrderAmount: number;
  discountAmount: number;
  discountPercentage: number;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy danh sách mã khuyến mãi hiện có từ PostgreSQL,
   * chuẩn hóa kiểu số từ Prisma Decimal để Frontend sử dụng trực tiếp.
   */
  async findAll(): Promise<PromotionListItem[]> {
    const promotions = await this.prisma.promotion.findMany({
      orderBy: { minimumOrderAmount: 'asc' },
      select: {
        promotionId: true,
        promotionCode: true,
        description: true,
        minimumOrderAmount: true,
        discountAmount: true,
        discountPercentage: true,
      },
    });

    return promotions.map((promo) => ({
      promotionId: promo.promotionId,
      promotionCode: promo.promotionCode,
      description: promo.description ?? '',
      minimumOrderAmount: Number(promo.minimumOrderAmount),
      discountAmount: Number(promo.discountAmount),
      discountPercentage: promo.discountPercentage,
    }));
  }
}
