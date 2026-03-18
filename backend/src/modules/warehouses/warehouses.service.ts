import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from '../../entities/warehouse.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
  ) {}

  async create(createWarehouseDto: CreateWarehouseDto): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create(createWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async findAll(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Warehouse> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id },
      relations: ['inventory', 'inventory.product'],
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
    const warehouse = await this.findOne(id);
    Object.assign(warehouse, updateWarehouseDto);
    return this.warehouseRepository.save(warehouse);
  }

  async remove(id: number): Promise<void> {
    const warehouse = await this.findOne(id);
    await this.warehouseRepository.remove(warehouse);
  }
}
