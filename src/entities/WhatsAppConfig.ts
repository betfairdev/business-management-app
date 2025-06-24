import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum WhatsAppProvider {
  WHATSAPP_BUSINESS = 'whatsapp_business',
  TWILIO = 'twilio',
  MESSAGEBIRD = 'messagebird',
  GUPSHUP = 'gupshup',
  WATI = 'wati',
}

@Entity()
export class WhatsAppConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'simple-enum', enum: WhatsAppProvider })
  provider!: WhatsAppProvider;

  @Column({ type: 'varchar' })
  accessToken!: string;

  @Column({ type: 'varchar' })
  phoneNumberId!: string;

  @Column({ type: 'varchar' })
  businessAccountId!: string;

  @Column({ type: 'varchar', nullable: true })
  webhookUrl?: string;

  @Column({ type: 'varchar', nullable: true })
  verifyToken?: string;

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