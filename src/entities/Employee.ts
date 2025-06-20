e// src/entities/Employee.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { Department } from './Department';
import { Store } from './Store';
import { Attendance } from './Attendance';
import { LeaveRequest } from './LeaveRequest';

@Entity()
export class Employee {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) name!: string;
  @Column({ type: 'varchar', nullable: true }) email?: string;      // optional
  @Column({ type: 'varchar', nullable: true }) phone?: string;      // optional
  @Column({ type: 'varchar', nullable: true }) whatsapp?: string;   // NEW
  @Column({ nullable: true, type: 'text' }) address?: string; // optional

  @ManyToOne(() => Department, (d) => d.employees, { nullable: true }) department?: Department;
  @ManyToOne(() => Store, (s) => s.employees, { nullable: true }) store?: Store;

  @OneToMany(() => Attendance, (a) => a.employee) attendances!: Attendance[];
  @OneToMany(() => LeaveRequest, (l) => l.employee) leaveRequests!: LeaveRequest[];
  // removed expenses relation per request

  @Column({ type: 'date', nullable: true }) hireDate?: string;
  @Column('decimal', { precision: 15, scale: 2, nullable: true }) salary?: number;

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
