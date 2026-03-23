import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { Transfer } from '../../entities/transfer.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { TrackingLog } from '../../entities/tracking-log.entity';
import { Product } from '../../entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transfer, TransferDetail, TrackingLog, Product])],
  controllers: [TransfersController],
  providers: [TransfersService],
  exports: [TransfersService],
})
export class TransfersModule {}
