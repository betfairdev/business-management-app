import { BaseService } from './BaseService';
import { TaxGroup } from '../entities/TaxGroup';
import { CreateTaxGroupDto } from '../dtos/CreateTaxGroupDto';
import { UpdateTaxGroupDto } from '../dtos/UpdateTaxGroupDto';

export class TaxGroupService extends BaseService<TaxGroup, CreateTaxGroupDto, UpdateTaxGroupDto> {
  constructor() {
    super(TaxGroup, CreateTaxGroupDto, UpdateTaxGroupDto, ['name', 'description']);
  }

  async findById(id: string): Promise<TaxGroup | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['taxRates'],
    });
  }

  async create(createDto: CreateTaxGroupDto): Promise<TaxGroup> {
    const taxGroupData: any = {
      name: createDto.name,
      description: createDto.description,
      taxRates: createDto.taxRateIds.map(id => ({ id })),
    };

    const taxGroup = this.repository.create(taxGroupData);
    return await this.repository.save(taxGroup);
  }

  async update(id: string, updateDto: UpdateTaxGroupDto): Promise<TaxGroup> {
    const updateData: any = {
      name: updateDto.name,
      description: updateDto.description,
      taxRates: updateDto.taxRateIds ? updateDto.taxRateIds.map(id => ({ id })) : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as TaxGroup;
  }

  async calculateGroupTax(amount: number, groupId: string): Promise<number> {
    const group = await this.findById(groupId);
    if (!group) {
      throw new Error('Tax group not found');
    }

    let totalTax = 0;
    for (const taxRate of group.taxRates) {
      totalTax += (amount * taxRate.rate) / 100;
    }
    return totalTax;
  }
}