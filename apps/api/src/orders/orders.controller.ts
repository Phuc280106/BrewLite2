import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

interface JwtPayloadUser {
  userId?: string;
  sub?: string;
  role?: string;
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

  // GET /api/v1/orders/me (Phân hệ 6 - FR-08: Lịch sử đơn hàng cá nhân)
  @Get('me')
  @ApiOperation({ summary: 'Lấy danh sách lịch sử đơn hàng của người dùng hiện tại' })
  getMyOrders(@CurrentUser() user: JwtPayloadUser) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.findMyOrders(userId);
  }

  // GET /api/v1/orders/my-orders (Alias tương thích đặc tả usecase-order-history-spec.md)
  @Get('my-orders')
  @ApiOperation({ summary: 'Lấy lịch sử đơn hàng cá nhân (alias của /orders/me)' })
  getMyOrdersAlias(@CurrentUser() user: JwtPayloadUser) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.findMyOrders(userId);
  }

  // GET /api/v1/orders/queue (Phân hệ 6 - FR-09: Hàng đợi đơn hàng cho Barista / KDS)
  @Get('queue')
  @ApiOperation({
    summary:
      'Lấy danh sách hàng đợi các đơn đang chờ pha chế (PAID, PREPARING, READY) cho Barista',
  })
  getBaristaQueue(@CurrentUser() user: JwtPayloadUser) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.findBaristaQueue(userId, user?.role);
  }

  // GET /api/v1/orders/:id (Phân hệ 6 - FR-07: Chi tiết biên nhận & theo dõi trạng thái)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết biên nhận và tiến trình trạng thái đơn hàng' })
  getOrderById(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.findOneForUser(orderId, userId, user?.role);
  }

  // PATCH /api/v1/orders/:id/status (Phân hệ 6: Order State Machine assertTransition)
  @Patch(':id/status')
  @ApiOperation({
    summary:
      'Cập nhật trạng thái đơn hàng (PAID -> PREPARING -> READY -> COMPLETED hoặc CANCELLED)',
  })
  updateOrderStatus(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.updateOrderStatus(
      orderId,
      dto.status,
      userId,
      user?.role,
    );
  }

  // PATCH /api/v1/orders/:id/cancel (FR-12: Khách hủy đơn khi đang ở trạng thái PENDING / PAID / PAYMENT_FAILED)
  @Patch(':id/cancel')
  @ApiOperation({
    summary:
      'Hủy đơn hàng khi đang ở trạng thái chờ tiếp nhận hoặc thanh toán thất bại (PENDING/PAID/PAYMENT_FAILED)',
  })
  cancelMyOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    const userId = user?.userId || user?.sub;
    if (!userId) {
      throw new UnauthorizedException('Không xác định được người dùng từ JWT');
    }
    return this.ordersService.cancelMyOrder(orderId, userId);
  }
}
