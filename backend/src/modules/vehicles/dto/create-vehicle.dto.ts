import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsNotEmpty()
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
