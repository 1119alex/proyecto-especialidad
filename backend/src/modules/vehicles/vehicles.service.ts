import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from '../../entities/vehicle.entity';
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
    return this.vehicleRepository.find({
      where: { status: VehicleStatus.DISPONIBLE },
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

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);
  }

  async updateStatus(id: number, status: VehicleStatus): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return this.vehicleRepository.save(vehicle);
  }
}
