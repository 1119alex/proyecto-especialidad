import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WarehousesService } from './warehouses.service';
import { WarehousesController } from './warehouses.controller';
import { Warehouse } from '../../entities/warehouse.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import { User } from '../../entities/user.entity';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryMovement } from '../../entities/inventory-movement.entity';
import { Product } from '../../entities/product.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      WarehouseStaffProfile,
      User,
      Inventory,
      InventoryMovement,
      Product,
    ]),
    NotificationsModule,
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
