import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterFcmTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token: string;
}
