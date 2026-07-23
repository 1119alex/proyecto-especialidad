import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovement } from '../../entities/inventory-movement.entity';
import { MovementFiltersDto } from './dto/movement-filters.dto';
import { MovementType } from '../../common/enums/inventory-movement.enum';

export interface KardexMovement {
  id: number;
  createdAt: Date;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  transferCode: string | null;
  product: { id: number; sku: string; name: string; unit: string } | null;
  warehouse: { id: number; name: string } | null;
  performedBy: { id: number; name: string } | null;
}

export interface KardexResult {
  summary: {
    total: number;
    entradas: number;
    salidas: number;
    ajustes: number;
  };
  movements: KardexMovement[];
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly movementRepository: Repository<InventoryMovement>,
  ) {}

  /**
   * Historial de movimientos de inventario (kardex) con filtros por producto,
   * almacén, tipo y rango de fechas. Ordenado del más reciente al más antiguo.
   */
  async getMovements(filters: MovementFiltersDto): Promise<KardexResult> {
    const query = this.movementRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.product', 'product')
      .leftJoinAndSelect('m.warehouse', 'warehouse')
      .leftJoinAndSelect('m.performedBy', 'performedBy')
      .leftJoinAndSelect('m.transfer', 'transfer')
      .orderBy('m.createdAt', 'DESC');

    if (filters.productId) {
      query.andWhere('m.productId = :productId', {
        productId: filters.productId,
      });
    }
    if (filters.warehouseId) {
      query.andWhere('m.warehouseId = :warehouseId', {
        warehouseId: filters.warehouseId,
      });
    }
    if (filters.movementType) {
      query.andWhere('m.movementType = :movementType', {
        movementType: filters.movementType,
      });
    }
    if (filters.from) {
      query.andWhere('m.createdAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      // Incluir todo el día "to": se compara contra el fin del día
      query.andWhere('m.createdAt <= :to', { to: `${filters.to} 23:59:59` });
    }

    const rows = await query.getMany();

    const movements: KardexMovement[] = rows.map((m) => ({
      id: m.id,
      createdAt: m.createdAt,
      movementType: m.movementType,
      quantity: Number(m.quantity),
      previousQuantity: Number(m.previousQuantity),
      newQuantity: Number(m.newQuantity),
      reason: m.reason ?? null,
      transferCode: m.transfer?.transferCode ?? null,
      product: m.product
        ? {
            id: m.product.id,
            sku: m.product.sku,
            name: m.product.name,
            unit: m.product.unit,
          }
        : null,
      warehouse: m.warehouse
        ? { id: m.warehouse.id, name: m.warehouse.name }
        : null,
      performedBy: m.performedBy
        ? {
            id: m.performedBy.id,
            name: `${m.performedBy.firstName} ${m.performedBy.lastName}`.trim(),
          }
        : null,
    }));

    return {
      summary: {
        total: movements.length,
        entradas: movements.filter(
          (m) => m.movementType === MovementType.ENTRADA,
        ).length,
        salidas: movements.filter((m) => m.movementType === MovementType.SALIDA)
          .length,
        ajustes: movements.filter((m) => m.movementType === MovementType.AJUSTE)
          .length,
      },
      movements,
    };
  }
}
