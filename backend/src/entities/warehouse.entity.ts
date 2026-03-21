import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { WarehouseStaffProfile } from './warehouse-staff-profile.entity';
import { Transfer } from './transfer.entity';
import { Inventory } from './inventory.entity';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255 })
  address: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ name: 'geofence_radius', default: 100 })
  geofenceRadius: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => WarehouseStaffProfile, (staff) => staff.warehouse)
  staff: WarehouseStaffProfile[];

  @OneToMany(() => Transfer, (transfer) => transfer.originWarehouse)
  outgoingTransfers: Transfer[];

  @OneToMany(() => Transfer, (transfer) => transfer.destinationWarehouse)
  incomingTransfers: Transfer[];

  @OneToMany(() => Inventory, (inventory) => inventory.warehouse)
  inventory: Inventory[];
}
