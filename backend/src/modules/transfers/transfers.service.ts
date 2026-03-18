import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from '../../entities/transfer.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransferStatus } from '../../common/enums/transfer-status.enum';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(TransferDetail)
    private readonly transferDetailRepository: Repository<TransferDetail>,
  ) {}

  async create(
    createTransferDto: CreateTransferDto,
    createdByUserId: number,
  ): Promise<Transfer> {
    // Validar que origen y destino sean diferentes
    if (
      createTransferDto.originWarehouseId ===
      createTransferDto.destinationWarehouseId
    ) {
      throw new BadRequestException(
        'El almacén de origen y destino deben ser diferentes',
      );
    }

    // Generar código único de transferencia
    const transferCode = await this.generateTransferCode();

    // Crear la transferencia
    const transfer = new Transfer();
    transfer.transferCode = transferCode;
    transfer.originWarehouseId = createTransferDto.originWarehouseId;
    transfer.destinationWarehouseId = createTransferDto.destinationWarehouseId;
    transfer.vehicleId = createTransferDto.vehicleId;
    transfer.driverId = createTransferDto.driverId;
    transfer.estimatedDepartureTime = createTransferDto.estimatedDepartureTime
      ? new Date(createTransferDto.estimatedDepartureTime)
      : undefined;
    transfer.estimatedArrivalTime = createTransferDto.estimatedArrivalTime
      ? new Date(createTransferDto.estimatedArrivalTime)
      : undefined;
    transfer.status = TransferStatus.PENDIENTE;
    transfer.createdByUserId = createdByUserId;

    const savedTransfer = await this.transferRepository.save(transfer);

    // Crear los detalles de la transferencia
    const details = createTransferDto.details.map((detail) => {
      const transferDetail = new TransferDetail();
      transferDetail.transferId = savedTransfer.id;
      transferDetail.productId = detail.productId;
      transferDetail.quantityExpected = detail.quantity;
      return transferDetail;
    });

    await this.transferDetailRepository.save(details);

    return this.findOne(savedTransfer.id);
  }

  async findAll(): Promise<Transfer[]> {
    return this.transferRepository.find({
      relations: [
        'originWarehouse',
        'destinationWarehouse',
        'vehicle',
        'driver',
        'createdBy',
        'details',
        'details.product',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Transfer> {
    const transfer = await this.transferRepository.findOne({
      where: { id },
      relations: [
        'originWarehouse',
        'destinationWarehouse',
        'vehicle',
        'driver',
        'driver.driverProfile',
        'createdBy',
        'details',
        'details.product',
      ],
    });

    if (!transfer) {
      throw new NotFoundException(`Transferencia con ID ${id} no encontrada`);
    }

    return transfer;
  }

  async findByCode(transferCode: string): Promise<Transfer | null> {
    return this.transferRepository.findOne({
      where: { transferCode },
      relations: [
        'originWarehouse',
        'destinationWarehouse',
        'vehicle',
        'driver',
        'details',
        'details.product',
      ],
    });
  }

  async update(
    id: number,
    updateTransferDto: UpdateTransferDto,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);

    // Validar transiciones de estado
    if (updateTransferDto.status) {
      this.validateStatusTransition(transfer.status, updateTransferDto.status);
    }

    // Si se cancela, validar que tenga razón
    if (
      updateTransferDto.status === TransferStatus.CANCELADA &&
      !updateTransferDto.cancellationReason
    ) {
      throw new BadRequestException(
        'Debe proporcionar una razón de cancelación',
      );
    }

    Object.assign(transfer, updateTransferDto);

    if (updateTransferDto.status === TransferStatus.CANCELADA) {
      transfer.cancelledAt = new Date();
    }

    return this.transferRepository.save(transfer);
  }

  async assignVehicleAndDriver(
    id: number,
    vehicleId: number,
    driverId: number,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.PENDIENTE) {
      throw new BadRequestException(
        'Solo se pueden asignar vehículos y conductores a transferencias pendientes',
      );
    }

    transfer.vehicleId = vehicleId;
    transfer.driverId = driverId;
    transfer.status = TransferStatus.ASIGNADA;

    return this.transferRepository.save(transfer);
  }

  async remove(id: number): Promise<void> {
    const transfer = await this.findOne(id);

    if (
      transfer.status !== TransferStatus.PENDIENTE &&
      transfer.status !== TransferStatus.CANCELADA
    ) {
      throw new BadRequestException(
        'Solo se pueden eliminar transferencias pendientes o canceladas',
      );
    }

    await this.transferRepository.remove(transfer);
  }

  private async generateTransferCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    // Contar transferencias del día
    const count = await this.transferRepository
      .createQueryBuilder('transfer')
      .where('DATE(transfer.createdAt) = CURDATE()')
      .getCount();

    const sequence = (count + 1).toString().padStart(4, '0');

    return `TRF${year}${month}${day}${sequence}`;
  }

  private validateStatusTransition(
    currentStatus: TransferStatus,
    newStatus: TransferStatus,
  ): void {
    const validTransitions: Record<TransferStatus, TransferStatus[]> = {
      [TransferStatus.PENDIENTE]: [
        TransferStatus.ASIGNADA,
        TransferStatus.CANCELADA,
      ],
      [TransferStatus.ASIGNADA]: [
        TransferStatus.EN_PREPARACION,
        TransferStatus.CANCELADA,
      ],
      [TransferStatus.EN_PREPARACION]: [
        TransferStatus.LISTA_DESPACHO,
        TransferStatus.CANCELADA,
      ],
      [TransferStatus.LISTA_DESPACHO]: [
        TransferStatus.EN_TRANSITO,
        TransferStatus.CANCELADA,
      ],
      [TransferStatus.EN_TRANSITO]: [TransferStatus.LLEGADA_DESTINO],
      [TransferStatus.LLEGADA_DESTINO]: [
        TransferStatus.COMPLETADA,
        TransferStatus.COMPLETADA_CON_DISCREPANCIA,
      ],
      [TransferStatus.COMPLETADA]: [],
      [TransferStatus.COMPLETADA_CON_DISCREPANCIA]: [],
      [TransferStatus.CANCELADA]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de ${currentStatus} a ${newStatus}`,
      );
    }
  }
}
