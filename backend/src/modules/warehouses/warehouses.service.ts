import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Warehouse } from '../../entities/warehouse.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import { User } from '../../entities/user.entity';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryMovement } from '../../entities/inventory-movement.entity';
import { Product } from '../../entities/product.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { MovementType } from '../../common/enums/inventory-movement.enum';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseStaffProfile)
    private readonly staffProfileRepository: Repository<WarehouseStaffProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
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

  // ===== INVENTARIO =====

  async getInventory(warehouseId: number): Promise<Inventory[]> {
    await this.findOne(warehouseId); // Verificar que existe

    return this.inventoryRepository.find({
      where: { warehouseId },
      relations: ['product'],
      order: { productId: 'ASC' },
    });
  }

  /**
   * Fija el stock de un producto en el almacén (ajuste manual del admin),
   * dejando registro del movimiento de tipo AJUSTE.
   */
  async adjustInventory(
    warehouseId: number,
    dto: AdjustInventoryDto,
    performedByUserId: number,
  ): Promise<Inventory> {
    await this.findOne(warehouseId);

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException(
        `Producto con ID ${dto.productId} no encontrado`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      let inventory = await manager.findOne(Inventory, {
        where: { warehouseId, productId: dto.productId },
      });

      if (!inventory) {
        inventory = manager.create(Inventory, {
          warehouseId,
          productId: dto.productId,
          quantity: 0,
        });
      }

      const previousQuantity = Number(inventory.quantity);
      inventory.quantity = dto.quantity;
      const saved = await manager.save(Inventory, inventory);

      const movement = manager.create(InventoryMovement, {
        warehouseId,
        productId: dto.productId,
        movementType: MovementType.AJUSTE,
        quantity: Math.abs(dto.quantity - previousQuantity),
        previousQuantity,
        newQuantity: dto.quantity,
        reason: dto.reason || 'Ajuste manual de inventario',
        performedByUserId,
      });
      await manager.save(InventoryMovement, movement);

      return saved;
    });
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
