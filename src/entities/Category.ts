// src/entities/Category.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { SubCategory } from './SubCategory';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', unique: true }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;

  @OneToMany(() => SubCategory, (s) => s.category) subcategories!: SubCategory[];

  @Column({ type: 'simple-enum', enum: ['Active', 'Inactive'], default: 'Active' })
  status!: 'Active' | 'Inactive';

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
