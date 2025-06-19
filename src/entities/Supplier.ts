// src/entities/Supplier.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Purchase } from './Purchase';

export enum SupplierType {
  Manufacturer = 'Manufacturer',
  Distributor = 'Distributor',
  Wholesaler = 'Wholesaler',
  Retailer = 'Retailer',
  Dealer = 'Dealer',
  // adjust options per your domain
}

@Entity()
export class Supplier {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'text', nullable: true }) picture?: string;
  @Column({ type: 'varchar', unique: true, nullable: true }) email?: string;
  @Column({ type: 'varchar', unique: true, nullable: true }) phone?: string;
  @Column({ type: 'varchar', unique: true, nullable: true }) whatsapp?: string;
  @Column({ type: 'text', nullable: true }) address?: string;
  @Column({ type: 'varchar', nullable: true }) website?: string;
  @Column({ type: 'varchar', nullable: true }) contactPerson?: string;
  @Column({ type: 'varchar', nullable: true }) taxId?: string;
  @Column({ type: 'simple-enum', enum: SupplierType, default: SupplierType.Distributor })
  supplierType!: SupplierType;
  @OneToMany(() => Purchase, (p) => p.supplier) purchases!: Purchase[];

  @Column({ type: 'simple-enum', enum: ['Active', 'Inactive'], default: 'Active' })
  status!: 'Active' | 'Inactive';

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
