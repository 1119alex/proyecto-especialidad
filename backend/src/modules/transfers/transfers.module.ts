import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { TrackingGateway } from './tracking.gateway';
import { AuthModule } from '../auth/auth.module';
import { Transfer } from '../../entities/transfer.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { TrackingLog } from '../../entities/tracking-log.entity';
import { Product } from '../../entities/product.entity';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryMovement } from '../../entities/inventory-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transfer,
      TransferDetail,
      TrackingLog,
      Product,
      Inventory,
      InventoryMovement,
    ]),
    // JwtModule (exportado por AuthModule) para autenticar el gateway WS
    AuthModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService, TrackingGateway],
  exports: [TransfersService],
})
export class TransfersModule {}
