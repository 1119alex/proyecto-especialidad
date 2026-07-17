import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';
import { Transfer } from '../../entities/transfer.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus } from '../../common/enums/vehicle-status.enum';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    // Verificar si la placa ya existe
    const existing = await this.vehicleRepository.findOne({
      where: { licensePlate: createVehicleDto.licensePlate },
    });

    if (existing) {
      throw new ConflictException('La placa del vehículo ya está registrada');
    }

    const vehicle = this.vehicleRepository.create({
      ...createVehicleDto,
      status: createVehicleDto.status || VehicleStatus.DISPONIBLE,
    });

    return this.vehicleRepository.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find({
      order: { licensePlate: 'ASC' },
    });
  }

  async findAvailable(): Promise<Vehicle[]> {
    // isAvailable = sigue en la flota (baja lógica); status = estado operativo
    return this.vehicleRepository.find({
      where: { status: VehicleStatus.DISPONIBLE, isAvailable: true },
      order: { licensePlate: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehículo con ID ${id} no encontrado`);
    }

    return vehicle;
  }

  async update(id: number, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    // Si se actualiza la placa, verificar que no exista
    if (
      updateVehicleDto.licensePlate &&
      updateVehicleDto.licensePlate !== vehicle.licensePlate
    ) {
      const existing = await this.vehicleRepository.findOne({
        where: { licensePlate: updateVehicleDto.licensePlate },
      });

      if (existing) {
        throw new ConflictException('La placa del vehículo ya está registrada');
      }
    }

    Object.assign(vehicle, updateVehicleDto);
    return this.vehicleRepository.save(vehicle);
  }

  /**
   * Elimina el vehículo solo si nunca fue usado. Si tiene transferencias
   * asociadas se da de baja (soft delete): borrarlo rompería el historial
   * y la base lo impediría por las claves foráneas.
   */
  async remove(id: number): Promise<{ deleted: boolean; message: string }> {
    const vehicle = await this.findOne(id);

    const transferRefs = await this.vehicleRepository.manager.count(Transfer, {
      where: { vehicleId: id },
    });

    if (transferRefs > 0) {
      vehicle.isAvailable = false;
      vehicle.status = VehicleStatus.FUERA_SERVICIO;
      await this.vehicleRepository.save(vehicle);
      return {
        deleted: false,
        message:
          'El vehículo tiene transferencias asociadas, por lo que se dio de baja en lugar de eliminarse',
      };
    }

    await this.vehicleRepository.remove(vehicle);
    return { deleted: true, message: 'Vehículo eliminado' };
  }

  async updateStatus(id: number, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return this.vehicleRepository.save(vehicle);
  }
}
