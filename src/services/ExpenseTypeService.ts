import { BaseService } from './BaseService';
import { ExpenseType } from '../entities/ExpenseType';
import { CreateExpenseTypeDto } from '../dtos/CreateExpenseTypeDto';
import { UpdateExpenseTypeDto } from '../dtos/UpdateExpenseTypeDto';

export class ExpenseTypeService extends BaseService<ExpenseType, CreateExpenseTypeDto, UpdateExpenseTypeDto> {
  constructor() {
    super(ExpenseType, CreateExpenseTypeDto, UpdateExpenseTypeDto, ['name', 'description']);
  }

  async findById(id: number): Promise<ExpenseType | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['expenses'],
    });
  }

  async getExpenseTypeUsage(id: number): Promise<any> {
    const expenseType = await this.repository.findOne({
      where: { id } as any,
      relations: ['expenses'],
    });

    if (!expenseType) {
      throw new Error('Expense type not found');
    }

    const totalAmount = expenseType.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

    return {
      expenseType,
      expenseCount: expenseType.expenses?.length || 0,
      totalAmount,
      averageAmount: expenseType.expenses?.length ? totalAmount / expenseType.expenses.length : 0,
    };
  }

  async getExpenseTypeReport(startDate?: string, endDate?: string): Promise<any[]> {
    let qb = this.repository.createQueryBuilder('expenseType')
      .leftJoinAndSelect('expenseType.expenses', 'expense');

    if (startDate && endDate) {
      qb = qb.where('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const expenseTypes = await qb.getMany();

    return expenseTypes.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      expenseCount: type.expenses?.length || 0,
      totalAmount: type.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0,
    }));
  }
}