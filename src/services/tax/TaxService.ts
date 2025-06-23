import { BaseService } from '../core/BaseService';
import { TaxRate } from '../../entities/TaxRate';
import { TaxGroup } from '../../entities/TaxGroup';
import { CreateTaxRateDto } from '../../dtos/CreateTaxRateDto';
import { UpdateTaxRateDto } from '../../dtos/UpdateTaxRateDto';
import { CreateTaxGroupDto } from '../../dtos/CreateTaxGroupDto';
import { UpdateTaxGroupDto } from '../../dtos/UpdateTaxGroupDto';
import { getDataSource } from '../../config/database';

export interface TaxCalculation {
  subtotal: number;
  taxBreakdown: Array<{
    taxRate: TaxRate;
    taxableAmount: number;
    taxAmount: number;
  }>;
  totalTax: number;
  total: number;
}

export interface TaxReport {
  period: string;
  totalTaxCollected: number;
  taxByRate: Array<{
    taxRate: TaxRate;
    taxableAmount: number;
    taxAmount: number;
  }>;
  salesCount: number;
  averageTaxRate: number;
}

export class TaxService {
  private dataSource = getDataSource();

  async createTaxRate(createDto: CreateTaxRateDto): Promise<TaxRate> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    
    const taxRate = taxRateRepo.create(createDto);
    return await taxRateRepo.save(taxRate);
  }

  async updateTaxRate(id: string, updateDto: UpdateTaxRateDto): Promise<TaxRate> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    
    await taxRateRepo.update(id, updateDto);
    return await taxRateRepo.findOne({ where: { id } }) as TaxRate;
  }

  async createTaxGroup(createDto: CreateTaxGroupDto): Promise<TaxGroup> {
    const taxGroupRepo = this.dataSource.getRepository(TaxGroup);
    const taxRateRepo = this.dataSource.getRepository(TaxRate);

    const taxRates = await taxRateRepo.findByIds(createDto.taxRateIds);

    const taxGroup = taxGroupRepo.create({
      name: createDto.name,
      description: createDto.description,
      taxRates,
    });

    return await taxGroupRepo.save(taxGroup);
  }

  async updateTaxGroup(id: string, updateDto: UpdateTaxGroupDto): Promise<TaxGroup> {
    const taxGroupRepo = this.dataSource.getRepository(TaxGroup);
    const taxRateRepo = this.dataSource.getRepository(TaxRate);

    const taxGroup = await taxGroupRepo.findOne({
      where: { id },
      relations: ['taxRates'],
    });

    if (!taxGroup) {
      throw new Error('Tax group not found');
    }

    if (updateDto.name) taxGroup.name = updateDto.name;
    if (updateDto.description) taxGroup.description = updateDto.description;

    if (updateDto.taxRateIds) {
      const taxRates = await taxRateRepo.findByIds(updateDto.taxRateIds);
      taxGroup.taxRates = taxRates;
    }

    return await taxGroupRepo.save(taxGroup);
  }

  async calculateTax(amount: number, taxRateId: string): Promise<TaxCalculation> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    
    const taxRate = await taxRateRepo.findOne({ where: { id: taxRateId } });
    if (!taxRate) {
      throw new Error('Tax rate not found');
    }

    const taxAmount = (amount * taxRate.rate) / 100;

    return {
      subtotal: amount,
      taxBreakdown: [{
        taxRate,
        taxableAmount: amount,
        taxAmount,
      }],
      totalTax: taxAmount,
      total: amount + taxAmount,
    };
  }

  async calculateGroupTax(amount: number, taxGroupId: string): Promise<TaxCalculation> {
    const taxGroupRepo = this.dataSource.getRepository(TaxGroup);
    
    const taxGroup = await taxGroupRepo.findOne({
      where: { id: taxGroupId },
      relations: ['taxRates'],
    });

    if (!taxGroup) {
      throw new Error('Tax group not found');
    }

    const taxBreakdown = taxGroup.taxRates.map(taxRate => {
      const taxAmount = (amount * taxRate.rate) / 100;
      return {
        taxRate,
        taxableAmount: amount,
        taxAmount,
      };
    });

    const totalTax = taxBreakdown.reduce((sum, item) => sum + item.taxAmount, 0);

    return {
      subtotal: amount,
      taxBreakdown,
      totalTax,
      total: amount + totalTax,
    };
  }

  async calculateCompoundTax(
    amount: number,
    taxRateIds: string[],
    isCompound: boolean = false
  ): Promise<TaxCalculation> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    
    const taxRates = await taxRateRepo.findByIds(taxRateIds);
    const taxBreakdown: Array<{
      taxRate: TaxRate;
      taxableAmount: number;
      taxAmount: number;
    }> = [];

    let runningTotal = amount;

    for (const taxRate of taxRates) {
      const taxableAmount = isCompound ? runningTotal : amount;
      const taxAmount = (taxableAmount * taxRate.rate) / 100;
      
      taxBreakdown.push({
        taxRate,
        taxableAmount,
        taxAmount,
      });

      if (isCompound) {
        runningTotal += taxAmount;
      }
    }

    const totalTax = taxBreakdown.reduce((sum, item) => sum + item.taxAmount, 0);

    return {
      subtotal: amount,
      taxBreakdown,
      totalTax,
      total: amount + totalTax,
    };
  }

  async getTaxReport(startDate: string, endDate: string): Promise<TaxReport> {
    const saleRepo = this.dataSource.getRepository('Sale');
    
    // This would need to be implemented based on how tax data is stored in sales
    const sales = await saleRepo.find({
      where: {
        // saleDate: Between(startDate, endDate)
      },
      relations: ['items', 'items.product', 'items.product.tax'],
    });

    const totalTaxCollected = sales.reduce((sum: number, sale: any) => sum + sale.taxAmount, 0);
    const salesCount = sales.length;

    // Calculate tax by rate
    const taxByRateMap = new Map<string, { taxRate: TaxRate; taxableAmount: number; taxAmount: number }>();

    sales.forEach((sale: any) => {
      sale.items?.forEach((item: any) => {
        if (item.product?.tax) {
          const taxRate = item.product.tax;
          const taxableAmount = item.totalPrice;
          const taxAmount = (taxableAmount * taxRate.rate) / 100;

          const existing = taxByRateMap.get(taxRate.id);
          if (existing) {
            existing.taxableAmount += taxableAmount;
            existing.taxAmount += taxAmount;
          } else {
            taxByRateMap.set(taxRate.id, {
              taxRate,
              taxableAmount,
              taxAmount,
            });
          }
        }
      });
    });

    const taxByRate = Array.from(taxByRateMap.values());
    const totalTaxableAmount = taxByRate.reduce((sum, item) => sum + item.taxableAmount, 0);
    const averageTaxRate = totalTaxableAmount > 0 ? (totalTaxCollected / totalTaxableAmount) * 100 : 0;

    return {
      period: `${startDate} to ${endDate}`,
      totalTaxCollected,
      taxByRate,
      salesCount,
      averageTaxRate,
    };
  }

  async getAllTaxRates(): Promise<TaxRate[]> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    return await taxRateRepo.find({ order: { name: 'ASC' } });
  }

  async getAllTaxGroups(): Promise<TaxGroup[]> {
    const taxGroupRepo = this.dataSource.getRepository(TaxGroup);
    return await taxGroupRepo.find({ 
      relations: ['taxRates'],
      order: { name: 'ASC' } 
    });
  }

  async getTaxRateById(id: string): Promise<TaxRate | null> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    return await taxRateRepo.findOne({
      where: { id },
      relations: ['products', 'groups'],
    });
  }

  async getTaxGroupById(id: string): Promise<TaxGroup | null> {
    const taxGroupRepo = this.dataSource.getRepository(TaxGroup);
    return await taxGroupRepo.findOne({
      where: { id },
      relations: ['taxRates'],
    });
  }

  async deleteTaxRate(id: string): Promise<void> {
    const taxRateRepo = this.dataSource.getRepository(TaxRate);
    await taxRateRepo.softDelete(id);
  }

  async deleteTaxGroup(id: string): Promise<void> {
    const taxGroupRepo = this.dataSource.getRepository(TaxGroup);
    await taxGroupRepo.softDelete(id);
  }
}