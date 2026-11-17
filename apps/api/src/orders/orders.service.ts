import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LoyaltyTransactionType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderItemInputDto } from './dto/create-order.dto';

interface ValidatedOrderLine {
  productId: string;
  sizeId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  toppingIds: string[];
}

interface LockedIngredientRow {
  ingredient_id: string;
  name: string;
  stock: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đơn hàng mới trong Database Transaction và khóa dòng tồn kho (SELECT FOR UPDATE)
   * để chống bán âm kho khi nhiều khách hàng đặt hàng đồng thời.
   */
  async createOrder(authUserId: string | undefined, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const userId = await this.resolveUserId(tx, authUserId ?? dto.userId);

      const { lines, subtotal, requiredByIngredient } =
        await this.buildValidatedOrderLines(tx, dto.items);

      await this.lockAndDeductIngredients(tx, requiredByIngredient);

      const { promotionId, promotionDiscount } =
        await this.calculatePromotionDiscount(tx, dto.promotionCode, subtotal);

      const afterPromo = Math.max(0, subtotal - promotionDiscount);
      const { loyaltyId, pointsRedeemed, loyaltyDiscount } =
        await this.prepareLoyaltyRedemption(
          tx,
          userId,
          dto.pointsToRedeem ?? 0,
          afterPromo,
        );

      const totalDiscount = promotionDiscount + loyaltyDiscount;
      const totalAmount = Math.max(0, subtotal - totalDiscount);

      const order = await tx.order.create({
        data: {
          userId,
          promotionId,
          status: OrderStatus.PENDING,
          totalAmount,
          discountAmount: totalDiscount,
          pointsRedeemed,
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              sizeId: line.sizeId,
              productName: line.productName,
              unitPrice: line.unitPrice,
              quantity: line.quantity,
              toppings:
                line.toppingIds.length > 0
                  ? { connect: line.toppingIds.map((toppingId) => ({ toppingId })) }
                  : undefined,
            })),
          },
        },
        include: {
          items: {
            include: {
              size: true,
              toppings: true,
            },
          },
          promotion: true,
        },
      });

      if (loyaltyId && pointsRedeemed > 0) {
        await tx.loyalty.update({
          where: { loyaltyId },
          data: { points: { decrement: pointsRedeemed } },
        });

        await tx.loyaltyTransaction.create({
          data: {
            loyaltyId,
            orderId: order.orderId,
            type: LoyaltyTransactionType.REDEEM,
            pointsAmount: pointsRedeemed,
          },
        });
      }

      return order;
    });
  }

  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: {
            size: true,
            toppings: true,
          },
        },
        promotion: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có mã: ${orderId}`);
    }

    return order;
  }

  private async resolveUserId(
    tx: Prisma.TransactionClient,
    requestedUserId?: string,
  ): Promise<string> {
    if (requestedUserId) {
      const user = await tx.user.findUnique({
        where: { userId: requestedUserId },
        select: { userId: true },
      });
      if (!user) {
        throw new NotFoundException(`Không tìm thấy người dùng: ${requestedUserId}`);
      }
      return user.userId;
    }

    const demoUser = await tx.user.findUnique({
      where: { email: 'demo@brewlite.vn' },
      select: { userId: true },
    });
    if (!demoUser) {
      throw new NotFoundException(
        'Chưa có người dùng mẫu (demo@brewlite.vn). Vui lòng chạy npm run seed trước.',
      );
    }
    return demoUser.userId;
  }

  private async buildValidatedOrderLines(
    tx: Prisma.TransactionClient,
    items: OrderItemInputDto[],
  ) {
    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const products = await tx.product.findMany({
      where: { productId: { in: productIds } },
      include: {
        sizes: true,
        toppings: true,
        recipeItems: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.productId, p]));
    const lines: ValidatedOrderLine[] = [];
    const requiredByIngredient = new Map<string, number>();
    let subtotal = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm: ${item.productId}`);
      }

      const size = product.sizes.find((s) => s.sizeId === item.sizeId);
      if (!size) {
        throw new BadRequestException(
          `Kích cỡ ${item.sizeId} không hợp lệ cho món ${product.name}`,
        );
      }

      const uniqueToppingIds = Array.from(new Set(item.toppingIds ?? []));
      let toppingsPrice = 0;
      for (const toppingId of uniqueToppingIds) {
        const topping = product.toppings.find((t) => t.toppingId === toppingId);
        if (!topping) {
          throw new BadRequestException(
            `Topping ${toppingId} không hợp lệ cho món ${product.name}`,
          );
        }
        toppingsPrice += Number(topping.price);
      }

      const unitPrice =
        Number(product.basePrice) + Number(size.priceAdjustment) + toppingsPrice;
      subtotal += unitPrice * item.quantity;

      lines.push({
        productId: product.productId,
        sizeId: size.sizeId,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        toppingIds: uniqueToppingIds,
      });

      const matchingRecipes = product.recipeItems.filter(
        (r) => r.sizeId === size.sizeId,
      );
      for (const recipe of matchingRecipes) {
        const current = requiredByIngredient.get(recipe.ingredientId) ?? 0;
        requiredByIngredient.set(
          recipe.ingredientId,
          current + recipe.requiredAmount * item.quantity,
        );
      }
    }

    return { lines, subtotal, requiredByIngredient };
  }

  private async lockAndDeductIngredients(
    tx: Prisma.TransactionClient,
    requiredByIngredient: Map<string, number>,
  ) {
    if (requiredByIngredient.size === 0) {
      return;
    }

    // Sắp xếp ingredientId tăng dần trước khi FOR UPDATE để tránh deadlock
    const sortedIds = Array.from(requiredByIngredient.keys()).sort();

    const lockedRows = await tx.$queryRaw<LockedIngredientRow[]>`
      SELECT ingredient_id, name, stock
      FROM ingredients
      WHERE ingredient_id = ANY(${sortedIds}::text[])
      ORDER BY ingredient_id ASC
      FOR UPDATE
    `;

    const lockedMap = new Map(lockedRows.map((row) => [row.ingredient_id, row]));

    for (const ingredientId of sortedIds) {
      const required = requiredByIngredient.get(ingredientId) ?? 0;
      const row = lockedMap.get(ingredientId);

      if (!row) {
        throw new NotFoundException(`Không tìm thấy nguyên liệu: ${ingredientId}`);
      }

      if (row.stock < required) {
        throw new ConflictException(
          `Rất tiếc, nguyên liệu "${row.name}" không đủ tồn kho (còn ${row.stock}, cần ${required}).`,
        );
      }
    }

    for (const ingredientId of sortedIds) {
      const required = requiredByIngredient.get(ingredientId) ?? 0;
      await tx.ingredient.update({
        where: { ingredientId },
        data: {
          stock: { decrement: required },
          version: { increment: 1 },
        },
      });
    }
  }

  private async calculatePromotionDiscount(
    tx: Prisma.TransactionClient,
    promotionCode: string | undefined,
    subtotal: number,
  ) {
    if (!promotionCode || promotionCode.trim() === '') {
      return { promotionId: null, promotionDiscount: 0 };
    }

    const promo = await tx.promotion.findUnique({
      where: { promotionCode: promotionCode.trim() },
    });

    if (!promo) {
      throw new BadRequestException(
        `Mã khuyến mãi "${promotionCode}" không hợp lệ hoặc không tồn tại.`,
      );
    }

    const minOrder = Number(promo.minimumOrderAmount);
    if (subtotal < minOrder) {
      throw new BadRequestException(
        `Đơn hàng cần tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để áp dụng mã ${promo.promotionCode}.`,
      );
    }

    const rawDiscount =
      promo.discountPercentage > 0
        ? Math.floor((subtotal * promo.discountPercentage) / 100)
        : Number(promo.discountAmount);

    return {
      promotionId: promo.promotionId,
      promotionDiscount: Math.min(subtotal, rawDiscount),
    };
  }

  private async prepareLoyaltyRedemption(
    tx: Prisma.TransactionClient,
    userId: string,
    pointsToRedeem: number,
    remainingAmount: number,
  ) {
    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return { loyaltyId: null, pointsRedeemed: 0, loyaltyDiscount: 0 };
    }

    const loyalty = await tx.loyalty.findUnique({
      where: { userId },
    });

    if (!loyalty || loyalty.points < pointsToRedeem) {
      throw new BadRequestException(
        `Số dư điểm thưởng không đủ (hiện có ${loyalty?.points ?? 0} điểm).`,
      );
    }

    const redeemRate = Number(process.env.LOYALTY_REDEEM_RATE) || 1000;
    const rawDiscount = pointsToRedeem * redeemRate;

    return {
      loyaltyId: loyalty.loyaltyId,
      pointsRedeemed: pointsToRedeem,
      loyaltyDiscount: Math.min(remainingAmount, rawDiscount),
    };
  }
}
