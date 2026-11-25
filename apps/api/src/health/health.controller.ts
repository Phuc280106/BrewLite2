import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/v1/health
  @Get()
  @ApiOperation({ summary: 'Kiểm tra trạng thái server và kết nối PostgreSQL' })
  @ApiResponse({ status: 200, description: 'Server và PostgreSQL hoạt động bình thường' })
  @ApiResponse({ status: 503, description: 'Không thể kết nối tới PostgreSQL' })
  async check() {
    const timestamp = new Date().toISOString();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        database: 'up',
        uptime: Math.floor(process.uptime()),
        timestamp,
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'down',
        timestamp,
      });
    }
  }
}