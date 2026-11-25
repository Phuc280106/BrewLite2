import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { OptionsModule } from './options/options.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [PrismaModule, ProductsModule, OptionsModule, AuthModule, OrdersModule, PaymentsModule, LoyaltyModule, HealthModule],
})
export class AppModule {}
