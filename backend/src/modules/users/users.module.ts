import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../../entities/user.entity';
import { DriverProfile } from '../../entities/driver-profile.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, DriverProfile, WarehouseStaffProfile]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
