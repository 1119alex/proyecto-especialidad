import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Transfer } from '../../entities/transfer.entity';
import { TransferDetail } from '../../entities/transfer-detail.entity';
import { TrackingLog } from '../../entities/tracking-log.entity';
import { Product } from '../../entities/product.entity';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryMovement } from '../../entities/inventory-movement.entity';
import { User } from '../../entities/user.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferDto } from './dto/update-transfer.dto';
import { ReceivedQuantityDto } from './dto/complete-transfer.dto';
import { GPSTrackingPointDto } from './dto/gps-tracking-batch.dto';
import { TrackingGateway } from '../realtime/tracking.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from '../../common/enums/notification-type.enum';
import { TransferStatus } from '../../common/enums/transfer-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { MovementType } from '../../common/enums/inventory-movement.enum';
import * as QRCode from 'qrcode';

@Injectable()
export class TransfersService {
  private readonly logger = new Logger(TransfersService.name);

  constructor(
    @InjectRepository(Transfer)
    private readonly transferRepository: Repository<Transfer>,
    @InjectRepository(TransferDetail)
    private readonly transferDetailRepository: Repository<TransferDetail>,
    @InjectRepository(TrackingLog)
    private readonly trackingLogRepository: Repository<TrackingLog>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly trackingGateway: TrackingGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    createTransferDto: CreateTransferDto,
    createdByUserId: number,
  ): Promise<Transfer> {
    if (
      createTransferDto.originWarehouseId ===
      createTransferDto.destinationWarehouseId
    ) {
      throw new BadRequestException(
        'El almacén de origen y destino deben ser diferentes',
      );
    }

    if (!createTransferDto.details || createTransferDto.details.length === 0) {
      throw new BadRequestException(
        'La transferencia debe incluir al menos un producto',
      );
    }

    const transferCode = await this.generateTransferCode();

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

    transfer.status =
      createTransferDto.vehicleId && createTransferDto.driverId
        ? TransferStatus.ASIGNADA
        : TransferStatus.PENDIENTE;

    transfer.createdByUserId = createdByUserId;

    // Validar productos y stock disponible en origen antes de guardar
    const details: TransferDetail[] = [];
    for (const detail of createTransferDto.details) {
      const product = await this.productRepository.findOne({
        where: { id: detail.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${detail.productId} no encontrado`,
        );
      }

      // Si el almacén de origen tiene inventario registrado para el producto,
      // exigir stock suficiente. Sin registro se permite (stock no inicializado).
      const originInventory = await this.inventoryRepository.findOne({
        where: {
          warehouseId: createTransferDto.originWarehouseId,
          productId: detail.productId,
        },
      });

      if (
        originInventory &&
        Number(originInventory.quantity) < detail.quantity
      ) {
        throw new BadRequestException(
          `Stock insuficiente de "${product.name}" en el almacén de origen ` +
            `(disponible: ${Number(originInventory.quantity)}, solicitado: ${detail.quantity})`,
        );
      }

      const transferDetail = new TransferDetail();
      transferDetail.productId = detail.productId;
      transferDetail.productSku = product.sku;
      transferDetail.productName = product.name;
      transferDetail.unit = product.unit;
      transferDetail.quantityExpected = detail.quantity;
      details.push(transferDetail);
    }

    // Guardar transferencia y detalles de forma atómica
    const savedTransfer = await this.dataSource.transaction(
      async (manager) => {
        const saved = await manager.save(Transfer, transfer);
        for (const detail of details) {
          detail.transferId = saved.id;
        }
        await manager.save(TransferDetail, details);
        return saved;
      },
    );

    const result = await this.findOne(savedTransfer.id);

    // Si nació asignada, notificar al transportista y al almacén origen
    if (result.status === TransferStatus.ASIGNADA) {
      this.notifyAssignment(result);
    }

    return result;
  }

  async findAll(user?: User): Promise<Transfer[]> {
    const relations = [
      'originWarehouse',
      'destinationWarehouse',
      'vehicle',
      'driver',
      'createdBy',
      'details',
      'details.product',
    ];

    if (!user || user.role === UserRole.ADMIN) {
      return this.transferRepository.find({
        relations,
        order: { createdAt: 'DESC' },
      });
    }

    if (user.role === UserRole.TRANSPORTISTA) {
      return this.transferRepository.find({
        where: { driverId: user.id },
        relations,
        order: { createdAt: 'DESC' },
      });
    }

    if (user.role === UserRole.ENCARGADO_ALMACEN) {
      const warehouseId = user.warehouseStaffProfile?.warehouseId;
      if (!warehouseId) {
        this.logger.warn(
          `Encargado de almacén sin almacén asignado (userId=${user.id})`,
        );
        return [];
      }

      return this.transferRepository
        .createQueryBuilder('transfer')
        .leftJoinAndSelect('transfer.originWarehouse', 'originWarehouse')
        .leftJoinAndSelect(
          'transfer.destinationWarehouse',
          'destinationWarehouse',
        )
        .leftJoinAndSelect('transfer.vehicle', 'vehicle')
        .leftJoinAndSelect('transfer.driver', 'driver')
        .leftJoinAndSelect('transfer.createdBy', 'createdBy')
        .leftJoinAndSelect('transfer.details', 'details')
        .leftJoinAndSelect('details.product', 'product')
        .where(
          'transfer.originWarehouseId = :warehouseId OR transfer.destinationWarehouseId = :warehouseId',
          { warehouseId },
        )
        .orderBy('transfer.createdAt', 'DESC')
        .getMany();
    }

    return [];
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

    if (updateTransferDto.status) {
      this.validateStatusTransition(transfer.status, updateTransferDto.status);

      // Las transiciones operativas tienen reglas propias (verificación QR,
      // inventario, discrepancias, notificaciones) y solo pueden ejecutarse
      // desde sus endpoints dedicados; por esta vía se evitaría esa lógica
      const allowedViaUpdate = [
        TransferStatus.ASIGNADA,
        TransferStatus.CANCELADA,
      ];
      if (!allowedViaUpdate.includes(updateTransferDto.status)) {
        throw new BadRequestException(
          `El estado ${updateTransferDto.status} solo puede establecerse desde su ` +
            'endpoint dedicado (start-preparation, verify-qr, start-transit, ' +
            'arrive-destination, complete)',
        );
      }
    }

    if (
      updateTransferDto.status === TransferStatus.CANCELADA &&
      !updateTransferDto.cancellationReason
    ) {
      throw new BadRequestException(
        'Debe proporcionar una razón de cancelación',
      );
    }

    // Los detalles no se actualizan por esta vía
    const { details, ...updateData } = updateTransferDto;

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([, value]) => value !== undefined),
    );

    Object.assign(transfer, cleanUpdateData);

    if (updateTransferDto.status === TransferStatus.CANCELADA) {
      transfer.cancelledAt = new Date();
    }

    if (updateData.estimatedDepartureTime) {
      transfer.estimatedDepartureTime = new Date(
        updateData.estimatedDepartureTime,
      );
    }
    if (updateData.estimatedArrivalTime) {
      transfer.estimatedArrivalTime = new Date(updateData.estimatedArrivalTime);
    }

    // Asignar vehículo y conductor a una PENDIENTE la convierte en ASIGNADA
    const becameAssigned =
      transfer.status === TransferStatus.PENDIENTE &&
      !!transfer.vehicleId &&
      !!transfer.driverId;
    if (becameAssigned) {
      transfer.status = TransferStatus.ASIGNADA;
    }

    const saved = await this.transferRepository.save(transfer);

    if (becameAssigned) {
      this.notifyAssignment(await this.findOne(saved.id));
    }

    return saved;
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

    const saved = await this.transferRepository.save(transfer);

    this.notifyAssignment(await this.findOne(saved.id));

    return saved;
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

    const count = await this.transferRepository
      .createQueryBuilder('transfer')
      .where('DATE(transfer.createdAt) = CURRENT_DATE')
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

  // ===== NOTIFICACIONES DE EVENTOS (RF06) =====

  /** Notifica asignación al transportista y preparación al almacén origen */
  private notifyAssignment(transfer: Transfer): void {
    const route = `${transfer.originWarehouse?.name ?? 'origen'} → ${transfer.destinationWarehouse?.name ?? 'destino'}`;

    if (transfer.driverId) {
      void this.notificationsService.notifyUser(transfer.driverId, {
        type: NotificationType.ASIGNACION,
        title: 'Nuevo viaje asignado',
        message: `Se te asignó la transferencia ${transfer.transferCode} (${route}).`,
        transferId: transfer.id,
      });
    }

    void this.notificationsService.notifyWarehouseStaff(
      transfer.originWarehouseId,
      {
        type: NotificationType.PREPARACION,
        title: 'Preparar carga',
        message: `Prepare la carga de la transferencia ${transfer.transferCode} (${route}).`,
        transferId: transfer.id,
      },
    );
  }

  /** Notifica la llegada a destino al administrador y al almacén destino */
  private notifyArrival(transfer: Transfer, byGeofence: boolean): void {
    const how = byGeofence
      ? 'detectada automáticamente por geocerca'
      : 'confirmada por el transportista';
    const message = `La transferencia ${transfer.transferCode} llegó al almacén destino (${how}).`;

    void this.notificationsService.notifyAdmins({
      type: NotificationType.LLEGADA,
      title: 'Llegada a destino',
      message,
      transferId: transfer.id,
    });

    void this.notificationsService.notifyWarehouseStaff(
      transfer.destinationWarehouseId,
      {
        type: NotificationType.LLEGADA,
        title: 'Mercancía por recibir',
        message: `${message} Verifique el QR y confirme la recepción.`,
        transferId: transfer.id,
      },
    );
  }

  /** Notifica el cierre de la transferencia (con o sin discrepancias) */
  private notifyCompletion(transfer: Transfer, hasDiscrepancies: boolean): void {
    if (hasDiscrepancies) {
      const detail = transfer.details
        .filter((d) => d.hasDiscrepancy)
        .map(
          (d) =>
            `${d.productName}: esperado ${Number(d.quantityExpected)}, recibido ${Number(d.quantityReceived)}`,
        )
        .join('; ');

      void this.notificationsService.notifyAdmins({
        type: NotificationType.DISCREPANCIA,
        title: 'Transferencia completada con discrepancias',
        message: `${transfer.transferCode} cerró con diferencias — ${detail}.`,
        transferId: transfer.id,
        priority: NotificationPriority.HIGH,
      });
    } else {
      void this.notificationsService.notifyAdmins({
        type: NotificationType.RECEPCION,
        title: 'Transferencia completada',
        message: `${transfer.transferCode} fue recibida y cerrada sin discrepancias.`,
        transferId: transfer.id,
      });
    }

    if (transfer.driverId) {
      void this.notificationsService.notifyUser(transfer.driverId, {
        type: NotificationType.RECEPCION,
        title: 'Entrega confirmada',
        message: `La recepción de ${transfer.transferCode} fue confirmada en destino.`,
        transferId: transfer.id,
      });
    }
  }

  // ===== VALIDACIONES DE PERTENENCIA =====

  /** El usuario debe ser ADMIN o encargado del almacén indicado. */
  private assertWarehouseStaff(
    user: User,
    warehouseId: number,
    actionDescription: string,
  ): void {
    if (user.role === UserRole.ADMIN) return;

    const userWarehouseId = user.warehouseStaffProfile?.warehouseId;
    if (
      user.role !== UserRole.ENCARGADO_ALMACEN ||
      userWarehouseId !== warehouseId
    ) {
      throw new ForbiddenException(
        `Solo el encargado del almacén correspondiente puede ${actionDescription}`,
      );
    }
  }

  /** El usuario debe ser ADMIN o el transportista asignado a la transferencia. */
  private assertAssignedDriver(user: User, transfer: Transfer): void {
    if (user.role === UserRole.ADMIN) return;

    if (user.role !== UserRole.TRANSPORTISTA || transfer.driverId !== user.id) {
      throw new ForbiddenException(
        'Solo el transportista asignado puede realizar esta acción',
      );
    }
  }

  // ===== GESTIÓN DE ESTADOS =====

  async startPreparation(id: number, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);

    this.assertWarehouseStaff(
      user,
      transfer.originWarehouseId,
      'iniciar la preparación',
    );

    if (transfer.status !== TransferStatus.ASIGNADA) {
      throw new BadRequestException(
        'Solo se puede iniciar preparación de transferencias asignadas',
      );
    }

    transfer.status = TransferStatus.EN_PREPARACION;
    return this.transferRepository.save(transfer);
  }

  // El tránsito NO tiene un endpoint propio: se inicia al verificar el QR en
  // origen (verifyQR con location='origin'). Escanear el QR ES la acción que
  // confirma que el transportista recogió la carga y arranca el viaje, por lo
  // que un paso "start-transit" separado sería redundante (y solo accesible
  // antes de la verificación, justo cuando aún no debe permitirse).

  async arriveDestination(id: number, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);

    this.assertAssignedDriver(user, transfer);

    if (transfer.status !== TransferStatus.EN_TRANSITO) {
      throw new BadRequestException(
        'Solo se puede marcar llegada de transferencias en tránsito',
      );
    }

    transfer.status = TransferStatus.LLEGADA_DESTINO;
    transfer.actualArrivalTime = new Date();
    const saved = await this.transferRepository.save(transfer);

    this.logger.log(
      `Transferencia ${saved.transferCode} llegó a destino (id=${saved.id})`,
    );

    this.notifyArrival(transfer, false);
    this.trackingGateway.emitTransferEvent(transfer.id, {
      type: 'arrival',
      status: saved.status,
    });

    return saved;
  }

  async complete(
    id: number,
    user: User,
    receivedQuantities?: ReceivedQuantityDto[],
  ): Promise<Transfer> {
    const transfer = await this.findOne(id);

    this.assertWarehouseStaff(
      user,
      transfer.destinationWarehouseId,
      'confirmar la recepción',
    );

    if (transfer.status !== TransferStatus.LLEGADA_DESTINO) {
      throw new BadRequestException(
        'Solo se pueden completar transferencias que han llegado al destino',
      );
    }

    if (!transfer.qrVerifiedAtDestination) {
      throw new BadRequestException(
        'Debe verificar el código QR en el destino antes de completar',
      );
    }

    let hasDiscrepancies = false;

    // Registrar cantidades recibidas; sin reporte explícito se asume recepción completa
    for (const detail of transfer.details) {
      const received = receivedQuantities?.find(
        (r) => r.productId === detail.productId,
      );
      const receivedQty =
        received !== undefined
          ? received.quantity
          : Number(detail.quantityExpected);

      detail.quantityReceived = receivedQty;
      detail.hasDiscrepancy =
        Number(detail.quantityExpected) !== Number(receivedQty);
      if (detail.hasDiscrepancy) {
        hasDiscrepancies = true;
      }
    }

    transfer.status = hasDiscrepancies
      ? TransferStatus.COMPLETADA_CON_DISCREPANCIA
      : TransferStatus.COMPLETADA;
    transfer.completedAt = new Date();

    // Cierre atómico: detalles + transferencia + inventarios + movimientos
    await this.dataSource.transaction(async (manager) => {
      await manager.save(TransferDetail, transfer.details);
      await manager.save(Transfer, transfer);

      for (const detail of transfer.details) {
        const sentQty = Number(detail.quantityExpected);
        const receivedQty = Number(detail.quantityReceived);

        // Salida del almacén de origen (lo despachado)
        await this.applyInventoryMovement(manager, {
          warehouseId: transfer.originWarehouseId,
          productId: detail.productId,
          transferId: transfer.id,
          movementType: MovementType.SALIDA,
          quantity: sentQty,
          performedByUserId: user.id,
          reason: `Salida por transferencia ${transfer.transferCode}`,
        });

        // Entrada al almacén de destino (lo efectivamente recibido)
        await this.applyInventoryMovement(manager, {
          warehouseId: transfer.destinationWarehouseId,
          productId: detail.productId,
          transferId: transfer.id,
          movementType: MovementType.ENTRADA,
          quantity: receivedQty,
          performedByUserId: user.id,
          reason: `Entrada por transferencia ${transfer.transferCode}`,
        });
      }
    });

    this.logger.log(
      `Transferencia ${transfer.transferCode} completada` +
        (hasDiscrepancies ? ' con discrepancias' : '') +
        ` (id=${transfer.id})`,
    );

    this.notifyCompletion(transfer, hasDiscrepancies);
    this.trackingGateway.emitTransferEvent(transfer.id, {
      type: 'completed',
      status: transfer.status,
    });

    return this.findOne(id);
  }

  /**
   * Aplica un movimiento de inventario (entrada o salida) y deja registro
   * en inventory_movements. El stock nunca queda negativo: si el almacén de
   * origen no tenía inventario inicializado, la salida lo deja en cero.
   */
  private async applyInventoryMovement(
    manager: EntityManager,
    params: {
      warehouseId: number;
      productId: number;
      transferId: number;
      movementType: MovementType;
      quantity: number;
      performedByUserId: number;
      reason: string;
    },
  ): Promise<void> {
    let inventory = await manager.findOne(Inventory, {
      where: {
        warehouseId: params.warehouseId,
        productId: params.productId,
      },
    });

    if (!inventory) {
      inventory = manager.create(Inventory, {
        warehouseId: params.warehouseId,
        productId: params.productId,
        quantity: 0,
      });
    }

    const previousQuantity = Number(inventory.quantity);
    const delta =
      params.movementType === MovementType.ENTRADA
        ? params.quantity
        : -params.quantity;
    const newQuantity = Math.max(0, previousQuantity + delta);

    inventory.quantity = newQuantity;
    await manager.save(Inventory, inventory);

    const movement = manager.create(InventoryMovement, {
      warehouseId: params.warehouseId,
      productId: params.productId,
      transferId: params.transferId,
      movementType: params.movementType,
      quantity: params.quantity,
      previousQuantity,
      newQuantity,
      reason: params.reason,
      performedByUserId: params.performedByUserId,
    });
    await manager.save(InventoryMovement, movement);
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

    const saved = await this.transferRepository.save(transfer);

    if (transfer.driverId) {
      void this.notificationsService.notifyUser(transfer.driverId, {
        type: NotificationType.CANCELACION,
        title: 'Viaje cancelado',
        message: `La transferencia ${transfer.transferCode} fue cancelada: ${reason}`,
        transferId: transfer.id,
        priority: NotificationPriority.HIGH,
      });
    }

    return saved;
  }

  // ===== GENERACIÓN Y VERIFICACIÓN DE QR =====

  /** Firma HMAC-SHA256 truncada que hace el QR no falsificable. */
  private signQRPayload(payload: string): string {
    const secret =
      this.configService.get<string>('QR_SECRET') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default-secret';
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
      .slice(0, 16);
  }

  private isValidQRSignature(qrCode: string): boolean {
    // Formato firmado: TRF-{id}-{timestamp}-{firma}
    const parts = qrCode.split('-');
    if (parts.length !== 4) {
      // Formato legado sin firma (TRF-{id}-{timestamp}): se acepta porque
      // la verificación principal compara contra el valor almacenado en BD
      return parts.length === 3;
    }
    const payload = parts.slice(0, 3).join('-');
    const signature = parts[3];
    const expected = this.signQRPayload(payload);
    return (
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    );
  }

  async getQRCode(
    id: number,
    user: User,
  ): Promise<{ qrCode: string; qrImage: string }> {
    const transfer = await this.findOne(id);

    // Si ya tiene QR, devolverlo (cualquier actor de la transferencia puede mostrarlo)
    if (transfer.qrCode) {
      const qrImage = await QRCode.toDataURL(transfer.qrCode);
      return { qrCode: transfer.qrCode, qrImage };
    }

    // Generarlo implica cambiar el estado: solo encargado de origen o admin
    this.assertWarehouseStaff(
      user,
      transfer.originWarehouseId,
      'generar el código QR',
    );

    if (transfer.status !== TransferStatus.EN_PREPARACION) {
      throw new BadRequestException(
        'Solo se puede generar QR para transferencias en preparación',
      );
    }

    const payload = `TRF-${transfer.id}-${Date.now()}`;
    const qrData = `${payload}-${this.signQRPayload(payload)}`;
    transfer.qrCode = qrData;
    transfer.status = TransferStatus.LISTA_DESPACHO;

    await this.transferRepository.save(transfer);

    this.logger.log(
      `QR generado para ${transfer.transferCode}; estado LISTA_DESPACHO (id=${id})`,
    );

    const qrImage = await QRCode.toDataURL(qrData);

    return { qrCode: qrData, qrImage };
  }

  async verifyQR(
    id: number,
    scannedQR: string,
    location: 'origin' | 'destination',
    user: User,
  ): Promise<{ success: boolean; message: string; transfer?: Transfer }> {
    const transfer = await this.findOne(id);

    if (
      !transfer.qrCode ||
      transfer.qrCode !== scannedQR ||
      !this.isValidQRSignature(scannedQR)
    ) {
      return {
        success: false,
        message: 'El código QR no corresponde a esta transferencia',
      };
    }

    if (location === 'origin') {
      // En origen escanea el transportista asignado (o el encargado de origen)
      if (user.role === UserRole.ENCARGADO_ALMACEN) {
        this.assertWarehouseStaff(
          user,
          transfer.originWarehouseId,
          'verificar el QR en origen',
        );
      } else {
        this.assertAssignedDriver(user, transfer);
      }

      if (transfer.status !== TransferStatus.LISTA_DESPACHO) {
        return {
          success: false,
          message: 'La transferencia debe estar lista para despacho',
        };
      }

      // Verificar el QR en origen es lo que inicia el tránsito (no hay un paso
      // "start-transit" aparte): registra la salida y deja la transferencia en ruta
      transfer.qrVerifiedAtOrigin = new Date();
      transfer.status = TransferStatus.EN_TRANSITO;
      transfer.actualDepartureTime = new Date();

      await this.transferRepository.save(transfer);

      this.logger.log(
        `QR verificado en origen para ${transfer.transferCode}; en tránsito (id=${id})`,
      );

      return {
        success: true,
        message:
          'Verificación exitosa en origen. La transferencia está en tránsito.',
        transfer,
      };
    }

    // En destino escanea el encargado del almacén de destino
    this.assertWarehouseStaff(
      user,
      transfer.destinationWarehouseId,
      'verificar el QR en destino',
    );

    if (transfer.status !== TransferStatus.LLEGADA_DESTINO) {
      return {
        success: false,
        message: 'La transferencia debe haber llegado al destino',
      };
    }

    // La verificación NO completa la transferencia: el encargado debe revisar
    // la mercancía y confirmar la recepción (con o sin discrepancias)
    transfer.qrVerifiedAtDestination = new Date();
    await this.transferRepository.save(transfer);

    this.logger.log(
      `QR verificado en destino para ${transfer.transferCode}; pendiente de confirmación de recepción (id=${id})`,
    );

    return {
      success: true,
      message:
        'QR verificado en destino. Revise la mercancía y confirme la recepción.',
      transfer,
    };
  }

  // ===== SEGUIMIENTO GPS =====

  /** Distancia haversine en metros entre dos coordenadas */
  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const earthRadius = 6371000; // metros

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * earthRadius * Math.asin(Math.sqrt(a));
  }

  /**
   * Geocerca (RF11): si la última posición está dentro del radio del almacén
   * destino, marca automáticamente la llegada y dispara las notificaciones.
   * Devuelve true si la llegada fue detectada.
   */
  private async checkGeofenceArrival(
    transfer: Transfer,
    latitude: number,
    longitude: number,
  ): Promise<boolean> {
    // Solo tiene sentido durante el tránsito: evita re-disparar la llegada
    // (y sobreescribir actualArrivalTime) si ya se marcó por otra vía.
    if (transfer.status !== TransferStatus.EN_TRANSITO) {
      return false;
    }

    const destination = transfer.destinationWarehouse;
    if (
      !destination ||
      destination.latitude == null ||
      destination.longitude == null
    ) {
      return false;
    }

    const distance = this.haversineDistance(
      latitude,
      longitude,
      Number(destination.latitude),
      Number(destination.longitude),
    );

    const radius = Number(destination.geofenceRadius) || 100;
    if (distance > radius) {
      return false;
    }

    transfer.status = TransferStatus.LLEGADA_DESTINO;
    transfer.actualArrivalTime = new Date();
    await this.transferRepository.save(transfer);

    this.logger.log(
      `Geocerca activada: ${transfer.transferCode} llegó a destino ` +
        `(distancia ${Math.round(distance)} m, radio ${radius} m)`,
    );

    this.notifyArrival(transfer, true);
    this.trackingGateway.emitTransferEvent(transfer.id, {
      type: 'geofence-arrival',
      status: transfer.status,
    });

    return true;
  }

  async addGPSTracking(
    transferId: number,
    data: {
      latitude: number;
      longitude: number;
      speed?: number;
      accuracy?: number;
    },
    user: User,
  ): Promise<TrackingLog> {
    const transfer = await this.findOne(transferId);

    this.assertAssignedDriver(user, transfer);

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

    const saved = await this.trackingLogRepository.save(tracking);

    // Push en tiempo real al mapa de seguimiento
    this.trackingGateway.emitTrackingPoints(transferId, [saved]);

    // Geocerca: detección automática de llegada (RF11)
    await this.checkGeofenceArrival(transfer, data.latitude, data.longitude);

    return saved;
  }

  /**
   * Registra un lote de puntos GPS en una sola operación. Los puntos
   * conservan el timestamp de captura del dispositivo (recordedAt), lo que
   * permite a la app móvil acumular posiciones sin conexión y sincronizarlas
   * al recuperar señal.
   */
  async addGPSTrackingBatch(
    transferId: number,
    points: GPSTrackingPointDto[],
    user: User,
  ): Promise<{
    saved: number;
    trackingLogs: TrackingLog[];
    transferStatus: TransferStatus;
    arrivedByGeofence: boolean;
  }> {
    const transfer = await this.findOne(transferId);

    this.assertAssignedDriver(user, transfer);

    if (transfer.status !== TransferStatus.EN_TRANSITO) {
      throw new BadRequestException(
        'Solo se puede registrar ubicación GPS durante el tránsito',
      );
    }

    const logs = points.map((point) =>
      this.trackingLogRepository.create({
        transferId,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        accuracy: point.accuracy,
        recordedAt: point.recordedAt ? new Date(point.recordedAt) : new Date(),
      }),
    );

    const saved = await this.trackingLogRepository.save(logs);

    this.trackingGateway.emitTrackingPoints(transferId, saved);

    // Geocerca contra el punto más reciente del lote (RF11)
    const lastPoint = points[points.length - 1];
    const arrivedByGeofence = await this.checkGeofenceArrival(
      transfer,
      lastPoint.latitude,
      lastPoint.longitude,
    );

    return {
      saved: saved.length,
      trackingLogs: saved,
      transferStatus: transfer.status,
      arrivedByGeofence,
    };
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
