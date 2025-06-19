// src/entities/IncomeType.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    DeleteDateColumn,
} from 'typeorm';
import { Income } from './Income';

@Entity()
export class IncomeType {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @OneToMany(() => Income, (income) => income.incomeType)
    incomes!: Income[];

    @Column({ type: 'int', nullable: true }) createdBy?: number;
    @Column({ type: 'int', nullable: true }) updatedBy?: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
