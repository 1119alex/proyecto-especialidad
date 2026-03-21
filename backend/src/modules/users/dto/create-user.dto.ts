import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Campos específicos para conductores
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsString()
  @IsOptional()
  licenseExpiry?: string;

  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  // Campo específico para encargados de almacén
  @IsOptional()
  warehouseId?: number;
}
