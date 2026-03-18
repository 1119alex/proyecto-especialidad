import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TransferDetail } from './transfer-detail.entity';
import { Inventory } from './inventory.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  sku: string;

  @Column({ unique: true, length: 50, nullable: true })
  barcode: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  category: string;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'min_stock', default: 0 })
  minStock: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @OneToMany(() => TransferDetail, (detail) => detail.product)
  transferDetails: TransferDetail[];

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory[];
}
