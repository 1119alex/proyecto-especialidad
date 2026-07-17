import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Warehouse } from '../../entities/warehouse.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import { User } from '../../entities/user.entity';
import { Inventory } from '../../entities/inventory.entity';
import { Product } from '../../entities/product.entity';
import { Transfer } from '../../entities/transfer.entity';

function makeWarehouse(partial: Partial<Warehouse> = {}): Warehouse {
  return {
    id: 1,
    code: 'ALM-01',
    name: 'Central',
    address: 'Av. Principal 123',
    city: 'La Paz',
    isActive: true,
    ...partial,
  } as Warehouse;
}

describe('WarehousesService', () => {
  let service: WarehousesService;

  const mockManager = {
    count: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((_entity: any, data: any) => data),
    save: jest.fn(async (_entity: any, value: any) => value),
  };

  const mockWarehouseRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (w: any) => w),
    remove: jest.fn(async (w: any) => w),
    manager: mockManager,
  };

  const mockStaffProfileRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (p: any) => p),
    delete: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockInventoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(async (cb: (manager: any) => Promise<any>) =>
      cb(mockManager),
    ),
  };

  const mockNotificationsService = {
    notifyUser: jest.fn().mockResolvedValue(undefined),
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
    notifyWarehouseStaff: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehousesService,
        {
          provide: getRepositoryToken(Warehouse),
          useValue: mockWarehouseRepository,
        },
        {
          provide: getRepositoryToken(WarehouseStaffProfile),
          useValue: mockStaffProfileRepository,
        },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<WarehousesService>(WarehousesService);
  });

  describe('create', () => {
    it('rechaza un código de almacén ya registrado', async () => {
      mockWarehouseRepository.findOne.mockResolvedValueOnce(makeWarehouse());

      await expect(
        service.create({
          code: 'ALM-01',
          name: 'Otro',
          address: 'Calle 2',
          city: 'El Alto',
          latitude: -16.5,
          longitude: -68.15,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('desactiva en lugar de eliminar cuando tiene transferencias o inventario', async () => {
      const warehouse = makeWarehouse();
      mockWarehouseRepository.findOne.mockResolvedValue(warehouse);
      mockManager.count
        .mockResolvedValueOnce(4) // transferencias
        .mockResolvedValueOnce(0); // inventario

      const result = await service.remove(1);

      expect(result.deleted).toBe(false);
      expect(warehouse.isActive).toBe(false);
      expect(mockWarehouseRepository.save).toHaveBeenCalledWith(warehouse);
      expect(mockWarehouseRepository.remove).not.toHaveBeenCalled();
    });

    it('elimina físicamente cuando nunca fue usado', async () => {
      const warehouse = makeWarehouse();
      mockWarehouseRepository.findOne.mockResolvedValue(warehouse);
      mockManager.count.mockResolvedValue(0);

      const result = await service.remove(1);

      expect(result.deleted).toBe(true);
      expect(mockStaffProfileRepository.delete).toHaveBeenCalledWith({
        warehouseId: 1,
      });
      expect(mockWarehouseRepository.remove).toHaveBeenCalledWith(warehouse);
      expect(mockManager.count).toHaveBeenCalledWith(Transfer, {
        where: [{ originWarehouseId: 1 }, { destinationWarehouseId: 1 }],
      });
    });
  });

  describe('adjustInventory', () => {
    beforeEach(() => {
      mockWarehouseRepository.findOne.mockResolvedValue(makeWarehouse());
      mockProductRepository.findOne.mockResolvedValue({
        id: 5,
        name: 'Producto 5',
        minStock: 10,
      });
      mockManager.findOne.mockResolvedValue({
        warehouseId: 1,
        productId: 5,
        quantity: '20',
      });
    });

    it('alerta stock bajo cuando el ajuste queda bajo el mínimo', async () => {
      await service.adjustInventory(1, { productId: 5, quantity: 4 }, 1);

      expect(
        mockNotificationsService.notifyWarehouseStaff,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Stock bajo',
          message: expect.stringContaining('quedó en 4'),
        }),
      );
      expect(mockNotificationsService.notifyAdmins).toHaveBeenCalled();
    });

    it('no alerta cuando el ajuste queda sobre el mínimo', async () => {
      await service.adjustInventory(1, { productId: 5, quantity: 50 }, 1);

      expect(
        mockNotificationsService.notifyWarehouseStaff,
      ).not.toHaveBeenCalled();
      expect(mockNotificationsService.notifyAdmins).not.toHaveBeenCalled();
    });
  });
});
