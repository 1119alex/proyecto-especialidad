import { IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  managerId?: number;

  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @IsNumber()
  @IsOptional()
  geofenceRadius?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
