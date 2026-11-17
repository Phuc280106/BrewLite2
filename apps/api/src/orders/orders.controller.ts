import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

interface JwtPayloadUser {
  userId?: string;
  sub?: string;
}

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/v1/orders (Phân hệ 5: Khởi tạo đơn hàng & khóa dòng tồn kho)
  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới và khóa dòng tồn kho nguyên liệu' })
  createOrder(
    @CurrentUser() user: JwtPayloadUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.createOrder(userId, createOrderDto);
  }
}
