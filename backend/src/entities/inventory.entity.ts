import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Product } from './product.entity';

@Entity('inventory')
@Unique(['warehouseId', 'productId'])
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'warehouse_id' })
  warehouseId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  quantity: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  // Relaciones
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.inventory)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Product, (product) => product.inventory)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
