import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should filter by categoryId and trimmed search term', async () => {
    const expected = [{ productId: 'p1', name: 'Cà Phê Muối' }];
    mockPrisma.product.findMany.mockResolvedValue(expected);

    const result = await service.findAll({
      categoryId: 'cat-1',
      search: '  muối  ',
    });

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: {
        categoryId: 'cat-1',
        name: {
          contains: 'muối',
          mode: 'insensitive',
        },
      },
      include: {
        category: true,
        sizes: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual([
      {
        productId: 'p1',
        name: 'Cà Phê Muối',
        isAvailable: false,
        maxServings: 0,
      },
    ]);
  });

  it('findOne should return product with category, sizes, toppings, isAvailable, and maxServings', async () => {
    const product = {
      productId: 'p1',
      name: 'Trà Sữa Oolong Nướng',
      category: { categoryId: 'c1', name: 'Trà sữa' },
      sizes: [],
      toppings: [],
      recipeItems: [],
    };
    mockPrisma.product.findUnique.mockResolvedValue(product);

    const result = await service.findOne('p1');

    expect(mockPrisma.product.findUnique).toHaveBeenCalledWith({
      where: { productId: 'p1' },
      include: {
        category: true,
        sizes: true,
        toppings: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });
    expect(result).toEqual({
      productId: 'p1',
      name: 'Trà Sữa Oolong Nướng',
      category: { categoryId: 'c1', name: 'Trà sữa' },
      sizes: [],
      toppings: [],
      isAvailable: false,
      maxServings: 0,
    });
  });

  it('calculateServingsFromRecipes should compute isAvailable and maxServings accurately', () => {
    expect(service.calculateServingsFromRecipes([])).toEqual({
      isAvailable: false,
      maxServings: 0,
    });

    expect(
      service.calculateServingsFromRecipes([
        { requiredAmount: 20, ingredient: { stock: 65 } },
        { requiredAmount: 10, ingredient: { stock: 50 } },
      ]),
    ).toEqual({ isAvailable: true, maxServings: 3 });

    expect(
      service.calculateServingsFromRecipes([
        { requiredAmount: 20, ingredient: { stock: 0 } },
      ]),
    ).toEqual({ isAvailable: false, maxServings: 0 });
  });

  it('findOne should throw NotFoundException when product does not exist', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('findAllCategories should return categories ordered by name', async () => {
    const categories = [{ categoryId: 'c1', name: 'Cà phê pha phin' }];
    mockPrisma.category.findMany.mockResolvedValue(categories);

    const result = await service.findAllCategories();

    expect(mockPrisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(categories);
  });
});
