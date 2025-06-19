// src/entities/TaxRate.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
} from 'typeorm';
import { Product } from './Product';
import { TaxGroup } from './TaxGroup';

@Entity()
export class TaxRate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;  // e.g. VAT, GST

  @Column('decimal', { precision: 5, scale: 2 })
  rate!: number;  // percentage rate

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Product, (product) => product.tax)
  products!: Product[];

  // link to groups
  @ManyToMany(() => TaxGroup, (group) => group.taxRates)
  groups!: TaxGroup[];

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
