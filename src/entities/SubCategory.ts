// src/entities/SubCategory.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Category } from './Category';
import { Product } from './Product';

@Entity()
export class SubCategory {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true })    name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;

  @ManyToOne(() => Category, (c) => c.subcategories, { nullable: false })
  category!: Category;

  @OneToMany(() => Product, (p) => p.subCategory) products!: Product[];

  @Column({ type: 'simple-enum', enum: ['Active','Inactive'], default: 'Active' })
  status!: 'Active'|'Inactive';
  
  @Column({ nullable: true }) createdBy?: number;
  @Column({ nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
