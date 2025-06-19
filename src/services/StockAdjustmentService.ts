import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { StockAdjustment } from '../entities/StockAdjustment';
import { CreateStockAdjustmentDto } from '../dtos/CreateStockAdjustmentDto';
import { UpdateStockAdjustmentDto } from '../dtos/UpdateStockAdjustmentDto';
import { Stock } from '../entities/Stock';
import { getDataSource } from '../config/database';
import { type FindManyOptions } from 'typeorm';

export class StockAdjustmentService extends BaseService<StockAdjustment, CreateStockAdjustmentDto, UpdateStockAdjustmentDto> {
  constructor() {
    super(StockAdjustment, CreateStockAdjustmentDto, UpdateStockAdjustmentDto, ['product.name', 'reason']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<StockAdjustment>
  ): Promise<PaginatedResult<StockAdjustment>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('stockAdjustment')
      .leftJoinAndSelect('stockAdjustment.product', 'product')
      .leftJoinAndSelect('stockAdjustment.store', 'store');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`stockAdjustment.${field} ILIKE :query`);
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
        qb = qb.orderBy(`stockAdjustment.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('stockAdjustment.createdAt', 'DESC');
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

  async findById(id: string): Promise<StockAdjustment | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['product', 'store'],
    });
  }

  async create(createDto: CreateStockAdjustmentDto): Promise<StockAdjustment> {
    const dataSource = getDataSource();
    
    return await dataSource.transaction(async (manager) => {
      const adjustmentRepo = manager.getRepository(StockAdjustment);
      const stockRepo = manager.getRepository(Stock);

      const adjustmentData: any = {
        ...createDto,
        product: { id: createDto.product },
        store: createDto.store ? { id: createDto.store } : undefined,
      };

      const adjustment = adjustmentRepo.create(adjustmentData);
      const savedAdjustment = await adjustmentRepo.save(adjustment);

      // Apply stock adjustment
      if (createDto.status === 'Done') {
        const stockQuery: any = { product: { id: createDto.product } };
        if (createDto.store) stockQuery.store = { id: createDto.store };

        const stock = await stockRepo.findOne({ where: stockQuery });
        
        if (stock) {
          if (createDto.adjustmentType === 'Increase') {
            stock.quantity += createDto.quantityChange;
          } else {
            stock.quantity = Math.max(0, stock.quantity - createDto.quantityChange);
          }
          await stockRepo.save(stock);
        }
      }

      return await adjustmentRepo.findOne({
        where: { id: savedAdjustment.id },
        relations: ['product', 'store'],
      }) as StockAdjustment;
    });
  }

  async update(id: string, updateDto: UpdateStockAdjustmentDto): Promise<StockAdjustment> {
    const updateData: any = {
      ...updateDto,
      product: updateDto.product ? { id: updateDto.product } : undefined,
      store: updateDto.store ? { id: updateDto.store } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as StockAdjustment;
  }

  async getAdjustmentsByProduct(productId: string): Promise<StockAdjustment[]> {
    return await this.repository.find({
      where: { product: { id: productId } },
      relations: ['product', 'store'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAdjustmentReport(startDate: string, endDate: string): Promise<any> {
    const adjustments = await this.repository
      .createQueryBuilder('adjustment')
      .leftJoinAndSelect('adjustment.product', 'product')
      .leftJoinAndSelect('adjustment.store', 'store')
      .where('adjustment.createdAt BETWEEN :startDate AND :endDate', { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate) 
      })
      .getMany();

    const totalAdjustments = adjustments.length;
    const increases = adjustments.filter(adj => adj.adjustmentType === 'Increase');
    const decreases = adjustments.filter(adj => adj.adjustmentType === 'Decrease');

    return {
      totalAdjustments,
      increases: increases.length,
      decreases: decreases.length,
      totalIncreaseQuantity: increases.reduce((sum, adj) => sum + adj.quantityChange, 0),
      totalDecreaseQuantity: decreases.reduce((sum, adj) => sum + adj.quantityChange, 0),
      adjustments,
    };
  }
}