// src/entities/Stock.ts

import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Product } from './Product';
import { Batch } from './Batch';
import { Store } from './Store';
import { SaleProduct } from './SaleProduct';

@Entity()
export class Stock {
  @PrimaryGeneratedColumn('uuid') id!: string;

  @ManyToOne(() => Batch, (b) => b.stockEntries, { nullable: true })
  batch?: Batch;

  @ManyToOne(() => Product, (p) => p.stockEntries, { nullable: false })
  product!: Product;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  unitCost!: number;

  @ManyToOne(() => Store, (s) => s.stocks, { nullable: true })
  store?: Store;

  @Column({ type: 'varchar', nullable: true })
  warehouse?: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  barcode?: string;

  @OneToMany(() => SaleProduct, (sp) => sp.stock)
  saleProducts!: SaleProduct[];

  @Column({ type: 'simple-enum', enum: ['Active', 'Inactive'], default: 'Active' })
  status!: 'Active' | 'Inactive';

  @Column({ type: 'text', nullable: true }) notes?: string;

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
