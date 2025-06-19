import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { StockTransfer } from '../entities/StockTransfer';
import { CreateStockTransferDto } from '../dtos/CreateStockTransferDto';
import { UpdateStockTransferDto } from '../dtos/UpdateStockTransferDto';
import { Stock } from '../entities/Stock';
import { getDataSource } from '../config/database';
import { type FindManyOptions } from 'typeorm';

export class StockTransferService extends BaseService<StockTransfer, CreateStockTransferDto, UpdateStockTransferDto> {
  constructor() {
    super(StockTransfer, CreateStockTransferDto, UpdateStockTransferDto, ['product.name', 'fromStore.name', 'toStore.name']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<StockTransfer>
  ): Promise<PaginatedResult<StockTransfer>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('stockTransfer')
      .leftJoinAndSelect('stockTransfer.product', 'product')
      .leftJoinAndSelect('stockTransfer.fromStore', 'fromStore')
      .leftJoinAndSelect('stockTransfer.toStore', 'toStore');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`stockTransfer.${field} ILIKE :query`);
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
        qb = qb.orderBy(`stockTransfer.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('stockTransfer.createdAt', 'DESC');
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

  async findById(id: string): Promise<StockTransfer | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['product', 'fromStore', 'toStore'],
    });
  }

  async create(createDto: CreateStockTransferDto): Promise<StockTransfer> {
    const dataSource = getDataSource();
    
    return await dataSource.transaction(async (manager) => {
      const transferRepo = manager.getRepository(StockTransfer);
      const stockRepo = manager.getRepository(Stock);

      const transferData: any = {
        ...createDto,
        product: { id: createDto.product },
        fromStore: { id: createDto.fromStore },
        toStore: { id: createDto.toStore },
      };

      const transfer = transferRepo.create(transferData);
      const savedTransfer = await transferRepo.save(transfer);

      // Apply stock transfer if completed
      if (createDto.status === 'Completed') {
        // Reduce stock from source store
        const fromStock = await stockRepo.findOne({
          where: {
            product: { id: createDto.product },
            store: { id: createDto.fromStore },
          },
        });

        if (!fromStock || fromStock.quantity < createDto.quantity) {
          throw new Error('Insufficient stock in source store');
        }

        fromStock.quantity -= createDto.quantity;
        await stockRepo.save(fromStock);

        // Add stock to destination store
        const toStock = await stockRepo.findOne({
          where: {
            product: { id: createDto.product },
            store: { id: createDto.toStore },
          },
        });

        if (toStock) {
          toStock.quantity += createDto.quantity;
          await stockRepo.save(toStock);
        } else {
          // Create new stock entry for destination store
          const newStock = stockRepo.create({
            product: { id: createDto.product },
            store: { id: createDto.toStore },
            quantity: createDto.quantity,
            unitCost: fromStock.unitCost,
          } as any);
          await stockRepo.save(newStock);
        }
      }

      return await transferRepo.findOne({
        where: { id: savedTransfer.id },
        relations: ['product', 'fromStore', 'toStore'],
      }) as StockTransfer;
    });
  }

  async update(id: string, updateDto: UpdateStockTransferDto): Promise<StockTransfer> {
    const updateData: any = {
      ...updateDto,
      product: updateDto.product ? { id: updateDto.product } : undefined,
      fromStore: updateDto.fromStore ? { id: updateDto.fromStore } : undefined,
      toStore: updateDto.toStore ? { id: updateDto.toStore } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as StockTransfer;
  }

  async getTransfersByStore(storeId: string, type: 'incoming' | 'outgoing'): Promise<StockTransfer[]> {
    const whereCondition = type === 'incoming' 
      ? { toStore: { id: storeId } }
      : { fromStore: { id: storeId } };

    return await this.repository.find({
      where: whereCondition,
      relations: ['product', 'fromStore', 'toStore'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTransferReport(startDate: string, endDate: string): Promise<any> {
    const transfers = await this.repository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.product', 'product')
      .leftJoinAndSelect('transfer.fromStore', 'fromStore')
      .leftJoinAndSelect('transfer.toStore', 'toStore')
      .where('transfer.createdAt BETWEEN :startDate AND :endDate', { 
        startDate: new Date(startDate), 
        endDate: new Date(endDate) 
      })
      .getMany();

    const totalTransfers = transfers.length;
    const completedTransfers = transfers.filter(t => t.status === 'Completed').length;
    const pendingTransfers = transfers.filter(t => t.status === 'Pending').length;
    const cancelledTransfers = transfers.filter(t => t.status === 'Cancelled').length;

    return {
      totalTransfers,
      completedTransfers,
      pendingTransfers,
      cancelledTransfers,
      completionRate: totalTransfers > 0 ? (completedTransfers / totalTransfers) * 100 : 0,
      transfers,
    };
  }
}