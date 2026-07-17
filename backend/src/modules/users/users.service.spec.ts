import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { DriverProfile } from '../../entities/driver-profile.entity';
import { WarehouseStaffProfile } from '../../entities/warehouse-staff-profile.entity';
import { UserRole } from '../../common/enums/user-role.enum';

function makeUser(partial: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'user@test.com',
    firstName: 'Juan',
    lastName: 'Pérez',
    role: UserRole.ENCARGADO_ALMACEN,
    isActive: true,
    ...partial,
  } as User;
}

describe('UsersService', () => {
  let service: UsersService;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn(async (u: any) => u),
    createQueryBuilder: jest.fn(),
  };

  const mockDriverProfileRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (p: any) => p),
    delete: jest.fn(),
  };

  const mockWarehouseStaffRepository = {
    findOne: jest.fn(),
    save: jest.fn(async (p: any) => p),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        {
          provide: getRepositoryToken(DriverProfile),
          useValue: mockDriverProfileRepository,
        },
        {
          provide: getRepositoryToken(WarehouseStaffProfile),
          useValue: mockWarehouseStaffRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('update', () => {
    it('rechaza cambiar el email a uno ya registrado', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(makeUser()) // findOne(id)
        .mockResolvedValueOnce(makeUser({ id: 2, email: 'otro@test.com' })); // por email

      await expect(
        service.update(1, { email: 'otro@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('elimina el perfil de conductor al dejar el rol TRANSPORTISTA', async () => {
      const user = makeUser({ role: UserRole.TRANSPORTISTA });
      mockUserRepository.findOne.mockResolvedValue(user);

      await service.update(1, { role: UserRole.ADMIN });

      expect(mockDriverProfileRepository.delete).toHaveBeenCalledWith({
        userId: 1,
      });
    });

    it('rechaza cambiar a TRANSPORTISTA sin datos de licencia (antes de guardar)', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        makeUser({ role: UserRole.ADMIN }),
      );

      await expect(
        service.update(1, { role: UserRole.TRANSPORTISTA }),
      ).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('crea el perfil de conductor al cambiar a TRANSPORTISTA con licencia', async () => {
      mockUserRepository.findOne.mockResolvedValue(
        makeUser({ role: UserRole.ADMIN }),
      );
      mockDriverProfileRepository.findOne.mockResolvedValue(null);

      await service.update(1, {
        role: UserRole.TRANSPORTISTA,
        licenseNumber: 'LIC-777',
        licenseExpiry: '2028-01-01',
      });

      expect(mockDriverProfileRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1, licenseNumber: 'LIC-777' }),
      );
    });

    it('crea el perfil de almacén si el encargado no tenía asignación', async () => {
      mockUserRepository.findOne.mockResolvedValue(makeUser());
      mockWarehouseStaffRepository.findOne.mockResolvedValue(null);

      await service.update(1, { warehouseId: 7 });

      expect(mockWarehouseStaffRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          warehouseId: 7,
          position: 'Encargado',
        }),
      );
    });
  });
});
