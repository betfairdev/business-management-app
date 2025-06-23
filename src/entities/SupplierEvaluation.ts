import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Supplier } from './Supplier';
import { User } from './User';

@Entity()
export class SupplierEvaluation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Supplier, { nullable: false })
  supplier!: Supplier;

  @ManyToOne(() => User, { nullable: false })
  evaluator!: User;

  @Column({ type: 'date' })
  evaluationDate!: string;

  @Column({ type: 'int' })
  qualityScore!: number; // 1-10

  @Column({ type: 'int' })
  deliveryScore!: number; // 1-10

  @Column({ type: 'int' })
  serviceScore!: number; // 1-10

  @Column({ type: 'int' })
  priceScore!: number; // 1-10

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  onTimeDeliveryRate!: number; // Percentage

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  overallRating!: number; // Average of all scores

  @Column({ type: 'text', nullable: true })
  comments?: string;

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