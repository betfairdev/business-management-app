import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Stock } from '../entities/Stock';
import { CreateStockDto } from '../dtos/CreateStockDto';
import { UpdateStockDto } from '../dtos/UpdateStockDto';
import { type FindManyOptions } from 'typeorm';

export class StockService extends BaseService<Stock, CreateStockDto, UpdateStockDto> {
  constructor() {
    super(Stock, CreateStockDto, UpdateStockDto, ['warehouse', 'product.name']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Stock>
  ): Promise<PaginatedResult<Stock>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.batch', 'batch')
      .leftJoinAndSelect('stock.store', 'store')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`stock.${field} ILIKE :query`);
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
        qb = qb.orderBy(`stock.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('stock.createdAt', 'DESC');
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

  async findById(id: string): Promise<Stock | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['product', 'batch', 'store', 'product.brand', 'product.category'],
    });
  }

  async create(createDto: CreateStockDto): Promise<Stock> {
    const stockData: any = {
      ...createDto,
      product: { id: createDto.product },
      store: createDto.store ? { id: createDto.store } : undefined,
    };

    const stock = this.repository.create(stockData);
    return await this.repository.save(stock);
  }

  async update(id: string, updateDto: UpdateStockDto): Promise<Stock> {
    const updateData: any = {
      ...updateDto,
      product: updateDto.product ? { id: updateDto.product } : undefined,
      store: updateDto.store ? { id: updateDto.store } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as Stock;
  }

  async getLowStockItems(threshold: number = 10): Promise<Stock[]> {
    return await this.repository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product')
      .leftJoinAndSelect('stock.store', 'store')
      .where('stock.quantity <= :threshold', { threshold })
      .getMany();
  }

  async getStockByProduct(productId: string): Promise<Stock[]> {
    return await this.repository.find({
      where: { product: { id: productId } },
      relations: ['product', 'batch', 'store'],
    });
  }

  async getStockByStore(storeId: string): Promise<Stock[]> {
    return await this.repository.find({
      where: { store: { id: storeId } },
      relations: ['product', 'batch', 'store'],
    });
  }

  async getTotalStockValue(): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('stock')
      .select('SUM(stock.quantity * stock.unitCost)', 'totalValue')
      .getRawOne();

    return Number(result.totalValue) || 0;
  }

  async getStockMovementReport(startDate: string, endDate: string): Promise<any> {
    // This would require tracking stock movements in a separate table
    // For now, return basic stock information
    const stocks = await this.repository.find({
      relations: ['product', 'store'],
    });

    return {
      totalItems: stocks.length,
      totalQuantity: stocks.reduce((sum, stock) => sum + stock.quantity, 0),
      totalValue: stocks.reduce((sum, stock) => sum + (stock.quantity * stock.unitCost), 0),
      lowStockItems: stocks.filter(stock => stock.quantity <= 10).length,
    };
  }
}