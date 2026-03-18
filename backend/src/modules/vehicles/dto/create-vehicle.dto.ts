import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;
}
