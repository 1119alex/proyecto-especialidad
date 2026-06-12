import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { TransferStatus } from '../../../common/enums/transfer-status.enum';

export class ReportFiltersDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  originWarehouseId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  destinationWarehouseId?: number;
}
