import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MockPaymentGateway } from './mock-payment-gateway';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentGateway],
})
export class PaymentsModule {}
