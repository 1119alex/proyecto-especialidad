import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../../entities/vehicle.entity';
import { Transfer } from '../../entities/transfer.entity';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum';

function makeVehicle(partial: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 1,
    licensePlate: 'ABC-123',
    model: 'Volvo FH',
    capacity: 1000,
    status: VehicleStatus.DISPONIBLE,
    isAvailable: true,
    ...partial,
  } as Vehicle;
}

describe('VehiclesService', () => {
  let service: VehiclesService;

  const mockManager = {
    count: jest.fn(),
  };

  const mockVehicleRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (v: any) => v),
    remove: jest.fn(async (v: any) => v),
    manager: mockManager,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockVehicleRepository,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('create', () => {
    it('rechaza una placa ya registrada', async () => {
      mockVehicleRepository.findOne.mockResolvedValueOnce(makeVehicle());

      await expect(
        service.create({
          licensePlate: 'ABC-123',
          model: 'Otro',
          capacity: 500,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAvailable', () => {
    it('excluye vehículos dados de baja además de los no disponibles', async () => {
      mockVehicleRepository.find.mockResolvedValue([]);

      await service.findAvailable();

      expect(mockVehicleRepository.find).toHaveBeenCalledWith({
        where: { status: VehicleStatus.DISPONIBLE, isAvailable: true },
        order: { licensePlate: 'ASC' },
      });
    });
  });

  describe('remove', () => {
    it('da de baja en lugar de eliminar cuando tiene transferencias', async () => {
      const vehicle = makeVehicle();
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);
      mockManager.count.mockResolvedValue(2);

      const result = await service.remove(1);

      expect(result.deleted).toBe(false);
      expect(vehicle.isAvailable).toBe(false);
      expect(vehicle.status).toBe(VehicleStatus.FUERA_SERVICIO);
      expect(mockVehicleRepository.save).toHaveBeenCalledWith(vehicle);
      expect(mockVehicleRepository.remove).not.toHaveBeenCalled();
    });

    it('elimina físicamente cuando nunca fue usado', async () => {
      const vehicle = makeVehicle();
      mockVehicleRepository.findOne.mockResolvedValue(vehicle);
      mockManager.count.mockResolvedValue(0);

      const result = await service.remove(1);

      expect(result.deleted).toBe(true);
      expect(mockVehicleRepository.remove).toHaveBeenCalledWith(vehicle);
      expect(mockManager.count).toHaveBeenCalledWith(Transfer, {
        where: { vehicleId: 1 },
      });
    });
  });
});
