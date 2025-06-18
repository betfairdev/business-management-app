// src/entities/Permission.ts

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToMany,
} from 'typeorm';
import { Role } from './Role';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: "varchar", length: 100 })
  module!: string;
  @Column({ type: "varchar", length: 100 })
  action!: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles!: Role[];

  @Column({ type: 'boolean', default: true }) isAllowed!: boolean;

  @Column({ nullable: true }) createdBy?: number;
  @Column({ nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
