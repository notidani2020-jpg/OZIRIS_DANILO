import {
  Module,
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService, SimulatedPurchaseDto } from './purchases.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TracksModule } from '../tracks/tracks.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @UseGuards(JwtAuthGuard)
  @Post('simulate')
  async simulatePayment(
    @Request() req: any,
    @Body() dto: SimulatedPurchaseDto,
  ) {
    return this.purchasesService.simulatePayment(
      req.user.id,
      req.user.role,
      dto,
    );
  }
}

@Module({
  imports: [PrismaModule, TracksModule],
  controllers: [PurchasesController, PaymentsController],
  providers: [PurchasesService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
