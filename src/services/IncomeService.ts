import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Income } from '../entities/Income';
import { CreateIncomeDto } from '../dtos/CreateIncomeDto';
import { UpdateIncomeDto } from '../dtos/UpdateIncomeDto';
import { type FindManyOptions } from 'typeorm';

export class IncomeService extends BaseService<Income, CreateIncomeDto, UpdateIncomeDto> {
  constructor() {
    super(Income, CreateIncomeDto, UpdateIncomeDto, ['description', 'incomeType.name']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Income>
  ): Promise<PaginatedResult<Income>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('income')
      .leftJoinAndSelect('income.incomeType', 'incomeType')
      .leftJoinAndSelect('income.paymentMethod', 'paymentMethod');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`income.${field} ILIKE :query`);
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
        qb = qb.orderBy(`income.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('income.createdAt', 'DESC');
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

  async findById(id: number): Promise<Income | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['incomeType', 'paymentMethod'],
    });
  }

  async create(createDto: CreateIncomeDto): Promise<Income> {
    const incomeData: any = {
      ...createDto,
      incomeType: { id: createDto.incomeType },
      paymentMethod: { id: createDto.paymentMethod },
    };

    const income = this.repository.create(incomeData);
    return await this.repository.save(income);
  }

  async update(id: string, updateDto: UpdateIncomeDto): Promise<Income> {
    const updateData: any = {
      ...updateDto,
      incomeType: updateDto.incomeType ? { id: updateDto.incomeType } : undefined,
      paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(Number(id)) as Income;
  }

  async getIncomesByDateRange(startDate: string, endDate: string): Promise<Income[]> {
    return await this.repository
      .createQueryBuilder('income')
      .leftJoinAndSelect('income.incomeType', 'incomeType')
      .leftJoinAndSelect('income.paymentMethod', 'paymentMethod')
      .where('income.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async getIncomesByType(incomeTypeId: number): Promise<Income[]> {
    return await this.repository.find({
      where: { incomeType: { id: incomeTypeId } },
      relations: ['incomeType', 'paymentMethod'],
    });
  }

  async getTotalIncome(startDate?: string, endDate?: string): Promise<number> {
    let qb = this.repository.createQueryBuilder('income')
      .select('SUM(income.amount)', 'total');

    if (startDate && endDate) {
      qb = qb.where('income.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const result = await qb.getRawOne();
    return Number(result.total) || 0;
  }

  async getIncomeReport(startDate: string, endDate: string): Promise<any> {
    const incomes = await this.getIncomesByDateRange(startDate, endDate);
    
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const incomesByType = incomes.reduce((acc, income) => {
      const typeName = income.incomeType.name;
      acc[typeName] = (acc[typeName] || 0) + income.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      incomeCount: incomes.length,
      incomesByType,
      averageIncome: incomes.length > 0 ? totalIncome / incomes.length : 0,
      incomes,
    };
  }
}