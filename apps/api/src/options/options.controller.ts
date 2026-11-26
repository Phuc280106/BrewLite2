import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionsService } from './options.service';

@ApiTags('Options')
@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả topping và trạng thái tồn kho' })
  findAll() {
    return this.optionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một topping' })
  findByToppingId(@Param('id', ParseUUIDPipe) id: string) {
    return this.optionsService.findByToppingId(id);
  }
}
