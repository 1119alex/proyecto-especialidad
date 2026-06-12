import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { Notification } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, WarehouseStaffProfile]),
    RealtimeModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
