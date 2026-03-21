import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../entities/warehouse.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import { User } from '../../entities/user.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { UserRole } from '../../common/enums/user-role.enum';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseStaffProfile)
    private readonly staffProfileRepository: Repository<WarehouseStaffProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    const { managerId, ...warehouseData } = createWarehouseDto;

    // Si se proporciona un managerId, validar
    if (managerId) {
      await this.validateManager(managerId);
    }

    // Crear el almacén
    const warehouse = this.warehouseRepository.create(warehouseData);
    const savedWarehouse = await this.warehouseRepository.save(warehouse);

    // Si hay managerId, crear el perfil de staff
    if (managerId) {
      await this.assignManager(savedWarehouse.id, managerId);
    }

    return savedWarehouse;
  }

  private async validateManager(userId: number): Promise<void> {
    // Verificar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que tiene el rol correcto
    if (user.role !== UserRole.ENCARGADO_ALMACEN) {
      throw new BadRequestException(
        `El usuario debe tener el rol ENCARGADO_ALMACEN`,
      );
    }

    // Verificar que no esté asignado a otro almacén (relación 1:1)
    const existingProfile = await this.staffProfileRepository.findOne({
      where: { userId },
    });

    if (existingProfile) {
      throw new ConflictException(
        `El usuario ya está asignado a otro almacén`,
      );
    }
  }

  private async assignManager(warehouseId: number, userId: number): Promise<void> {
    const profile = new WarehouseStaffProfile();
    profile.userId = userId;
    profile.warehouseId = warehouseId;
    profile.position = 'Encargado';
    await this.staffProfileRepository.save(profile);
  }

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      relations: ['staff', 'staff.user'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['inventory', 'inventory.product', 'staff', 'staff.user'],
    });

    if (!warehouse) {
      throw new NotFoundException(`Almacén con ID ${id} no encontrado`);
    }

    return warehouse;
  }

  async update(
    id: number,
    updateWarehouseDto: UpdateWarehouseDto,
  ): Promise<Warehouse> {
    const { managerId, ...warehouseData } = updateWarehouseDto;
    const warehouse = await this.findOne(id);

    // Actualizar datos del almacén
    Object.assign(warehouse, warehouseData);
    const updatedWarehouse = await this.warehouseRepository.save(warehouse);

    // Si se proporciona managerId, actualizar la asignación
    if (managerId !== undefined) {
      // Eliminar asignación anterior
      await this.staffProfileRepository.delete({ warehouseId: id });

      // Si managerId no es null, asignar nuevo encargado
      if (managerId) {
        await this.validateManager(managerId);
        await this.assignManager(id, managerId);
      }
    }

    return updatedWarehouse;
  }

  async remove(id: number): Promise<void> {
    const warehouse = await this.findOne(id);

    // Eliminar primero la relación de staff si existe
    await this.staffProfileRepository.delete({ warehouseId: id });

    await this.warehouseRepository.remove(warehouse);
  }

  // Nuevo método para obtener encargados disponibles (sin asignar)
  async getAvailableManagers(): Promise<User[]> {
    const assignedManagers = await this.staffProfileRepository.find({
      select: ['userId'],
    });

    const assignedUserIds = assignedManagers.map((profile) => profile.userId);

    const query = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ENCARGADO_ALMACEN })
      .andWhere('user.isActive = :isActive', { isActive: true });

    if (assignedUserIds.length > 0) {
      query.andWhere('user.id NOT IN (:...assignedUserIds)', { assignedUserIds });
    }

    return query.orderBy('user.firstName', 'ASC').getMany();
  }
}
