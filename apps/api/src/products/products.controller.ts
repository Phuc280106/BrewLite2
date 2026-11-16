import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/v1/products (hỗ trợ ?categoryId=...&search=...)
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  // GET /api/v1/products/categories (cho CategoryFilter)
  @Get('categories')
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  // GET /api/v1/products/:id (xem chi tiết kèm size, topping)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }
}