// src/entities/Badge.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

@Entity()
export class Badge {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: "varchar", unique: true }) name!: string;
  @Column({ type: "text", nullable: true }) description?: string;
  @Column({ type: "int", nullable: true }) createdBy?: number;
  @Column({ type: "int", nullable: true }) updatedBy?: number;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  @DeleteDateColumn() deletedAt?: Date;
}

