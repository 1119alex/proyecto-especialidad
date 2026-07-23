import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryMovement } from '../../entities/inventory-movement.entity';
import { MovementType } from '../../common/enums/inventory-movement.enum';

function makeMovement(partial: Partial<InventoryMovement> = {}): InventoryMovement {
  return {
    id: 1,
    createdAt: new Date('2026-07-10T10:00:00Z'),
    movementType: MovementType.ENTRADA,
    quantity: '5',
    previousQuantity: '10',
    newQuantity: '15',
    reason: 'Entrada por transferencia TRF001',
    product: { id: 5, sku: 'SKU-5', name: 'Producto 5', unit: 'UNIDAD' },
    warehouse: { id: 1, name: 'Central' },
    performedBy: { id: 2, firstName: 'Ana', lastName: 'López' },
    transfer: { transferCode: 'TRF2607100001' },
    ...partial,
  } as unknown as InventoryMovement;
}

describe('InventoryService', () => {
  let service: InventoryService;

  const qb: any = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockMovementRepository = {
    createQueryBuilder: jest.fn(() => qb),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: mockMovementRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('mapea los movimientos y calcula el resumen por tipo', async () => {
    qb.getMany.mockResolvedValue([
      makeMovement({ id: 1, movementType: MovementType.ENTRADA }),
      makeMovement({ id: 2, movementType: MovementType.SALIDA }),
      makeMovement({ id: 3, movementType: MovementType.AJUSTE }),
      makeMovement({ id: 4, movementType: MovementType.ENTRADA }),
    ]);

    const result = await service.getMovements({});

    expect(result.summary).toEqual({
      total: 4,
      entradas: 2,
      salidas: 1,
      ajustes: 1,
    });
    // Los decimales de PostgreSQL (string) se normalizan a número
    expect(result.movements[0].quantity).toBe(5);
    expect(result.movements[0].transferCode).toBe('TRF2607100001');
    expect(result.movements[0].performedBy?.name).toBe('Ana López');
  });

  it('aplica los filtros recibidos al query', async () => {
    qb.getMany.mockResolvedValue([]);

    await service.getMovements({
      productId: 5,
      warehouseId: 1,
      movementType: MovementType.AJUSTE,
      from: '2026-07-01',
      to: '2026-07-31',
    });

    expect(qb.andWhere).toHaveBeenCalledWith('m.productId = :productId', {
      productId: 5,
    });
    expect(qb.andWhere).toHaveBeenCalledWith('m.warehouseId = :warehouseId', {
      warehouseId: 1,
    });
    expect(qb.andWhere).toHaveBeenCalledWith(
      'm.movementType = :movementType',
      { movementType: MovementType.AJUSTE },
    );
    // El filtro "to" incluye el día completo
    expect(qb.andWhere).toHaveBeenCalledWith('m.createdAt <= :to', {
      to: '2026-07-31 23:59:59',
    });
  });
});
