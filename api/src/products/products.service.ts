import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  // sequence-menu-detail: layChiTietSanPham(id)
  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { productId: id },
      include: {
        category: true,
        sizes: true,
        toppings: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Không tìm thấy đồ uống có mã ID: ${id}`);
    }

    return product;
  }

  // Phục vụ thanh lọc danh mục trên Frontend
  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }
}