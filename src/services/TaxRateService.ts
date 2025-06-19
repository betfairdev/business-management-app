import { BaseService } from './BaseService';
import { TaxRate } from '../entities/TaxRate';
import { CreateTaxRateDto } from '../dtos/CreateTaxRateDto';
import { UpdateTaxRateDto } from '../dtos/UpdateTaxRateDto';

export class TaxRateService extends BaseService<TaxRate, CreateTaxRateDto, UpdateTaxRateDto> {
  constructor() {
    super(TaxRate, CreateTaxRateDto, UpdateTaxRateDto, ['name', 'description']);
  }

  async findById(id: string): Promise<TaxRate | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['products', 'groups'],
    });
  }

  async getActiveTaxRates(): Promise<TaxRate[]> {
    return await this.repository.find({
      order: { name: 'ASC' },
    });
  }

  async getTaxRatesByGroup(groupId: string): Promise<TaxRate[]> {
    return await this.repository
      .createQueryBuilder('taxRate')
      .leftJoin('taxRate.groups', 'group')
      .where('group.id = :groupId', { groupId })
      .getMany();
  }

  async calculateTax(amount: number, taxRateId: string): Promise<number> {
    const taxRate = await this.findById(taxRateId);
    if (!taxRate) {
      throw new Error('Tax rate not found');
    }
    return (amount * taxRate.rate) / 100;
  }
}