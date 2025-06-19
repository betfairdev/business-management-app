import { BaseService } from './BaseService';
import { IncomeType } from '../entities/IncomeType';
import { CreateIncomeTypeDto } from '../dtos/CreateIncomeTypeDto';
import { UpdateIncomeTypeDto } from '../dtos/UpdateIncomeTypeDto';

export class IncomeTypeService extends BaseService<IncomeType, CreateIncomeTypeDto, UpdateIncomeTypeDto> {
  constructor() {
    super(IncomeType, CreateIncomeTypeDto, UpdateIncomeTypeDto, ['name', 'description']);
  }

  async findById(id: number): Promise<IncomeType | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['incomes'],
    });
  }

  async getIncomeTypeUsage(id: number): Promise<any> {
    const incomeType = await this.repository.findOne({
      where: { id } as any,
      relations: ['incomes'],
    });

    if (!incomeType) {
      throw new Error('Income type not found');
    }

    const totalAmount = incomeType.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;

    return {
      incomeType,
      incomeCount: incomeType.incomes?.length || 0,
      totalAmount,
      averageAmount: incomeType.incomes?.length ? totalAmount / incomeType.incomes.length : 0,
    };
  }

  async getIncomeTypeReport(startDate?: string, endDate?: string): Promise<any[]> {
    let qb = this.repository.createQueryBuilder('incomeType')
      .leftJoinAndSelect('incomeType.expenses', 'income');

    if (startDate && endDate) {
      qb = qb.where('income.date BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    const incomeTypes = await qb.getMany();

    return incomeTypes.map(type => ({
      id: type.id,
      name: type.name,
      description: type.description,
      incomeCount: type.incomes?.length || 0,
      totalAmount: type.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0,
    }));
  }
}