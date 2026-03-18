import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TransferDetailDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}

export class CreateTransferDto {
  @IsNumber()
  @IsNotEmpty()
  originWarehouseId: number;

  @IsNumber()
  @IsNotEmpty()
  destinationWarehouseId: number;

  @IsNumber()
  @IsOptional()
  vehicleId?: number;

  @IsNumber()
  @IsOptional()
  driverId?: number;

  @IsDateString()
  @IsOptional()
  estimatedDepartureTime?: string;

  @IsDateString()
  @IsOptional()
  estimatedArrivalTime?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferDetailDto)
  @IsNotEmpty()
  details: TransferDetailDto[];
}
