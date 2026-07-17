import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { TransfersService } from './transfers.service';
import { TrackingGateway } from '../realtime/tracking.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { Transfer } from '../../entities/transfer.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { TrackingLog } from '../../entities/tracking-log.entity';
import { Product } from '../../entities/product.entity';
import { Inventory } from '../../entities/inventory.entity';
import { User } from '../../entities/user.entity';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';

const TEST_SECRET = 'test-secret';

/** Replica la firma HMAC del servicio para construir QRs válidos en pruebas */
function signQR(payload: string): string {
  return crypto
    .createHmac('sha256', TEST_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 16);
}

function makeUser(partial: Partial<User> = {}): User {
  return {
    id: 1,
    role: UserRole.ADMIN,
    ...partial,
  } as User;
}

function makeEncargado(warehouseId: number, id = 10): User {
  return makeUser({
    id,
    role: UserRole.ENCARGADO_ALMACEN,
    warehouseStaffProfile: { warehouseId } as any,
  });
}

function makeDriver(id = 20): User {
  return makeUser({ id, role: UserRole.TRANSPORTISTA });
}

function makeTransfer(partial: Partial<Transfer> = {}): Transfer {
  return {
    id: 1,
    transferCode: 'TRF2606110001',
    originWarehouseId: 1,
    destinationWarehouseId: 2,
    driverId: 20,
    status: TransferStatus.PENDIENTE,
    details: [],
    ...partial,
  } as Transfer;
}

