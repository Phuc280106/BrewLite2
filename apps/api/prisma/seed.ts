import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Đang dọn dẹp và nạp lại dữ liệu mẫu cho Thực đơn BrewLite...');

  // 0. Xóa dữ liệu cũ theo đúng thứ tự khóa ngoại để tránh lỗi khi chạy lại seed
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.loyalty.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.recipeItems.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.size.deleteMany();
  await prisma.topping.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.ingredient.deleteMany();
  await prisma.user.deleteMany();

  // 1. Tạo các Danh mục mẫu chuẩn theo thiết kế Figma
  const caPhePhin = await prisma.category.create({
    data: {
      name: 'Cà phê pha phin',
      description: 'Cà phê pha phin truyền thống và máy nguyên chất',
    },
  });

  const traSua = await prisma.category.create({
    data: {
      name: 'Trà sữa',
      description: 'Trà đậm vị kết hợp sữa béo ngậy',
    },
  });

  const traTraiCay = await prisma.category.create({
    data: {
      name: 'Trà trái cây',
      description: 'Trà hoa quả tươi mát thanh nhiệt',
    },
  });

  const daXay = await prisma.category.create({
    data: {
      name: 'Đá xay',
      description: 'Thức uống đá xay nhuyễn mát lạnh phủ kem',
    },
  });

  const nuocEp = await prisma.category.create({
    data: {
      name: 'Nước ép',
      description: 'Nước ép trái cây tươi nguyên chất 100%',
    },
  });

  // 2. Tạo các Kích cỡ mẫu chuẩn theo thiết kế Figma (Size M, L)
  const sizeM = await prisma.size.create({
    data: { name: 'M (Vừa)', priceAdjustment: 0 },
  });
  const sizeL = await prisma.size.create({
    data: { name: 'L (Lớn)', priceAdjustment: 8000 },
  });

  // 3. Tạo các Topping mẫu chuẩn (kèm khối lượng tồn kho & định mức mỗis phần)
  const topTranChau = await prisma.topping.create({
    data: { name: 'Trân châu đen', price: 5000, unit: 'g', stock: 1000, requiredAmount: 20 },
  });
  const topPudding = await prisma.topping.create({
    data: { name: 'Pudding trứng', price: 8000, unit: 'g', stock: 600, requiredAmount: 15 },
  });
  const topKemCheese = await prisma.topping.create({
    data: { name: 'Kem cheese', price: 10000, unit: 'g', stock: 500, requiredAmount: 10 },
  });

  // 4. Danh sách 10 món nước mẫu của Phước (khớp 100% với giao diện Figma)
  const sampleProducts = [
    {
      name: 'Trà Sữa Oolong Nướng',
      desc: 'Hương trà nướng, béo mịn',
      price: 38000,
      catId: traSua.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&q=80',
    },
    {
      name: 'Cà Phê Muối Hoàng Gia',
      desc: 'Vị béo ngậy, đậm đà',
      price: 35000,
      catId: caPhePhin.categoryId,
      imageUrl: 'https://plus.unsplash.com/premium_photo-1723485688045-b076aa969c9a?q=80&w=1169',
    },
    {
      name: 'Trà Đào Cam Sả Thượng Hạng',
      desc: 'Hương sả thanh khiết kết hợp đào giòn ngọt',
      price: 39000,
      catId: traTraiCay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1709003995898-ca69b07a8ef3?q=80&w=687',
    },
    {
      name: 'Cà phê sữa đá',
      desc: 'Đậm đà hương vị cà phê phin truyền thống',
      price: 29000,
      catId: caPhePhin.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    },
    {
      name: 'Americano đá',
      desc: 'Espresso pha loãng thanh nhẹ mát lạnh',
      price: 35000,
      catId: caPhePhin.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1517959105821-eaf2591984ca?q=80&w=1173',
    },
    {
      name: 'Trà sữa trân châu',
      desc: 'Trà đen đậm đà kèm trân châu dai giòn thủ công',
      price: 35000,
      catId: traSua.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1558857563-b371033873b8?q=80&w=687',
    },
    {
      name: 'Trà vải lài',
      desc: 'Trà lài thanh khiết ướp hương vải mọng nước',
      price: 35000,
      catId: traTraiCay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1664512298340-8df247f52488?q=80&w=735',
    },
    {
      name: 'Chocolate đá xay',
      desc: 'Chocolate Bỉ xay cùng đá và whipped cream',
      price: 49000,
      catId: daXay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
    },
    {
      name: 'Matcha đá xay',
      desc: 'Đá xay matcha thơm béo sảng khoái',
      price: 49000,
      catId: daXay.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1775846933630-3c1531299e5a?q=80&w=687',
    },
    {
      name: 'Nước ép cam tươi',
      desc: 'Cam tươi vắt nguyên chất giàu vitamin C',
      price: 32000,
      catId: nuocEp.categoryId,
      imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&q=80',
    },
  ];

  const createdProducts = new Map<string, string>();
  for (const item of sampleProducts) {
    const product = await prisma.product.create({
      data: {
        name: item.name,
        description: item.desc,
        basePrice: item.price,
        imageUrl: item.imageUrl,
        categoryId: item.catId,
        sizes: {
          connect: [{ sizeId: sizeM.sizeId }, { sizeId: sizeL.sizeId }],
        },
        toppings: {
          connect: [
            { toppingId: topTranChau.toppingId },
            { toppingId: topPudding.toppingId },
            { toppingId: topKemCheese.toppingId },
          ],
        },
      },
    });
    createdProducts.set(product.name, product.productId);
  }

  // 5. Tạo tài khoản mẫu: Demo, Khách hàng (Customer) và Nhân viên pha chế (Barista)
  // 5.1 User mẫu Demo kèm ví điểm Loyalty (120 điểm)
  const demoUser = await prisma.user.create({
    data: {
      name: 'Khách hàng Demo',
      email: 'demo@brewlite.vn',
      passwordHash: 'demo-placeholder-hash',
      role: 'CUSTOMER',
      loyalty: {
        create: {
          points: 120,
        },
      },
    },
  });

  // 5.2 Khách hàng mẫu (Customer) và Nhân viên pha chế (Barista) có mã hóa mật khẩu bcrypt
  const defaultPassword = '123456';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  // Khách hàng mẫu (Customer) - Có sẵn giỏ hàng và 50 điểm tích lũy
  const customer = await prisma.user.create({
    data: {
      name: 'Nguyễn Văn Khách',
      email: 'customer@gmail.com',
      passwordHash,
      role: 'CUSTOMER',
      cart: {
        create: {},
      },
      loyalty: {
        create: {
          points: 50,
        },
      },
    },
  });

  // Nhân viên pha chế mẫu (Barista)
  const barista = await prisma.user.create({
    data: {
      name: 'Trần Barista',
      email: 'barista@gmail.com',
      passwordHash,
      role: 'BARISTA',
    },
  });

  // 6. Tạo 2 mã khuyến mãi Promotion mẫu
  await prisma.promotion.createMany({
    data: [
      {
        promotionCode: 'BREWLITE10',
        description: 'Giảm 10% cho đơn từ 50.000đ',
        minimumOrderAmount: 50000,
        discountAmount: 0,
        discountPercentage: 10,
      },
      {
        promotionCode: 'GIAM15K',
        description: 'Giảm 15.000đ cho đơn từ 80.000đ',
        minimumOrderAmount: 80000,
        discountAmount: 15000,
        discountPercentage: 0,
      },
    ],
  });

  // 7. Tạo kho Nguyên liệu (Ingredient)
  const ingCoffee = await prisma.ingredient.create({
    data: { name: 'Hạt cà phê Arabica', unit: 'g', stock: 1000 },
  });
  const ingMilk = await prisma.ingredient.create({
    data: { name: 'Sữa tươi', unit: 'ml', stock: 5000 },
  });
  const ingOolong = await prisma.ingredient.create({
    data: { name: 'Trà Oolong', unit: 'g', stock: 500 },
  });
  const ingBlackTea = await prisma.ingredient.create({
    data: { name: 'Hồng trà', unit: 'g', stock: 500 },
  });
  const ingMatcha = await prisma.ingredient.create({
    data: { name: 'Bột Matcha', unit: 'g', stock: 400 },
  });
  const ingPeach = await prisma.ingredient.create({
    data: { name: 'Đào ngâm', unit: 'miếng', stock: 100 },
  });
  const ingChocolate = await prisma.ingredient.create({
    data: { name: 'Bột Chocolate', unit: 'g', stock: 600 },
  });
  const ingOrange = await prisma.ingredient.create({
    data: { name: 'Cam tươi', unit: 'quả', stock: 100 },
  });
  const ingBoba = await prisma.ingredient.create({
    data: { name: 'Trân châu đen', unit: 'g', stock: 1000 },
  });

  // 8. Tạo Công thức (RecipeItems) cho 10 món × 2 size (M, L)
  const recipeDefinitions: Array<{
    productName: string;
    ingredients: Array<{ ingredientId: string; mAmount: number; lAmount: number }>;
  }> = [
    {
      productName: 'Trà Sữa Oolong Nướng',
      ingredients: [
        { ingredientId: ingOolong.ingredientId, mAmount: 15, lAmount: 22 },
        { ingredientId: ingMilk.ingredientId, mAmount: 180, lAmount: 250 },
      ],
    },
    {
      productName: 'Cà Phê Muối Hoàng Gia',
      ingredients: [
        { ingredientId: ingCoffee.ingredientId, mAmount: 20, lAmount: 28 },
        { ingredientId: ingMilk.ingredientId, mAmount: 120, lAmount: 170 },
      ],
    },
    {
      productName: 'Trà Đào Cam Sả Thượng Hạng',
      ingredients: [
        { ingredientId: ingBlackTea.ingredientId, mAmount: 12, lAmount: 18 },
        { ingredientId: ingPeach.ingredientId, mAmount: 3, lAmount: 5 },
        { ingredientId: ingOrange.ingredientId, mAmount: 1, lAmount: 2 },
      ],
    },
    {
      productName: 'Cà phê sữa đá',
      ingredients: [
        { ingredientId: ingCoffee.ingredientId, mAmount: 20, lAmount: 28 },
        { ingredientId: ingMilk.ingredientId, mAmount: 80, lAmount: 120 },
      ],
    },
    {
      productName: 'Americano đá',
      ingredients: [{ ingredientId: ingCoffee.ingredientId, mAmount: 18, lAmount: 26 }],
    },
    {
      productName: 'Trà sữa trân châu',
      ingredients: [
        { ingredientId: ingBlackTea.ingredientId, mAmount: 15, lAmount: 22 },
        { ingredientId: ingMilk.ingredientId, mAmount: 180, lAmount: 250 },
        { ingredientId: ingBoba.ingredientId, mAmount: 40, lAmount: 60 },
      ],
    },
    {
      productName: 'Trà vải lài',
      ingredients: [{ ingredientId: ingOolong.ingredientId, mAmount: 12, lAmount: 18 }],
    },
    {
      productName: 'Chocolate đá xay',
      ingredients: [
        { ingredientId: ingChocolate.ingredientId, mAmount: 30, lAmount: 45 },
        { ingredientId: ingMilk.ingredientId, mAmount: 150, lAmount: 220 },
      ],
    },
    {
      productName: 'Matcha đá xay',
      ingredients: [
        { ingredientId: ingMatcha.ingredientId, mAmount: 15, lAmount: 22 },
        { ingredientId: ingMilk.ingredientId, mAmount: 150, lAmount: 220 },
      ],
    },
    {
      productName: 'Nước ép cam tươi',
      ingredients: [{ ingredientId: ingOrange.ingredientId, mAmount: 2, lAmount: 3 }],
    },
  ];

  const recipeRows: Array<{
    productId: string;
    sizeId: string;
    ingredientId: string;
    requiredAmount: number;
  }> = [];

  for (const def of recipeDefinitions) {
    const productId = createdProducts.get(def.productName);
    if (!productId) continue;
    for (const ing of def.ingredients) {
      recipeRows.push(
        {
          productId,
          sizeId: sizeM.sizeId,
          ingredientId: ing.ingredientId,
          requiredAmount: ing.mAmount,
        },
        {
          productId,
          sizeId: sizeL.sizeId,
          ingredientId: ing.ingredientId,
          requiredAmount: ing.lAmount,
        },
      );
    }
  }

  await prisma.recipeItems.createMany({ data: recipeRows });

  console.log(
    `Đã nạp xong: 5 danh mục, 2 size, 3 topping, 10 món nước, 9 nguyên liệu, ${recipeRows.length} công thức, 2 mã giảm giá.`,
  );
  console.log(`- Tài khoản Demo:       ${demoUser.email} (Role: ${demoUser.role})`);
  console.log(`- Tài khoản Khách hàng: ${customer.email} (Mật khẩu: ${defaultPassword}, Role: ${customer.role})`);
  console.log(`- Tài khoản Barista:    ${barista.email} (Mật khẩu: ${defaultPassword}, Role: ${barista.role})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
