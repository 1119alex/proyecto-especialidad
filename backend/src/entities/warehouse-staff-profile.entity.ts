import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Warehouse } from './warehouse.entity';

@Entity('warehouse_staff_profiles')
export class WarehouseStaffProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({ name: 'warehouse_id' })
  warehouseId: number;

  @Column({ length: 50, nullable: true })
  position: string;

  // Relaciones
  @OneToOne(() => User, (user) => user.warehouseStaffProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Warehouse, (warehouse) => warehouse.staff)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;
}
