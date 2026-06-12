import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  ValidateNested,
} from 'class-validator';

export class ReceivedQuantityDto {
  @IsInt()
  @IsPositive()
  productId: number;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class CompleteTransferDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivedQuantityDto)
  receivedQuantities?: ReceivedQuantityDto[];
}
