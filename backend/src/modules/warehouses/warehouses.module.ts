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
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService],
  exports: [WarehousesService],
})
export class WarehousesModule {}
