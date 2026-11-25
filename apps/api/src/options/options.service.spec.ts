import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OptionsService } from './options.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OptionsService', () => {
  let service: OptionsService;

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OptionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OptionsService>(OptionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateServingsFromRecipes', () => {
    it('nên trả về isAvailable=true và maxServings=999 nếu không có công thức nguyên liệu', () => {
      const result = service.calculateServingsFromRecipes([]);
      expect(result).toEqual({ isAvailable: true, maxServings: 999 });
    });

    it('nên tính đúng maxServings dựa trên nguyên liệu có số phần tối thiểu', () => {
      const recipes = [
        { requiredAmount: 20, ingredient: { stock: 100 } }, // 100 / 20 = 5 servings
        { requiredAmount: 50, ingredient: { stock: 150 } }, // 150 / 50 = 3 servings -> chai lọ cổ chai
      ];
      const result = service.calculateServingsFromRecipes(recipes);
      expect(result).toEqual({ isAvailable: true, maxServings: 3 });
    });

    it('nên trả về isAvailable=false và maxServings=0 khi một nguyên liệu hết hàng (stock = 0)', () => {
      const recipes = [
        { requiredAmount: 20, ingredient: { stock: 100 } },
        { requiredAmount: 50, ingredient: { stock: 0 } },
      ];
      const result = service.calculateServingsFromRecipes(recipes);
      expect(result).toEqual({ isAvailable: false, maxServings: 0 });
    });

    it('nên trả về isAvailable=false khi stock nhỏ hơn requiredAmount', () => {
      const recipes = [
        { requiredAmount: 20, ingredient: { stock: 15 } },
      ];
      const result = service.calculateServingsFromRecipes(recipes);
      expect(result).toEqual({ isAvailable: false, maxServings: 0 });
    });
  });

  describe('findAll', () => {
    it('nên trả về danh sách tùy chọn và tình trạng tồn kho cho tất cả sản phẩm', async () => {
      const mockProducts = [
        {
          productId: 'p-1',
          name: 'Cà phê sữa đá',
          sizes: [
            { sizeId: 's-m', name: 'Size M', priceAdjustment: 0 },
            { sizeId: 's-l', name: 'Size L', priceAdjustment: 5000 },
          ],
          toppings: [{ toppingId: 't-1', name: 'Trân châu', price: 5000 }],
          recipeItems: [
            { sizeId: 's-m', requiredAmount: 20, ingredient: { stock: 40 } }, // 2 servings
            { sizeId: 's-l', requiredAmount: 30, ingredient: { stock: 40 } }, // 1 serving
          ],
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe('p-1');
      expect(result[0].isAvailable).toBe(true);
      expect(result[0].maxServings).toBe(2);
      expect(result[0].sizes).toEqual([
        {
          sizeId: 's-m',
          sizeName: 'Size M',
          priceAdjustment: 0,
          isAvailable: true,
          maxServings: 2,
        },
        {
          sizeId: 's-l',
          sizeName: 'Size L',
          priceAdjustment: 5000,
          isAvailable: true,
          maxServings: 1,
        },
      ]);
    });
  });

  describe('findByProductId', () => {
    it('nên trả về chi tiết tùy chọn của sản phẩm', async () => {
      const mockProduct = {
        productId: 'p-1',
        name: 'Trà Oolong',
        sizes: [
          { sizeId: 's-m', name: 'Size M', priceAdjustment: 0 },
        ],
        toppings: [],
        recipeItems: [
          { sizeId: 's-m', requiredAmount: 20, ingredient: { stock: 0 } },
        ],
      };

      mockPrisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findByProductId('p-1');

      expect(result.productId).toBe('p-1');
      expect(result.isAvailable).toBe(false);
      expect(result.maxServings).toBe(0);
      expect(result.sizes[0].isAvailable).toBe(false);
    });

    it('nên ném NotFoundException khi không tìm thấy sản phẩm', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findByProductId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
