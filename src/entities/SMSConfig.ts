import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum SMSProvider {
  TWILIO = 'twilio',
  NEXMO = 'nexmo',
  AWS_SNS = 'aws_sns',
  TEXTLOCAL = 'textlocal',
  MSG91 = 'msg91',
  CLICKSEND = 'clicksend',
}

@Entity()
export class SMSConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'simple-enum', enum: SMSProvider })
  provider!: SMSProvider;

  @Column({ type: 'varchar' })
  apiKey!: string;

  @Column({ type: 'varchar', nullable: true })
  apiSecret?: string;

  @Column({ type: 'varchar', nullable: true })
  senderId?: string;

  @Column({ type: 'varchar', nullable: true })
  accountSid?: string;

  @Column({ type: 'varchar', nullable: true })
  authToken?: string;

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