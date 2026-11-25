import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionsService } from './options.service';

@ApiTags('Options')
@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tùy chọn/trạng thái tồn kho của tất cả sản phẩm' })
  findAll() {
    return this.optionsService.findAll();
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Lấy tùy chọn và trạng thái tồn kho (isAvailable, maxServings) theo sản phẩm' })
  findByProductId(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionsService.findByProductId(id);
  }
}
