import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // GET /api/v1/promotions (Public: trả danh sách mã khuyến mãi từ DB)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách mã khuyến mãi hiện có từ cơ sở dữ liệu' })
  @ApiResponse({ status: 200, description: 'Danh sách mã khuyến mãi khả dụng' })
  findAll() {
    return this.promotionsService.findAll();
  }
}
