import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transfer } from './transfer.entity';
import { Product } from './product.entity';

@Entity('transfer_details')
export class TransferDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'transfer_id' })
  transferId: number;

  @Column({ name: 'product_id' })
  productId: number;

  // Snapshot del producto
  @Column({ name: 'product_sku', length: 50 })
  productSku: string;

  @Column({ name: 'product_name', length: 100 })
  productName: string;

  // Cantidades
  @Column({ name: 'quantity_expected', type: 'decimal', precision: 10, scale: 2 })
  quantityExpected: number;

  @Column({ name: 'quantity_received', type: 'decimal', precision: 10, scale: 2, nullable: true })
  quantityReceived: number;

  @Column({ length: 20 })
  unit: string;

  // Discrepancia
  @Column({ name: 'has_discrepancy', default: false })
  hasDiscrepancy: boolean;

  @Column({ name: 'discrepancy_reason', length: 255, nullable: true })
  discrepancyReason: string;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  unitPrice: number;

  @Column({ length: 255, nullable: true })
  notes: string;

  // Relaciones
  @ManyToOne(() => Transfer, (transfer) => transfer.details)
  @JoinColumn({ name: 'transfer_id' })
  transfer: Transfer;

  @ManyToOne(() => Product, (product) => product.transferDetails)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
