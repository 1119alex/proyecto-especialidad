import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { TransferStatus } from '../common/enums';
import { Warehouse } from './warehouse.entity';
import { Vehicle } from './vehicle.entity';
import { User } from './user.entity';
import { TransferDetail } from './transfer-detail.entity';
import { TrackingLog } from './tracking-log.entity';
import { Notification } from './notification.entity';

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transfer_code', unique: true, length: 50 })
  transferCode: string;

  // Relaciones FK
  @Column({ name: 'origin_warehouse_id' })
  originWarehouseId: number;

  @Column({ name: 'destination_warehouse_id' })
  destinationWarehouseId: number;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId?: number;

  @Column({ name: 'driver_id', nullable: true })
  driverId?: number;

  @Column({ name: 'created_by_user_id' })
  createdByUserId: number;

  // Estado
  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.PENDIENTE,
  })
  status: TransferStatus;

  // QR
  @Column({ name: 'qr_code', unique: true, length: 255, nullable: true })
  qrCode?: string;

  @Column({ name: 'qr_verified_at_origin', type: 'timestamp', nullable: true })
  qrVerifiedAtOrigin?: Date;

  @Column({ name: 'qr_verified_at_destination', type: 'timestamp', nullable: true })
  qrVerifiedAtDestination?: Date;

  // Tiempos
  @Column({ name: 'estimated_departure_time', type: 'datetime', nullable: true })
  estimatedDepartureTime?: Date;

  @Column({ name: 'estimated_arrival_time', type: 'datetime', nullable: true })
  estimatedArrivalTime?: Date;

  @Column({ name: 'actual_departure_time', type: 'datetime', nullable: true })
  actualDepartureTime?: Date;

  @Column({ name: 'actual_arrival_time', type: 'datetime', nullable: true })
  actualArrivalTime?: Date;

  // Cancelación
  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancelled_by_user_id', nullable: true })
  cancelledByUserId: number;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.outgoingTransfers)
  @JoinColumn({ name: 'origin_warehouse_id' })
  originWarehouse: Warehouse;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.incomingTransfers)
  @JoinColumn({ name: 'destination_warehouse_id' })
  destinationWarehouse: Warehouse;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.transfers)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => User, (user) => user.assignedTransfers)
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @ManyToOne(() => User, (user) => user.createdTransfers)
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by_user_id' })
  cancelledBy: User;

  @OneToMany(() => TransferDetail, (detail) => detail.transfer, { cascade: true })
  details: TransferDetail[];

  @OneToMany(() => TrackingLog, (log) => log.transfer)
  trackingLogs: TrackingLog[];

  @OneToMany(() => Notification, (notification) => notification.transfer)
  notifications: Notification[];
}
