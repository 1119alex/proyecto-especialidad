import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsNumber()
  @IsOptional()
  minStock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
