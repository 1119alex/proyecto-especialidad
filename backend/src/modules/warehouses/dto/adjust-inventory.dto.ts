import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export type InventoryAdjustMode = 'add' | 'set';

export class AdjustInventoryDto {
  @IsInt()
  @IsPositive()
  productId: number;

  /**
   * En modo 'add' es la cantidad a sumar; en modo 'set' es el total al que
   * queda fijado el stock. Siempre >= 0 (para reducir usa el modo 'set').
   */
  @IsNumber()
  @Min(0)
  quantity: number;

  /** 'add' suma al stock actual (ENTRADA); 'set' fija el total (AJUSTE). Def: 'set'. */
  @IsOptional()
  @IsIn(['add', 'set'])
  mode?: InventoryAdjustMode;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
