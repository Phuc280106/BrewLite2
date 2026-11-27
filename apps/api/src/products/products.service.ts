import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán isAvailable và maxServings theo công thức RecipeItems và tồn kho Ingredient.stock
   */
  calculateServingsFromRecipes(
    recipes: Array<{ requiredAmount: number; ingredient: { stock: number } }>,
  ): { isAvailable: boolean; maxServings: number } {
    if (!recipes || recipes.length === 0) {
      return { isAvailable: false, maxServings: 0 };
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

  private withAvailability(product: any) {
    const sizesWithAvailability = (product.sizes || []).map((size: any) => {
      const recipesForSize = (product.recipeItems || []).filter(
        (r: any) => r.sizeId === size.sizeId,
      );
      const { isAvailable, maxServings } = this.calculateServingsFromRecipes(recipesForSize);
      return {
        ...size,
        isAvailable,
        maxServings,
      };
    });

    let productAvailable = false;
    let productMaxServings = 0;

    if (sizesWithAvailability.length > 0) {
      productAvailable = sizesWithAvailability.some((s: any) => s.isAvailable);
      productMaxServings = Math.max(...sizesWithAvailability.map((s: any) => s.maxServings));
    } else {
      const general = this.calculateServingsFromRecipes(product.recipeItems || []);
      productAvailable = general.isAvailable;
      productMaxServings = general.maxServings;
    }

    const rest = { ...product };
    delete rest.recipeItems;
    return {
      ...rest,
      isAvailable: productAvailable,
      maxServings: productMaxServings,
      ...(product.sizes ? { sizes: sizesWithAvailability } : {}),
    };
  }

  // sequence-menu-view & sequence-menu-filter: layDanhSachSanPham & locVaTimKiem
  async findAll(query: QueryProductDto) {
    const { categoryId, search } = query;
    const where: any = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        sizes: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((product) => this.withAvailability(product));
  }

  // sequence-menu-detail: layChiTietSanPham(id)
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { productId: id },
      include: {
        category: true,
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
      throw new NotFoundException(`Không tìm thấy đồ uống có mã ID: ${id}`);
    }

    return this.withAvailability(product);
  }

  // Phục vụ thanh lọc danh mục trên Frontend
  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }
}