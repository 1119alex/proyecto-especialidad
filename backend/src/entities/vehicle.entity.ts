import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { VehicleStatus } from '../common/enums';
import { Transfer } from './transfer.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'license_plate', unique: true, length: 20 })
  licensePlate: string;

  @Column({ length: 50, nullable: true })
  model: string;

  @Column({ nullable: true })
  year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  capacity: number;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.DISPONIBLE,
  })
  status: VehicleStatus;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => Transfer, (transfer) => transfer.vehicle)
  transfers: Transfer[];
}
