import { BaseService } from './BaseService';
import { Batch } from '../entities/Batch';
import { CreateBatchDto } from '../dtos/CreateBatchDto';
import { UpdateBatchDto } from '../dtos/UpdateBatchDto';

interface BatchReport {
  totalBatches: number;
  expiringBatches: number;
  expiredBatches: number;
  expiringBatchesList: Batch[];
  expiredBatchesList: Batch[];
}

export class BatchService extends BaseService<Batch, CreateBatchDto, UpdateBatchDto> {
  constructor() {
    super(Batch, CreateBatchDto, UpdateBatchDto, ['batchNumber']);
  }

  async findById(id: string): Promise<Batch | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['products', 'stockEntries'],
    });
  }

  async getBatchesByProduct(productId: string): Promise<Batch[]> {
    return await this.repository
      .createQueryBuilder('batch')
      .leftJoin('batch.products', 'product')
      .where('product.id = :productId', { productId })
      .getMany();
  }

  async getExpiringBatches(days: number = 30): Promise<Batch[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await this.repository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.products', 'products')
      .leftJoinAndSelect('batch.stockEntries', 'stockEntries')
      .where('batch.expiryDate <= :futureDate', { futureDate })
      .andWhere('batch.expiryDate IS NOT NULL')
      .orderBy('batch.expiryDate', 'ASC')
      .getMany();
  }

  async getExpiredBatches(): Promise<Batch[]> {
    const today = new Date();

    return await this.repository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.products', 'products')
      .leftJoinAndSelect('batch.stockEntries', 'stockEntries')
      .where('batch.expiryDate < :today', { today })
      .andWhere('batch.expiryDate IS NOT NULL')
      .orderBy('batch.expiryDate', 'ASC')
      .getMany();
  }

  async getBatchReport(): Promise<BatchReport> {
    const totalBatches = await this.repository.count();
    const expiringBatches = await this.getExpiringBatches(30);
    const expiredBatches = await this.getExpiredBatches();

    return {
      totalBatches,
      expiringBatches: expiringBatches.length,
      expiredBatches: expiredBatches.length,
      expiringBatchesList: expiringBatches,
      expiredBatchesList: expiredBatches,
    };
  }
}


