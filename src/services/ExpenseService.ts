import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Expense } from '../entities/Expense';
import { CreateExpenseDto } from '../dtos/CreateExpenseDto';
import { UpdateExpenseDto } from '../dtos/UpdateExpenseDto';
import { type FindManyOptions } from 'typeorm';

export class ExpenseService extends BaseService<Expense, CreateExpenseDto, UpdateExpenseDto> {
  constructor() {
    super(Expense, CreateExpenseDto, UpdateExpenseDto, ['description', 'expenseType.name']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Expense>
  ): Promise<PaginatedResult<Expense>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.expenseType', 'expenseType')
      .leftJoinAndSelect('expense.paymentMethod', 'paymentMethod');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`expense.${field} ILIKE :query`);
        }
      });
      if (conditions.length > 0) {
        qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
      }
    }

    if (options?.sortBy) {
      if (options.sortBy.includes('.')) {
        const [alias, col] = options.sortBy.split('.');
        qb = qb.orderBy(`${alias}.${col}`, options.sortOrder || 'ASC');
      } else {
        qb = qb.orderBy(`expense.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('expense.createdAt', 'DESC');
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Expense | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['expenseType', 'paymentMethod'],
    });
  }

  async create(createDto: CreateExpenseDto): Promise<Expense> {
    const expenseData: any = {
      ...createDto,
      expenseType: { id: createDto.expenseType },
      paymentMethod: { id: createDto.paymentMethod },
    };

    const expense = this.repository.create(expenseData);
    return await this.repository.save(expense);
  }

  async update(id: string, updateDto: UpdateExpenseDto): Promise<Expense> {
    const updateData: any = {
      ...updateDto,
      expenseType: updateDto.expenseType ? { id: updateDto.expenseType } : undefined,
      paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(Number(id)) as Expense;
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    return await this.repository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.expenseType', 'expenseType')
      .leftJoinAndSelect('expense.paymentMethod', 'paymentMethod')
      .where('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async getExpensesByType(expenseTypeId: number): Promise<Expense[]> {
    return await this.repository.find({
      where: { expenseType: { id: expenseTypeId } },
      relations: ['expenseType', 'paymentMethod'],
    });
  }

  async getTotalExpenses(startDate?: string, endDate?: string): Promise<number> {
    let qb = this.repository.createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total');

    if (startDate && endDate) {
      qb = qb.where('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await qb.getRawOne();
    return Number(result.total) || 0;
  }

  async getExpenseReport(startDate: string, endDate: string): Promise<any> {
    const expenses = await this.getExpensesByDateRange(startDate, endDate);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expensesByType = expenses.reduce((acc, expense) => {
      const typeName = expense.expenseType.name;
      acc[typeName] = (acc[typeName] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses,
      expenseCount: expenses.length,
      expensesByType,
      averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
      expenses,
    };
  }
}