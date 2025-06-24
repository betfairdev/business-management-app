import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum EmailProvider {
  SMTP = 'smtp',
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  SENDGRID = 'sendgrid',
  MAILGUN = 'mailgun',
  SES = 'ses',
}

@Entity()
export class EmailConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'simple-enum', enum: EmailProvider })
  provider!: EmailProvider;

  @Column({ type: 'varchar' })
  host!: string;

  @Column({ type: 'int' })
  port!: number;

  @Column({ type: 'boolean', default: false })
  secure!: boolean;

  @Column({ type: 'varchar' })
  username!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar' })
  fromEmail!: string;

  @Column({ type: 'varchar' })
  fromName!: string;

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'json', nullable: true })
  additionalSettings?: Record<string, any>;

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