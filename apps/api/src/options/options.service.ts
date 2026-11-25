import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SizeAvailability {
  sizeId: string;
  sizeName: string;
  priceAdjustment: number;
  isAvailable: boolean;
  maxServings: number;
}

export interface ProductOptionsResponse {
  productId: string;
  productName: string;
  isAvailable: boolean;
  maxServings: number;
  sizes: SizeAvailability[];
  toppings: Array<{
    toppingId: string;
    name: string;
    price: number;
  }>;
}

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán isAvailable và maxServings theo công thức RecipeItems và tồn kho Ingredient.stock
   */
  calculateServingsFromRecipes(
    recipes: Array<{ requiredAmount: number; ingredient: { stock: number } }>,
  ): { isAvailable: boolean; maxServings: number } {
    if (!recipes || recipes.length === 0) {
      // Nếu món không có công thức nguyên liệu ràng buộc thì mặc định luôn sẵn sàng
      return { isAvailable: true, maxServings: 999 };
    }

    let minServings = Infinity;

    for (const recipe of recipes) {
      const required = recipe.requiredAmount;
      const stock = recipe.ingredient?.stock ?? 0;

      if (required <= 0) continue;

      const servings = Math.floor(stock / required);
      if (servings < minServings) {
        minServings = servings;
      }
    }

    const maxServings = minServings === Infinity ? 999 : Math.max(0, minServings);
    return {
      isAvailable: maxServings > 0,
      maxServings,
    };
  }

  /**
   * GET /api/v1/options
   * Lấy danh sách tùy chọn kèm isAvailable & maxServings cho toàn bộ sản phẩm
   */
  async findAll(): Promise<ProductOptionsResponse[]> {
    const products = await this.prisma.product.findMany({
      include: {
        sizes: true,
        toppings: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => this.mapProductOptions(product));
  }

  /**
   * GET /api/v1/options/products/:id
   * Lấy tùy chọn kèm isAvailable & maxServings cho 1 sản phẩm cụ thể
   */
  async findByProductId(productId: string): Promise<ProductOptionsResponse> {
    const product = await this.prisma.product.findUnique({
      where: { productId },
      include: {
        sizes: true,
        toppings: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có mã: ${productId}`);
    }

    return this.mapProductOptions(product);
  }

  private mapProductOptions(product: any): ProductOptionsResponse {
    const sizeAvailabilities: SizeAvailability[] = (product.sizes || []).map((size: any) => {
      const recipesForSize = (product.recipeItems || []).filter(
        (r: any) => r.sizeId === size.sizeId,
      );

      const { isAvailable, maxServings } = this.calculateServingsFromRecipes(recipesForSize);

      return {
        sizeId: size.sizeId,
        sizeName: size.name,
        priceAdjustment: Number(size.priceAdjustment),
        isAvailable,
        maxServings,
      };
    });

    // Món được coi là available nếu có ít nhất 1 size còn hàng (hoặc nếu món không có size thì xét theo recipeItems chung)
    let productAvailable = false;
    let productMaxServings = 0;

    if (sizeAvailabilities.length > 0) {
      productAvailable = sizeAvailabilities.some((s) => s.isAvailable);
      productMaxServings = Math.max(...sizeAvailabilities.map((s) => s.maxServings));
    } else {
      const general = this.calculateServingsFromRecipes(product.recipeItems || []);
      productAvailable = general.isAvailable;
      productMaxServings = general.maxServings;
    }

    return {
      productId: product.productId,
      productName: product.name,
      isAvailable: productAvailable,
      maxServings: productMaxServings,
      sizes: sizeAvailabilities,
      toppings: (product.toppings || []).map((t: any) => ({
        toppingId: t.toppingId,
        name: t.name,
        price: Number(t.price),
      })),
    };
  }
}
