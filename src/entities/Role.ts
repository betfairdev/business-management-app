// src/entities/Role.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './User';
import { Permission } from './Permission.ts';

@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', unique: true }) name!: string;
  @Column({ type: 'text', nullable: true }) description?: string;
  @Column({ type: 'boolean', default: false }) isSystemRole!: boolean;

  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  // Many-to-many to Permission, with join table
  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: true })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'roleId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions!: Permission[];

  @Column({ type: 'int', nullable: true }) createdBy?: number;
  @Column({ type: 'int', nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}