describe('TransfersService', () => {
  let service: TransfersService;

  const mockTransferRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(async (t: Transfer) => t),
    remove: jest.fn(),
    create: jest.fn((data: any) => data),
    createQueryBuilder: jest.fn(),
  };

  const mockTransferDetailRepository = {
    save: jest.fn(async (d: any) => d),
  };

  const mockTrackingLogRepository = {
    create: jest.fn((data: any) => data),
    save: jest.fn(async (t: any) => ({ id: 99, ...t })),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProductRepository = {
    findOne: jest.fn(),
  };

  const mockInventoryRepository = {
    findOne: jest.fn(),
  };

  const mockManager = {
    save: jest.fn(async (_entity: any, value: any) => value),
    findOne: jest.fn(),
    create: jest.fn((_entity: any, data: any) => data),
  };

  const mockDataSource = {
    transaction: jest.fn(async (cb: (manager: any) => Promise<any>) =>
      cb(mockManager),
    ),
  };

  const mockConfigService = {
    get: jest.fn((key: string) =>
      key === 'JWT_SECRET' ? TEST_SECRET : undefined,
    ),
  };

  const mockTrackingGateway = {
    emitTrackingPoints: jest.fn(),
    emitTransferEvent: jest.fn(),
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
        TransfersService,
        {
          provide: getRepositoryToken(Transfer),
          useValue: mockTransferRepository,
        },
        {
          provide: getRepositoryToken(TransferDetail),
          useValue: mockTransferDetailRepository,
        },
        {
          provide: getRepositoryToken(TrackingLog),
          useValue: mockTrackingLogRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockInventoryRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TrackingGateway, useValue: mockTrackingGateway },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TransfersService>(TransfersService);
  });

  describe('create', () => {
    const baseDto = {
      originWarehouseId: 1,
      destinationWarehouseId: 2,
      details: [{ productId: 5, quantity: 10 }],
    } as any;

    it('rechaza transferencias con el mismo almacén de origen y destino', async () => {
      await expect(
        service.create(
          { ...baseDto, destinationWarehouseId: 1 },
          1,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza transferencias sin productos', async () => {
      await expect(
        service.create({ ...baseDto, details: [] }, 1),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza si el producto no existe', async () => {
      mockTransferRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockProductRepository.findOne.mockResolvedValue(null);

      await expect(service.create(baseDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rechaza productos inactivos', async () => {
      mockTransferRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockProductRepository.findOne.mockResolvedValue({
        id: 5,
        sku: 'SKU-5',
        name: 'Producto 5',
        unit: 'unidad',
        isActive: false,
      });

      await expect(service.create(baseDto, 1)).rejects.toThrow(
        /está inactivo/,
      );
    });

    it('rechaza el mismo producto repetido en los detalles', async () => {
      await expect(
        service.create(
          {
            ...baseDto,
            details: [
              { productId: 5, quantity: 6 },
              { productId: 5, quantity: 6 },
            ],
          },
          1,
        ),
      ).rejects.toThrow(/repetir el mismo producto/);
    });

    it('rechaza si el origen no tiene stock registrado del producto', async () => {
      mockTransferRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockProductRepository.findOne.mockResolvedValue({
        id: 5,
        sku: 'SKU-5',
        name: 'Producto 5',
        unit: 'unidad',
        isActive: true,
      });
      mockInventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(baseDto, 1)).rejects.toThrow(
        /no tiene stock registrado/,
      );
    });

    it('rechaza si el stock registrado en origen es insuficiente', async () => {
      mockTransferRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockProductRepository.findOne.mockResolvedValue({
        id: 5,
        sku: 'SKU-5',
        name: 'Producto 5',
        unit: 'unidad',
        isActive: true,
      });
      mockInventoryRepository.findOne.mockResolvedValue({
        warehouseId: 1,
        productId: 5,
        quantity: '4', // los decimales de PostgreSQL llegan como string
      });

      await expect(service.create(baseDto, 1)).rejects.toThrow(
        /Stock insuficiente/,
      );
    });

    it('crea la transferencia dentro de una transacción cuando hay stock', async () => {
      mockTransferRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      });
      mockProductRepository.findOne.mockResolvedValue({
        id: 5,
        sku: 'SKU-5',
        name: 'Producto 5',
        unit: 'unidad',
        isActive: true,
      });
      mockInventoryRepository.findOne.mockResolvedValue({
        warehouseId: 1,
        productId: 5,
        quantity: '50',
      });
      mockManager.save.mockImplementation(async (_entity: any, value: any) =>
        Array.isArray(value) ? value : { ...value, id: 7 },
      );
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ id: 7, status: TransferStatus.PENDIENTE }),
      );

      const result = await service.create(baseDto, 1);

      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(7);
    });
  });

  describe('update (transiciones de estado)', () => {
    it('rechaza transiciones de estado inválidas', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.COMPLETADA }),
      );

      await expect(
        service.update(1, { status: TransferStatus.EN_TRANSITO } as any),
      ).rejects.toThrow(/No se puede cambiar el estado/);
    });

    it('exige razón de cancelación al cancelar', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.PENDIENTE }),
      );

      await expect(
        service.update(1, { status: TransferStatus.CANCELADA } as any),
      ).rejects.toThrow(/razón de cancelación/);
    });

    it('bloquea completar por PATCH: el cierre exige su endpoint dedicado', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.LLEGADA_DESTINO }),
      );

      // Sin esto se evitaría la verificación QR, las discrepancias y la
      // actualización de inventario de complete()
      await expect(
        service.update(1, { status: TransferStatus.COMPLETADA } as any),
      ).rejects.toThrow(/endpoint dedicado/);
    });

    it('bloquea iniciar tránsito por PATCH (evitaría la verificación QR)', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.LISTA_DESPACHO }),
      );

      await expect(
        service.update(1, { status: TransferStatus.EN_TRANSITO } as any),
      ).rejects.toThrow(/endpoint dedicado/);
    });
  });

  describe('findOne (pertenencia de lectura)', () => {
    it('permite al ADMIN ver cualquier transferencia', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeTransfer());

      const result = await service.findOne(1, makeUser());

      expect(result.id).toBe(1);
    });

    it('permite al transportista asignado ver su transferencia', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeTransfer());

      const result = await service.findOne(1, makeDriver(20));

      expect(result.id).toBe(1);
    });

    it('rechaza a un transportista no asignado', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeTransfer());

      await expect(service.findOne(1, makeDriver(99))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('permite al encargado del almacén origen o destino', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeTransfer());

      await expect(service.findOne(1, makeEncargado(1))).resolves.toBeDefined();
      await expect(service.findOne(1, makeEncargado(2))).resolves.toBeDefined();
    });

    it('rechaza a un encargado de un almacén ajeno', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeTransfer());

      await expect(service.findOne(1, makeEncargado(99))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('sin usuario (llamada interna) no valida pertenencia', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeTransfer());

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });
  });

  describe('startPreparation', () => {
    it('rechaza a un encargado de otro almacén', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.ASIGNADA }),
      );

      await expect(
        service.startPreparation(1, makeEncargado(99)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('permite al encargado del almacén de origen', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.ASIGNADA }),
      );

      const result = await service.startPreparation(1, makeEncargado(1));

      expect(result.status).toBe(TransferStatus.EN_PREPARACION);
    });
  });

  describe('verifyQR', () => {
    const payload = 'TRF-1-1700000000000';
    const validQR = `${payload}-${signQR(payload)}`;

    it('rechaza un QR que no corresponde a la transferencia', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({
          qrCode: validQR,
          status: TransferStatus.LISTA_DESPACHO,
        }),
      );

      const result = await service.verifyQR(
        1,
        'TRF-1-999-deadbeefdeadbeef',
        'origin',
        makeDriver(),
      );

      expect(result.success).toBe(false);
    });

    it('rechaza un QR con firma inválida aunque coincida el formato', async () => {
      const forgedQR = `${payload}-0000000000000000`;
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({
          qrCode: forgedQR,
          status: TransferStatus.LISTA_DESPACHO,
        }),
      );

      const result = await service.verifyQR(
        1,
        forgedQR,
        'origin',
        makeDriver(),
      );

      expect(result.success).toBe(false);
    });

    it('en origen inicia el tránsito cuando el transportista asignado escanea', async () => {
      const transfer = makeTransfer({
        qrCode: validQR,
        status: TransferStatus.LISTA_DESPACHO,
      });
      mockTransferRepository.findOne.mockResolvedValue(transfer);

      const result = await service.verifyQR(1, validQR, 'origin', makeDriver());

      expect(result.success).toBe(true);
      expect(transfer.status).toBe(TransferStatus.EN_TRANSITO);
      expect(transfer.qrVerifiedAtOrigin).toBeInstanceOf(Date);
      expect(transfer.actualDepartureTime).toBeInstanceOf(Date);
    });

    it('en origen rechaza a un transportista no asignado', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({
          qrCode: validQR,
          status: TransferStatus.LISTA_DESPACHO,
          driverId: 999,
        }),
      );

      await expect(
        service.verifyQR(1, validQR, 'origin', makeDriver(20)),
      ).rejects.toThrow(ForbiddenException);
    });

    it('en destino solo marca la verificación sin completar la transferencia', async () => {
      const transfer = makeTransfer({
        qrCode: validQR,
        status: TransferStatus.LLEGADA_DESTINO,
      });
      mockTransferRepository.findOne.mockResolvedValue(transfer);

      const result = await service.verifyQR(
        1,
        validQR,
        'destination',
        makeEncargado(2),
      );

      expect(result.success).toBe(true);
      expect(transfer.qrVerifiedAtDestination).toBeInstanceOf(Date);
      // El cierre con discrepancias queda en manos de complete()
      expect(transfer.status).toBe(TransferStatus.LLEGADA_DESTINO);
      expect(transfer.completedAt).toBeUndefined();
    });

    it('en destino rechaza al encargado del almacén de origen', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({
          qrCode: validQR,
          status: TransferStatus.LLEGADA_DESTINO,
        }),
      );

      await expect(
        service.verifyQR(1, validQR, 'destination', makeEncargado(1)),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('complete', () => {
    function makeArrivedTransfer(): Transfer {
      return makeTransfer({
        status: TransferStatus.LLEGADA_DESTINO,
        qrVerifiedAtDestination: new Date(),
        details: [
          {
            id: 1,
            productId: 5,
            quantityExpected: 10,
            unit: 'unidad',
          } as TransferDetail,
          {
            id: 2,
            productId: 6,
            quantityExpected: 4,
            unit: 'unidad',
          } as TransferDetail,
        ],
      });
    }

    it('rechaza si el QR no fue verificado en destino', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.LLEGADA_DESTINO }),
      );

      await expect(service.complete(1, makeEncargado(2))).rejects.toThrow(
        /verificar el código QR/,
      );
    });

    it('rechaza al encargado de un almacén distinto al destino', async () => {
      mockTransferRepository.findOne.mockResolvedValue(makeArrivedTransfer());

      await expect(service.complete(1, makeEncargado(1))).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('completa sin discrepancias asumiendo recepción total', async () => {
      const transfer = makeArrivedTransfer();
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      mockManager.findOne.mockResolvedValue(null);

      await service.complete(1, makeEncargado(2));

      expect(transfer.status).toBe(TransferStatus.COMPLETADA);
      expect(transfer.details[0].quantityReceived).toBe(10);
      expect(transfer.details[0].hasDiscrepancy).toBe(false);
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    });

    it('marca discrepancias y actualiza el inventario de ambos almacenes', async () => {
      const transfer = makeArrivedTransfer();
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      // Inventario de origen con stock; el de destino no existe aún
      mockManager.findOne.mockImplementation(
        async (_entity: any, options: any) =>
          options.where.warehouseId === 1
            ? { warehouseId: 1, productId: options.where.productId, quantity: '20' }
            : null,
      );

      await service.complete(1, makeEncargado(2), [
        { productId: 5, quantity: 8 },
      ]);

      expect(transfer.status).toBe(
        TransferStatus.COMPLETADA_CON_DISCREPANCIA,
      );
      expect(transfer.details[0].quantityReceived).toBe(8);
      expect(transfer.details[0].hasDiscrepancy).toBe(true);
      // El producto sin reporte explícito se asume recibido completo
      expect(transfer.details[1].quantityReceived).toBe(4);
      expect(transfer.details[1].hasDiscrepancy).toBe(false);

      // 2 productos x (salida origen + entrada destino) = 4 movimientos,
      // cada uno guarda inventario + movimiento (8 saves) además de
      // detalles y transferencia (2 saves)
      expect(mockManager.save).toHaveBeenCalledTimes(10);
    });

    it('alerta stock bajo en origen cuando queda bajo el mínimo del producto', async () => {
      const transfer = makeArrivedTransfer();
      transfer.details = [
        {
          id: 1,
          productId: 5,
          productName: 'Producto 5',
          quantityExpected: 8,
          unit: 'unidad',
          product: { id: 5, minStock: 15 },
        } as TransferDetail,
      ];
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      // Origen queda con 20 - 8 = 12 (< mínimo 15)
      mockManager.findOne.mockImplementation(
        async (_entity: any, options: any) =>
          options.where.warehouseId === 1
            ? { warehouseId: 1, productId: 5, quantity: '20' }
            : null,
      );

      await service.complete(1, makeEncargado(2));

      expect(
        mockNotificationsService.notifyWarehouseStaff,
      ).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          title: 'Stock bajo',
          message: expect.stringContaining('quedó en 12'),
        }),
      );
      expect(mockNotificationsService.notifyAdmins).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Stock bajo' }),
      );
    });

    it('no alerta stock bajo si el origen queda sobre el mínimo', async () => {
      const transfer = makeArrivedTransfer();
      transfer.details = [
        {
          id: 1,
          productId: 5,
          productName: 'Producto 5',
          quantityExpected: 2,
          unit: 'unidad',
          product: { id: 5, minStock: 5 },
        } as TransferDetail,
      ];
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      mockManager.findOne.mockImplementation(
        async (_entity: any, options: any) =>
          options.where.warehouseId === 1
            ? { warehouseId: 1, productId: 5, quantity: '20' }
            : null,
      );

      await service.complete(1, makeEncargado(2));

      const lowStockCalls =
        mockNotificationsService.notifyWarehouseStaff.mock.calls.filter(
          (call) => call[1]?.title === 'Stock bajo',
        );
      expect(lowStockCalls).toHaveLength(0);
    });

    it('no permite que el stock de origen quede negativo', async () => {
      const transfer = makeArrivedTransfer();
      transfer.details = [transfer.details[0]];
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      mockManager.findOne.mockImplementation(
        async (_entity: any, options: any) =>
          options.where.warehouseId === 1
            ? { warehouseId: 1, productId: 5, quantity: '3' }
            : null,
      );

      const savedInventories: any[] = [];
      mockManager.save.mockImplementation(async (_entity: any, value: any) => {
        if (value && value.quantity !== undefined && value.warehouseId) {
          savedInventories.push({ ...value });
        }
        return value;
      });

      await service.complete(1, makeEncargado(2));

      const originSave = savedInventories.find(
        (inv) => inv.warehouseId === 1 && inv.newQuantity === undefined,
      );
      expect(originSave.quantity).toBe(0);
    });
  });

  describe('addGPSTracking', () => {
    it('rechaza el registro fuera de tránsito', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.PENDIENTE }),
      );

      await expect(
        service.addGPSTracking(
          1,
          { latitude: -16.5, longitude: -68.15 },
          makeDriver(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza a un transportista no asignado', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.EN_TRANSITO, driverId: 999 }),
      );

      await expect(
        service.addGPSTracking(
          1,
          { latitude: -16.5, longitude: -68.15 },
          makeDriver(20),
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('registra la coordenada durante el tránsito y la emite por WebSocket', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.EN_TRANSITO }),
      );

      const result = await service.addGPSTracking(
        1,
        { latitude: -16.5, longitude: -68.15, speed: 40 },
        makeDriver(),
      );

      expect(result.id).toBe(99);
      expect(mockTrackingLogRepository.save).toHaveBeenCalled();
      expect(mockTrackingGateway.emitTrackingPoints).toHaveBeenCalledWith(1, [
        result,
      ]);
    });
  });

  describe('addGPSTrackingBatch', () => {
    it('rechaza el lote fuera de tránsito', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.LLEGADA_DESTINO }),
      );

      await expect(
        service.addGPSTrackingBatch(
          1,
          [{ latitude: -16.5, longitude: -68.15 }],
          makeDriver(),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('guarda el lote conservando el timestamp del dispositivo y emite por WebSocket', async () => {
      mockTransferRepository.findOne.mockResolvedValue(
        makeTransfer({ status: TransferStatus.EN_TRANSITO }),
      );
      mockTrackingLogRepository.save.mockImplementation(
        async (logs: any) => logs,
      );

      const deviceTime = '2026-06-12T10:00:00.000Z';
      const result = await service.addGPSTrackingBatch(
        1,
        [
          { latitude: -16.5, longitude: -68.15, recordedAt: deviceTime },
          { latitude: -16.51, longitude: -68.16 },
        ],
        makeDriver(),
      );

      expect(result.saved).toBe(2);
      expect(result.trackingLogs[0].recordedAt).toEqual(new Date(deviceTime));
      expect(mockTrackingGateway.emitTrackingPoints).toHaveBeenCalledWith(
        1,
        result.trackingLogs,
      );
    });
  });

  describe('geocerca (RF11)', () => {
    function makeInTransitNearDestination(): Transfer {
      return makeTransfer({
        status: TransferStatus.EN_TRANSITO,
        destinationWarehouse: {
          id: 2,
          name: 'Almacén Destino',
          latitude: -16.5,
          longitude: -68.15,
          geofenceRadius: 100,
        } as any,
      });
    }

    it('marca llegada automática cuando el punto entra al radio del destino', async () => {
      const transfer = makeInTransitNearDestination();
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      mockTrackingLogRepository.save.mockImplementation(
        async (logs: any) => logs,
      );

      // ~11 metros del almacén destino (dentro del radio de 100 m)
      const result = await service.addGPSTrackingBatch(
        1,
        [{ latitude: -16.5001, longitude: -68.15 }],
        makeDriver(),
      );

      expect(result.arrivedByGeofence).toBe(true);
      expect(result.transferStatus).toBe(TransferStatus.LLEGADA_DESTINO);
      expect(transfer.actualArrivalTime).toBeInstanceOf(Date);
      expect(mockNotificationsService.notifyAdmins).toHaveBeenCalled();
      expect(mockNotificationsService.notifyWarehouseStaff).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ transferId: 1 }),
      );
      expect(mockTrackingGateway.emitTransferEvent).toHaveBeenCalledWith(1, {
        type: 'geofence-arrival',
        status: TransferStatus.LLEGADA_DESTINO,
      });
    });

    it('no marca llegada cuando el punto está fuera del radio', async () => {
      const transfer = makeInTransitNearDestination();
      mockTransferRepository.findOne.mockResolvedValue(transfer);
      mockTrackingLogRepository.save.mockImplementation(
        async (logs: any) => logs,
      );

      // ~1.1 km del almacén destino
      const result = await service.addGPSTrackingBatch(
        1,
        [{ latitude: -16.51, longitude: -68.15 }],
        makeDriver(),
      );

      expect(result.arrivedByGeofence).toBe(false);
      expect(result.transferStatus).toBe(TransferStatus.EN_TRANSITO);
    });
  });
});
