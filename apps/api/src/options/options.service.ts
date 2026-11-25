import { Injectable, NotFoundException } from '@nestjs/common';
import { Topping } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ToppingAvailability {
  toppingId: string;
  name: string;
  price: number;
  stock: number;
  requiredAmount: number;
  isAvailable: boolean;
  maxServings: number;
}

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán isAvailable và maxServings cho Topping theo stock và requiredAmount
   */
  calculateToppingServings(topping: {
    stock?: number | null;
    requiredAmount?: number | null;
  }): { isAvailable: boolean; maxServings: number } {
    const stock = topping.stock ?? 0;
    const required = topping.requiredAmount ?? 1;

    if (required <= 0) {
      return { isAvailable: true, maxServings: 999 };
    }

    const maxServings = Math.max(0, Math.floor(stock / required));
    return {
      isAvailable: maxServings > 0,
      maxServings,
    };
  }

  /**
   * GET /api/v1/options
   * Lấy danh sách toàn bộ topping và trạng thái tồn kho từ bảng toppings
   */
  async findAll(): Promise<ToppingAvailability[]> {
    const toppings = await this.prisma.topping.findMany({
      orderBy: { name: 'asc' },
    });

    return toppings.map((t) => this.mapTopping(t));
  }

  /**
   * GET /api/v1/options/:id
   * Lấy một topping cùng trạng thái tồn kho theo id
   */
  async findByToppingId(toppingId: string): Promise<ToppingAvailability> {
    const topping = await this.prisma.topping.findUnique({
      where: { toppingId },
    });

    if (!topping) {
      throw new NotFoundException(`Không tìm thấy topping có mã: ${toppingId}`);
    }

    return this.mapTopping(topping);
  }

  private mapTopping(topping: Topping): ToppingAvailability {
    const { isAvailable, maxServings } =
      this.calculateToppingServings(topping);
    return {
      toppingId: topping.toppingId,
      name: topping.name,
      price: Number(topping.price),
      stock: topping.stock,
      requiredAmount: topping.requiredAmount,
      isAvailable,
      maxServings,
    };
  }
}
