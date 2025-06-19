// src/entities/Customer.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Sale } from './Sale';

export enum CustomerType {
  Retailer = 'Retailer',
  Dealer = 'Dealer',
  Wholesaler = 'Wholesaler',
  // add more if needed
}

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'text', nullable: true }) picture?: string;
  @Column({ type: 'varchar', unique: true, nullable: true }) email?: string;     // made optional
  @Column({ type: 'varchar', unique: true, nullable: true }) phone?: string;     // optional
  @Column({ type: 'varchar', unique: true, nullable: true }) whatsapp?: string;  // NEW
  @Column({ type: 'text', nullable: true }) address?: string;
  @Column({ type: 'varchar', nullable: true }) companyName?: string;
  @Column({ type: 'simple-enum', enum: CustomerType, default: CustomerType.Retailer })
  customerType!: CustomerType;
  @Column({ type: 'varchar', nullable: true }) taxId?: string;

  @OneToMany(() => Sale, (s) => s.customer) sales!: Sale[];

  @Column({ type: 'simple-enum', enum: ['Active', 'Inactive'], default: 'Active' })
  status!: 'Active' | 'Inactive';   // NEW

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
