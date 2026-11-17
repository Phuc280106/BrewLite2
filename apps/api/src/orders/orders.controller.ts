import { Body, Controller, Post, Req } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

interface RequestWithOptionalUser {
  user?: {
    userId?: string;
  };
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/v1/orders (Phân hệ 5: Khởi tạo đơn hàng & khóa dòng tồn kho)
  @Post()
  createOrder(
    @Req() req: RequestWithOptionalUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user?.userId, createOrderDto);
  }
}
