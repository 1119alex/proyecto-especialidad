import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({ name: 'license_number', length: 50 })
  licenseNumber: string;

  @Column({ name: 'license_expiry', type: 'date', nullable: true })
  licenseExpiry: Date;

  @Column({ name: 'emergency_contact', length: 100, nullable: true })
  emergencyContact: string;

  @Column({ name: 'emergency_phone', length: 20, nullable: true })
  emergencyPhone: string;

  // Relaciones
  @OneToOne(() => User, (user) => user.driverProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
