import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsBoolean,
  Max,
  Min,
} from 'class-validator';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  @Min(1950)
  @Max(2100)
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsPositive()
  capacity: number;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
