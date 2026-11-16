import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    product: {
      findMany: jest.fn().mockResolvedValue([
        {
          productId: 'prod-1',
          name: 'Cà phê sữa đá',
          basePrice: 29000,
          categoryId: 'cat-1',
        },
      ]),
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn().mockResolvedValue([
        {
          categoryId: 'cat-1',
          name: 'Cà phê',
        },
      ]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return products array', async () => {
    const products = await service.findAll({});
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Cà phê sữa đá');
  });

  it('findAllCategories should return categories array', async () => {
    const categories = await service.findAllCategories();
    expect(categories).toHaveLength(1);
    expect(categories[0].name).toBe('Cà phê');
  });
});
