import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductDto } from './dto/query-product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // GET /api/v1/products (hỗ trợ ?categoryId=...&search=...)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đồ uống kèm trạng thái tồn kho (isAvailable, maxServings), hỗ trợ tìm kiếm & lọc theo danh mục' })
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  // GET /api/v1/products/categories (cho CategoryFilter)
  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh mục sản phẩm (CategoryFilter)' })
  findAllCategories() {
    return this.productsService.findAllCategories();
  }

  // GET /api/v1/products/:id (xem chi tiết kèm size, topping)
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết sản phẩm kèm Size, Topping và trạng thái tồn kho (isAvailable, maxServings)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }
}