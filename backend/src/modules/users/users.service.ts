import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { DriverProfile } from '../../entities/driver-profile.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepository: Repository<DriverProfile>,
    @InjectRepository(WarehouseStaffProfile)
    private readonly warehouseStaffRepository: Repository<WarehouseStaffProfile>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar si el email ya existe
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validar datos según el rol ANTES de crear el usuario
    if (createUserDto.role === UserRole.TRANSPORTISTA) {
      if (!createUserDto.licenseNumber || !createUserDto.licenseExpiry) {
        throw new BadRequestException(
          'Los conductores requieren número de licencia y fecha de expiración',
        );
      }
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Crear usuario
    const user = this.userRepository.create({
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: createUserDto.phone,
      role: createUserDto.role,
      isActive: createUserDto.isActive !== undefined ? createUserDto.isActive : true,
    });

    const savedUser = await this.userRepository.save(user);

    // Crear perfil según el rol
    if (createUserDto.role === UserRole.TRANSPORTISTA) {
      await this.driverProfileRepository.save({
        userId: savedUser.id,
        licenseNumber: createUserDto.licenseNumber!,
        licenseExpiry: new Date(createUserDto.licenseExpiry!),
        emergencyContact: createUserDto.emergencyContact,
        emergencyPhone: createUserDto.emergencyPhone,
      });
    }
    // Nota: Los encargados de almacén se asignan a través del formulario de almacenes

    return this.findOne(savedUser.id);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
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
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
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
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['driverProfile', 'warehouseStaffProfile'],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Si se actualiza la contraseña
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto['passwordHash'] = await bcrypt.hash(
        updateUserDto.password,
        saltRounds,
      );
      delete updateUserDto.password;
    }

    // Actualizar usuario
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // Actualizar perfil de conductor si es necesario
    if (
      user.role === UserRole.TRANSPORTISTA &&
      (updateUserDto.licenseNumber || updateUserDto.licenseExpiry)
    ) {
      const driverProfile = await this.driverProfileRepository.findOne({
        where: { userId: id },
      });

      if (driverProfile) {
        if (updateUserDto.licenseNumber) {
          driverProfile.licenseNumber = updateUserDto.licenseNumber;
        }
        if (updateUserDto.licenseExpiry) {
          driverProfile.licenseExpiry = new Date(updateUserDto.licenseExpiry);
        }
        await this.driverProfileRepository.save(driverProfile);
      }
    }

    // Actualizar perfil de encargado de almacén si es necesario
    if (
      user.role === UserRole.ENCARGADO_ALMACEN &&
      updateUserDto.warehouseId
    ) {
      const warehouseStaff = await this.warehouseStaffRepository.findOne({
        where: { userId: id },
      });

      if (warehouseStaff) {
        warehouseStaff.warehouseId = updateUserDto.warehouseId;
        await this.warehouseStaffRepository.save(warehouseStaff);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);

    // Soft delete - solo desactivar
    user.isActive = false;
    await this.userRepository.save(user);
  }

  async findDrivers(): Promise<User[]> {
    return this.userRepository.find({
      where: { role: UserRole.TRANSPORTISTA, isActive: true },
      relations: ['driverProfile'],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });
  }

  async findWarehouseStaff(warehouseId?: number): Promise<User[]> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.warehouseStaffProfile', 'profile')
      .leftJoinAndSelect('profile.warehouse', 'warehouse')
      .where('user.role = :role', {
        role: UserRole.ENCARGADO_ALMACEN,
      })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .select([
        'user.id',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.phone',
        'user.role',
        'profile',
        'warehouse.id',
        'warehouse.name',
      ]);

    if (warehouseId) {
      query.andWhere('profile.warehouseId = :warehouseId', { warehouseId });
    }

    return query.getMany();
  }
}
