import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('trả về status ok và database up khi PostgreSQL kết nối bình thường', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    const result = await controller.check();

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('ok');
    expect(result.database).toBe('up');
    expect(typeof result.uptime).toBe('number');
    expect(typeof result.timestamp).toBe('string');
  });

  it('ném ServiceUnavailableException (503) khi PostgreSQL lỗi kết nối', async () => {
    mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

    await expect(controller.check()).rejects.toThrow(ServiceUnavailableException);
  });
});