import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyQRDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  qrCode: string;

  @IsIn(['origin', 'destination'])
  location: 'origin' | 'destination';
}
