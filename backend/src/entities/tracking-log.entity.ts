import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transfer } from './transfer.entity';

@Entity('tracking_logs')
export class TrackingLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transfer_id' })
  transferId: number;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  speed: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy: number;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  // Relaciones
  @ManyToOne(() => Transfer, (transfer) => transfer.trackingLogs)
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;
}
