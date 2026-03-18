import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterAdminDto } from './dto/register-admin.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Buscar usuario por email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['warehouseStaffProfile', 'warehouseStaffProfile.warehouse'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que el usuario esté activo
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Preparar respuesta
    const response: AuthResponseDto = {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };

    // Si es encargado de almacén, incluir información del almacén
    if (user.warehouseStaffProfile?.warehouse) {
      response.user.warehouseId = user.warehouseStaffProfile.warehouse.id;
      response.user.warehouseName = user.warehouseStaffProfile.warehouse.name;
    }

    return response;
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
      relations: ['driverProfile', 'warehouseStaffProfile', 'warehouseStaffProfile.warehouse'],
    });
  }

  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['driverProfile', 'warehouseStaffProfile', 'warehouseStaffProfile.warehouse'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }

  async registerAdmin(registerAdminDto: RegisterAdminDto): Promise<AuthResponseDto> {
    // Verificar si ya existe algún administrador
    const existingAdmin = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (existingAdmin) {
      throw new ForbiddenException(
        'Ya existe un administrador registrado. Use el endpoint de creación de usuarios autenticado.',
      );
    }

    // Verificar si el email ya está en uso
    const existingUser = await this.userRepository.findOne({
      where: { email: registerAdminDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(registerAdminDto.password, saltRounds);

    // Crear usuario administrador
    const admin = new User();
    admin.email = registerAdminDto.email;
    admin.passwordHash = passwordHash;
    admin.firstName = registerAdminDto.firstName;
    admin.lastName = registerAdminDto.lastName;
    admin.phone = registerAdminDto.phone;
    admin.role = UserRole.ADMIN;
    admin.isActive = true;

    const savedAdmin = await this.userRepository.save(admin);

    // Generar token JWT
    const payload: JwtPayload = {
      sub: savedAdmin.id,
      email: savedAdmin.email,
      role: savedAdmin.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Retornar respuesta con token
    return {
      accessToken,
      user: {
        id: savedAdmin.id,
        email: savedAdmin.email,
        firstName: savedAdmin.firstName,
        lastName: savedAdmin.lastName,
        role: savedAdmin.role,
      },
    };
  }
}
