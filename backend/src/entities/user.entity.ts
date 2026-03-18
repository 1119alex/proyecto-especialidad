import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../common/enums';
import { DriverProfile } from './driver-profile.entity';
import { WarehouseStaffProfile } from './warehouse-staff-profile.entity';
import { Transfer } from './transfer.entity';
import { Notification } from './notification.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  @Exclude()
  passwordHash: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToOne(() => DriverProfile, (profile) => profile.user, { nullable: true })
  driverProfile?: DriverProfile;

  @OneToOne(() => WarehouseStaffProfile, (profile) => profile.user, { nullable: true })
  warehouseStaffProfile?: WarehouseStaffProfile;

  @OneToMany(() => Transfer, (transfer) => transfer.driver)
  assignedTransfers: Transfer[];

  @OneToMany(() => Transfer, (transfer) => transfer.createdBy)
  createdTransfers: Transfer[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}
