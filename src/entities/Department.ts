// src/entities/Department.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Employee } from './Employee';

@Entity()
export class Department {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'varchar', nullable: true }) managerId?: string;
  @OneToMany(() => Employee, (e) => e.department) employees!: Employee[];

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
