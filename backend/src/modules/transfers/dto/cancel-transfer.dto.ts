import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelTransferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
