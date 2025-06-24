import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum FeatureType {
  MODULE = 'module',
  LIMIT = 'limit',
  INTEGRATION = 'integration',
  ADVANCED = 'advanced',
}

@Entity()
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  key!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-enum', enum: FeatureType })
  type!: FeatureType;

  @Column({ type: 'json', nullable: true })
  limits?: Record<string, number>;

  @Column({ type: 'simple-array', nullable: true })
  availableInPlans?: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

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