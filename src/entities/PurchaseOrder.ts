import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Supplier } from './Supplier';
import { User } from './User';
import { PurchaseOrderItem } from './PurchaseOrderItem';

export enum PurchaseOrderStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  SENT = 'Sent',
  RECEIVED = 'Received',
  CANCELLED = 'Cancelled',
}

@Entity()
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  orderNumber!: string;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Supplier;

  @Column({ type: 'date' })
  orderDate!: string;

  @Column({ type: 'date' })
  deliveryDate!: string;

  @Column({ type: 'simple-enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.PENDING })
  status!: PurchaseOrderStatus;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, { cascade: true })
  items!: PurchaseOrderItem[];

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  tax!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shipping!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  total!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', nullable: true })
  approvedBy?: string;

  @Column({ type: 'date', nullable: true })
  approvedDate?: string;

  @Column({ type: 'varchar', nullable: true })
  deliveryStatus?: string;

  @Column({ type: 'text', nullable: true })
  deliveryNotes?: string;

  @Column({ type: 'int', nullable: true })
  createdBy?: number;

  @Column({ type: 'int', nullable: true })
  updatedBy?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}