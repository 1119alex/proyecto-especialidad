import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';
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
    RealtimeModule,
    NotificationsModule,
  ],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
