import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { NotificationType, NotificationPriority } from '../common/enums';
import { User } from './user.entity';
import { Transfer } from './transfer.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'transfer_id', nullable: true })
  transferId: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({ length: 100 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;

  // FCM
  @Column({ name: 'fcm_token', length: 255, nullable: true })
  fcmToken: string;

  @Column({ name: 'fcm_sent', default: false })
  fcmSent: boolean;

  @Column({ name: 'fcm_sent_at', type: 'timestamp', nullable: true })
  fcmSentAt: Date;

  // Relaciones
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Transfer, (transfer) => transfer.notifications, { nullable: true })
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;
}
