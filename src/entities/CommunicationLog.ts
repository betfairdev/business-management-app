import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum CommunicationType {
  EMAIL = 'Email',
  PHONE = 'Phone',
  MEETING = 'Meeting',
  SMS = 'SMS',
  WHATSAPP = 'WhatsApp',
  NOTE = 'Note',
}

export enum CommunicationDirection {
  INBOUND = 'Inbound',
  OUTBOUND = 'Outbound',
}

@Entity()
export class CommunicationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', nullable: true })
  customerId?: string;

  @Column({ type: 'varchar', nullable: true })
  leadId?: string;

  @Column({ type: 'simple-enum', enum: CommunicationType })
  type!: CommunicationType;

  @Column({ type: 'simple-enum', enum: CommunicationDirection })
  direction!: CommunicationDirection;

  @Column({ type: 'varchar' })
  subject!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'time' })
  time!: string;

  @Column({ type: 'varchar', nullable: true })
  contactPerson?: string;

  @Column({ type: 'text', nullable: true })
  outcome?: string;

  @Column({ type: 'date', nullable: true })
  followUpDate?: string;

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