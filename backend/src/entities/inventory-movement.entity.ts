import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MovementType } from '../common/enums';
import { Warehouse } from './warehouse.entity';
import { Product } from './product.entity';
import { Transfer } from './transfer.entity';
import { User } from './user.entity';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'warehouse_id' })
  warehouseId: number;

  @Column({ name: 'product_id' })
  productId: number;

  @Column({ name: 'transfer_id', nullable: true })
  transferId: number;

  @Column({
    name: 'movement_type',
    type: 'enum',
    enum: MovementType,
  })
  movementType: MovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ name: 'previous_quantity', type: 'decimal', precision: 10, scale: 2 })
  previousQuantity: number;

  @Column({ name: 'new_quantity', type: 'decimal', precision: 10, scale: 2 })
  newQuantity: number;

  @Column({ length: 255, nullable: true })
  reason: string;

  @Column({ name: 'performed_by_user_id' })
  performedByUserId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relaciones
  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Transfer, { nullable: true })
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by_user_id' })
  performedBy: User;
}
