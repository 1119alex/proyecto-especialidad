import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Transfer } from '../../entities/transfer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transfer])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
