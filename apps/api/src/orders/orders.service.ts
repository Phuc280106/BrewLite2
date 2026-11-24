import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  LoyaltyTransactionType,
  OrderStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, OrderItemInputDto } from './dto/create-order.dto';
import { ORDER_PAYMENT_TTL_MS } from './order-expiry.constants';
import { assertTransition } from './order-state-machine';

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
  async createOrder(authUserId: string, dto: CreateOrderDto) {
    if (!authUserId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để đặt đơn hàng');
    }

    return this.prisma.$transaction(async (tx) => {
      const userId = await this.resolveUserId(tx, authUserId);

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

  /**
   * Sequence "Hủy đơn & hoàn kho khi quá 15 phút" (huyDonQuaHan):
   * tìm đơn PENDING quá hạn, mỗi đơn xử lý trong 1 transaction riêng:
   * chuyển CANCELLED + hoàn kho nguyên liệu. Trả về số đơn đã hủy.
   */
  async cancelExpiredOrders(now: Date = new Date()): Promise<number> {
    const threshold = new Date(now.getTime() - ORDER_PAYMENT_TTL_MS);

    // timDonChoThanhToanQuaHan
    const expiredOrders = await this.prisma.order.findMany({
      where: { status: OrderStatus.PENDING, createdAt: { lt: threshold } },
      select: { orderId: true },
    });

    let cancelled = 0;
    for (const { orderId } of expiredOrders) {
      try {
        if (await this.cancelAndRestoreStock(orderId)) cancelled += 1;
      } catch (error) {
        // Một đơn lỗi không được chặn các đơn còn lại; lượt quét sau sẽ thử lại
        console.error(`[OrdersService] Không thể hủy đơn quá hạn ${orderId}:`, error);
      }
    }
    return cancelled;
  }

  private async cancelAndRestoreStock(orderId: string): Promise<boolean> {
    // batDauGiaoDich ... xacNhanGiaoDich (BEGIN ... COMMIT)
    return this.prisma.$transaction(async (tx) => {
      // Chốt trạng thái trước: nếu khách vừa thanh toán xong (đã PREPARING) thì bỏ qua đơn này
      const updated = await tx.order.updateMany({
        where: { orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.CANCELLED },
      });
      if (updated.count !== 1) return false;

      const order = await tx.order.findUniqueOrThrow({
        where: { orderId },
        include: { items: true },
      });

      // hoanKhoNguyenLieu(donHang): cộng lại đúng lượng đã trừ ở createOrder
      const restoreByIngredient = new Map<string, number>();
      for (const item of order.items) {
        const recipes = await tx.recipeItems.findMany({
          where: { productId: item.productId, sizeId: item.sizeId },
        });
        for (const recipe of recipes) {
          restoreByIngredient.set(
            recipe.ingredientId,
            (restoreByIngredient.get(recipe.ingredientId) ?? 0) +
              recipe.requiredAmount * item.quantity,
          );
        }
      }

      // Sắp xếp theo id để thứ tự khóa dòng giống createOrder, tránh deadlock
      for (const ingredientId of Array.from(restoreByIngredient.keys()).sort()) {
        await tx.ingredient.update({
          where: { ingredientId },
          data: {
            stock: { increment: restoreByIngredient.get(ingredientId) ?? 0 },
            version: { increment: 1 },
          },
        });
      }
      return true;
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

  /**
   * FR-08: Lấy danh sách lịch sử đơn hàng cá nhân của người dùng đang đăng nhập
   * Sắp xếp theo thời gian tạo mới nhất lên đầu (createdAt DESC).
   */
  async findMyOrders(authUserId: string) {
    if (!authUserId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để xem lịch sử đơn hàng');
    }

    return this.prisma.order.findMany({
      where: { userId: authUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            size: true,
            toppings: true,
            product: {
              select: {
                productId: true,
                imageUrl: true,
              },
            },
          },
        },
        promotion: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        loyaltyTransactions: true,
      },
    });
  }

  /**
   * FR-07: Lấy chi tiết biên nhận & trạng thái đơn hàng có kiểm tra quyền sở hữu.
   * Chủ đơn hàng hoặc nhân viên quầy (BARISTA / ADMIN) đều có quyền tra cứu.
   */
  async findOneForUser(orderId: string, authUserId: string, role?: string) {
    if (!authUserId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để xem biên nhận đơn hàng');
    }

    const order = await this.prisma.order.findUnique({
      where: { orderId },
      include: {
        items: {
          include: {
            size: true,
            toppings: true,
            product: {
              select: {
                productId: true,
                imageUrl: true,
              },
            },
          },
        },
        promotion: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        loyaltyTransactions: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng có mã: ${orderId}`);
    }

    const isStaff = role === 'BARISTA' || role === 'ADMIN';
    if (order.userId !== authUserId && !isStaff) {
      throw new ForbiddenException('Bạn không có quyền xem thông tin đơn hàng này');
    }

    return order;
  }

  /**
   * Helper: Hoàn trả lại tồn kho nguyên liệu theo đúng công thức & size của từng món.
   * Sắp xếp id nguyên liệu tăng dần để tránh deadlock khi khóa dòng.
   */
  private async refundIngredientsForOrder(
    tx: Prisma.TransactionClient,
    order: {
      items: Array<{
        sizeId: string;
        quantity: number;
        product: {
          recipeItems: Array<{
            sizeId: string;
            ingredientId: string;
            requiredAmount: number;
          }>;
        };
      }>;
    },
  ) {
    const refundByIngredient = new Map<string, number>();
    for (const item of order.items) {
      const recipes = item.product.recipeItems.filter(
        (r) => r.sizeId === item.sizeId,
      );
      for (const recipe of recipes) {
        const current = refundByIngredient.get(recipe.ingredientId) ?? 0;
        refundByIngredient.set(
          recipe.ingredientId,
          current + recipe.requiredAmount * item.quantity,
        );
      }
    }

    const sortedIngredientIds = Array.from(refundByIngredient.keys()).sort();
    for (const ingredientId of sortedIngredientIds) {
      const refundAmount = refundByIngredient.get(ingredientId) ?? 0;
      if (refundAmount > 0) {
        await tx.ingredient.update({
          where: { ingredientId },
          data: {
            stock: { increment: refundAmount },
            version: { increment: 1 },
          },
        });
      }
    }
  }

  /**
   * FR-12: Khách hàng hủy đơn hàng (khi đang PENDING / PAID / PAYMENT_FAILED)
   * và hoàn trả lại tồn kho nguyên liệu trong cùng transaction.
   */
  async cancelMyOrder(orderId: string, authUserId: string) {
    if (!authUserId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để hủy đơn hàng');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  recipeItems: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng có mã: ${orderId}`);
      }

      if (order.userId !== authUserId) {
        throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
      }

      // Kiểm tra chuyển đổi sang CANCELLED qua State Machine (ném 400 nếu đơn đang PREPARING/READY/COMPLETED)
      assertTransition(order.status, OrderStatus.CANCELLED);

      await this.refundIngredientsForOrder(tx, order);

      return tx.order.update({
        where: { orderId },
        data: { status: OrderStatus.CANCELLED },
        include: {
          items: {
            include: {
              size: true,
              toppings: true,
              product: {
                select: {
                  productId: true,
                  imageUrl: true,
                },
              },
            },
          },
          promotion: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          loyaltyTransactions: true,
        },
      });
    });
  }

  /**
   * Phân hệ 6: Cập nhật trạng thái đơn hàng tuân thủ Order State Machine
   *   - PAID -> PREPARING (Barista nhận đơn)
   *   - PREPARING -> READY (Pha xong)
   *   - READY -> COMPLETED (Đã giao khách)
   *   - PENDING / PAID / PAYMENT_FAILED -> CANCELLED (Hủy đơn & hoàn kho)
   * Mọi chuyển trạng thái sai hoặc đi lùi sẽ bị assertTransition ném lỗi 400 Bad Request.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    authUserId: string,
    role?: string,
  ) {
    if (!authUserId) {
      throw new UnauthorizedException('Vui lòng đăng nhập để cập nhật trạng thái đơn hàng');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  recipeItems: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new NotFoundException(`Không tìm thấy đơn hàng có mã: ${orderId}`);
      }

      // 1. Kiểm tra State Machine: ném 400 Bad Request nếu chuyển sai hoặc đi lùi
      assertTransition(order.status, newStatus);

      // 2. Phân quyền:
      // Nhân viên (BARISTA / ADMIN) có quyền chuyển tiến trình pha chế/hoàn tất
      // Khách hàng thông thường chỉ có thể hủy đơn (CANCELLED) trên đơn của mình
      const isStaff = role === 'BARISTA' || role === 'ADMIN';
      if (!isStaff) {
        if (order.userId !== authUserId) {
          throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái đơn hàng này');
        }
        if (newStatus !== OrderStatus.CANCELLED) {
          throw new ForbiddenException(
            'Khách hàng chỉ có thể hủy đơn, không có quyền chuyển tiến trình pha chế/hoàn tất.',
          );
        }
      }

      // 3. Nếu chuyển sang CANCELLED thì hoàn kho nguyên liệu
      if (newStatus === OrderStatus.CANCELLED) {
        await this.refundIngredientsForOrder(tx, order);
      }

      return tx.order.update({
        where: { orderId },
        data: { status: newStatus },
        include: {
          items: {
            include: {
              size: true,
              toppings: true,
              product: {
                select: {
                  productId: true,
                  imageUrl: true,
                },
              },
            },
          },
          promotion: true,
          payments: {
            orderBy: { createdAt: 'desc' },
          },
          loyaltyTransactions: true,
        },
      });
    });
  }

  private async resolveUserId(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<string> {
    const user = await tx.user.findUnique({
      where: { userId },
      select: { userId: true },
    });
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc không hợp lệ');
    }
    return user.userId;
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
