import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { Lead } from './Lead';

export enum OpportunityStage {
  PROSPECTING = 'Prospecting',
  QUALIFICATION = 'Qualification',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost',
}

@Entity()
export class Opportunity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Customer, { nullable: true })
  customer?: Customer;

  @ManyToOne(() => Lead, { nullable: true })
  lead?: Lead;

  @Column({ type: 'simple-enum', enum: OpportunityStage, default: OpportunityStage.PROSPECTING })
  stage!: OpportunityStage;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  value!: number;

  @Column({ type: 'int', default: 0 })
  probability!: number; // 0-100

  @Column({ type: 'date', nullable: true })
  expectedCloseDate?: string;

  @Column({ type: 'date', nullable: true })
  actualCloseDate?: string;

  @Column({ type: 'varchar', nullable: true })
  source?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

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