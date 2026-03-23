import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transfer } from '../../entities/transfer.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { TrackingLog } from '../../entities/tracking-log.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import * as QRCode from 'qrcode';

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(TransferDetail)
    private readonly transferDetailRepository: Repository<TransferDetail>,
    @InjectRepository(TrackingLog)
    private readonly trackingLogRepository: Repository<TrackingLog>,
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

    // Determinar el estado inicial según si tiene vehículo y conductor asignados
    if (createTransferDto.vehicleId && createTransferDto.driverId) {
      transfer.status = TransferStatus.ASIGNADA;
    } else {
      transfer.status = TransferStatus.PENDIENTE;
    }

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

    // Excluir 'details' del DTO ya que no se pueden actualizar directamente
    const { details, ...updateData } = updateTransferDto;

    console.log('📝 Update data received:', updateData);
    console.log('📦 Transfer before update:', {
      id: transfer.id,
      status: transfer.status,
      vehicleId: transfer.vehicleId,
      driverId: transfer.driverId
    });

    // Filtrar campos undefined para evitar sobrescribir valores existentes
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    console.log('🧹 Cleaned update data:', cleanUpdateData);

    Object.assign(transfer, cleanUpdateData);

    console.log('📦 Transfer after Object.assign:', {
      id: transfer.id,
      status: transfer.status,
      vehicleId: transfer.vehicleId,
      driverId: transfer.driverId
    });

    if (updateTransferDto.status === TransferStatus.CANCELADA) {
      transfer.cancelledAt = new Date();
    }

    // Convertir fechas si están presentes
    if (updateData.estimatedDepartureTime) {
      transfer.estimatedDepartureTime = new Date(updateData.estimatedDepartureTime);
    }
    if (updateData.estimatedArrivalTime) {
      transfer.estimatedArrivalTime = new Date(updateData.estimatedArrivalTime);
    }

    // Si se está asignando vehículo y conductor a una transferencia PENDIENTE,
    // cambiar automáticamente el estado a ASIGNADA
    console.log('🔍 Checking auto-status change:', {
      currentStatus: transfer.status,
      vehicleId: transfer.vehicleId,
      driverId: transfer.driverId,
      willChangeToAsignada: transfer.status === TransferStatus.PENDIENTE && transfer.vehicleId && transfer.driverId
    });

    if (
      transfer.status === TransferStatus.PENDIENTE &&
      transfer.vehicleId &&
      transfer.driverId
    ) {
      console.log('✅ Auto-changing status from PENDIENTE to ASIGNADA');
      transfer.status = TransferStatus.ASIGNADA;
    }

    const savedTransfer = await this.transferRepository.save(transfer);
    console.log('💾 Saved transfer with status:', savedTransfer.status);
    return savedTransfer;
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

  // ===== GESTIÓN DE ESTADOS =====

  async startPreparation(id: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.ASIGNADA) {
      throw new BadRequestException(
        'Solo se puede iniciar preparación de transferencias asignadas',
      );
    }

    transfer.status = TransferStatus.EN_PREPARACION;
    return this.transferRepository.save(transfer);
  }

  async startTransit(id: number, userId: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    // Validar que el QR fue verificado en origen
    if (!transfer.qrVerifiedAtOrigin) {
      throw new BadRequestException(
        'Debe verificar el código QR en el origen antes de iniciar el tránsito',
      );
    }

    if (transfer.status !== TransferStatus.LISTA_DESPACHO) {
      throw new BadRequestException(
        'Solo se puede iniciar tránsito de transferencias listas para despacho',
      );
    }

    transfer.status = TransferStatus.EN_TRANSITO;
    transfer.actualDepartureTime = new Date();
    return this.transferRepository.save(transfer);
  }

  async arriveDestination(id: number): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.EN_TRANSITO) {
      throw new BadRequestException(
        'Solo se puede marcar llegada de transferencias en tránsito',
      );
    }

    transfer.status = TransferStatus.LLEGADA_DESTINO;
    transfer.actualArrivalTime = new Date();
    return this.transferRepository.save(transfer);
  }

  async complete(
    id: number,
    receivedQuantities?: { productId: number; quantity: number }[],
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.LLEGADA_DESTINO) {
      throw new BadRequestException(
        'Solo se pueden completar transferencias que han llegado al destino',
      );
    }

    // Validar que el QR fue verificado en destino
    if (!transfer.qrVerifiedAtDestination) {
      throw new BadRequestException(
        'Debe verificar el código QR en el destino antes de completar',
      );
    }

    let hasDiscrepancies = false;

    // Si se proporcionaron cantidades recibidas, actualizar detalles
    if (receivedQuantities && receivedQuantities.length > 0) {
      for (const received of receivedQuantities) {
        const detail = transfer.details.find(
          (d) => d.productId === received.productId,
        );

        if (detail) {
          detail.quantityReceived = received.quantity;

          if (detail.quantityExpected !== received.quantity) {
            detail.hasDiscrepancy = true;
            hasDiscrepancies = true;
          }

          await this.transferDetailRepository.save(detail);
        }
      }
    }

    transfer.status = hasDiscrepancies
      ? TransferStatus.COMPLETADA_CON_DISCREPANCIA
      : TransferStatus.COMPLETADA;
    transfer.completedAt = new Date();

    return this.transferRepository.save(transfer);
  }

  async cancel(
    id: number,
    reason: string,
    cancelledByUserId: number,
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (
      transfer.status === TransferStatus.COMPLETADA ||
      transfer.status === TransferStatus.COMPLETADA_CON_DISCREPANCIA ||
      transfer.status === TransferStatus.CANCELADA
    ) {
      throw new BadRequestException(
        'No se puede cancelar una transferencia completada o ya cancelada',
      );
    }

    transfer.status = TransferStatus.CANCELADA;
    transfer.cancellationReason = reason;
    transfer.cancelledByUserId = cancelledByUserId;
    transfer.cancelledAt = new Date();

    return this.transferRepository.save(transfer);
  }

  // ===== GENERACIÓN Y VERIFICACIÓN DE QR =====

  async getQRCode(id: number): Promise<{ qrCode: string; qrImage: string }> {
    const transfer = await this.findOne(id);

    // Si ya tiene QR, devolverlo
    if (transfer.qrCode) {
      const qrImage = await QRCode.toDataURL(transfer.qrCode);
      return { qrCode: transfer.qrCode, qrImage };
    }

    // Generar nuevo código QR (formato: TRF-{id}-{timestamp})
    const qrData = `TRF-${transfer.id}-${Date.now()}`;
    transfer.qrCode = qrData;
    await this.transferRepository.save(transfer);

    // Generar imagen QR en base64
    const qrImage = await QRCode.toDataURL(qrData);

    return { qrCode: qrData, qrImage };
  }

  async verifyQR(
    id: number,
    scannedQR: string,
    location: 'origin' | 'destination',
    userId: number,
  ): Promise<{ success: boolean; message: string; transfer?: Transfer }> {
    const transfer = await this.findOne(id);

    // Verificar que el QR coincide
    if (!transfer.qrCode || transfer.qrCode !== scannedQR) {
      return {
        success: false,
        message: 'El código QR no corresponde a esta transferencia',
      };
    }

    if (location === 'origin') {
      // Verificación en origen
      if (transfer.status !== TransferStatus.EN_PREPARACION) {
        return {
          success: false,
          message: 'La transferencia debe estar en preparación',
        };
      }

      transfer.qrVerifiedAtOrigin = new Date();
      transfer.status = TransferStatus.LISTA_DESPACHO;

      await this.transferRepository.save(transfer);

      return {
        success: true,
        message: 'Verificación exitosa en origen. La transferencia está lista para despacho.',
        transfer,
      };
    } else {
      // Verificación en destino
      if (transfer.status !== TransferStatus.LLEGADA_DESTINO) {
        return {
          success: false,
          message: 'La transferencia debe haber llegado al destino',
        };
      }

      transfer.qrVerifiedAtDestination = new Date();
      await this.transferRepository.save(transfer);

      return {
        success: true,
        message: 'Verificación exitosa en destino. Puede proceder a completar la recepción.',
        transfer,
      };
    }
  }

  // ===== SEGUIMIENTO GPS =====

  async addGPSTracking(
    transferId: number,
    data: { latitude: number; longitude: number; speed?: number; accuracy?: number },
  ): Promise<TrackingLog> {
    const transfer = await this.findOne(transferId);

    // Solo permitir tracking si está en tránsito
    if (transfer.status !== TransferStatus.EN_TRANSITO) {
      throw new BadRequestException(
        'Solo se puede registrar ubicación GPS durante el tránsito',
      );
    }

    const tracking = this.trackingLogRepository.create({
      transferId,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      accuracy: data.accuracy,
      recordedAt: new Date(),
    });

    return this.trackingLogRepository.save(tracking);
  }

  async getTrackingHistory(transferId: number): Promise<TrackingLog[]> {
    await this.findOne(transferId); // Verificar que existe

    return this.trackingLogRepository.find({
      where: { transferId },
      order: { recordedAt: 'ASC' },
    });
  }

  async getLatestTracking(transferId: number): Promise<TrackingLog | null> {
    await this.findOne(transferId); // Verificar que existe

    return this.trackingLogRepository.findOne({
      where: { transferId },
      order: { recordedAt: 'DESC' },
    });
  }
}
