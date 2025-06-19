// src/entities/ExpenseType.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    DeleteDateColumn,
} from 'typeorm';
import { Expense } from './Expense';

@Entity()
export class ExpenseType {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'varchar', unique: true })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @OneToMany(() => Expense, (expense) => expense.expenseType)
    expenses!: Expense[];

    @Column({ type: 'int', nullable: true }) createdBy?: number;
    @Column({ type: 'int', nullable: true }) updatedBy?: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;
}
