import { DataSource, type FindManyOptions } from 'typeorm';
import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { SaleReturn } from '../entities/SaleReturn';
import { CreateSaleReturnDto } from '../dtos/CreateSaleReturnDto';
import { UpdateSaleReturnDto } from '../dtos/UpdateSaleReturnDto';
import { SaleReturnProduct } from '../entities/SaleReturnProduct';
import { Stock } from '../entities/Stock';
import { Product } from '../entities/Product';
import { Sale } from '../entities/Sale';
import { PaymentMethod } from '../entities/PaymentMethod';
import { getDataSource } from '../config/database';

export class SaleReturnService extends BaseService<SaleReturn, CreateSaleReturnDto, UpdateSaleReturnDto> {
  protected dataSource: DataSource;

  constructor() {
    super(SaleReturn, CreateSaleReturnDto, UpdateSaleReturnDto, ['returnDate', 'sale.invoiceNumber']);
    this.dataSource = getDataSource();
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<SaleReturn>
  ): Promise<PaginatedResult<SaleReturn>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('saleReturn')
      .leftJoinAndSelect('saleReturn.sale', 'sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('saleReturn.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('saleReturn.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.stock', 'stock');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`saleReturn.${field} ILIKE :query`);
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
        qb = qb.orderBy(`saleReturn.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('saleReturn.createdAt', 'DESC');
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

  async findById(id: string): Promise<SaleReturn | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: [
        'sale',
        'sale.customer',
        'paymentMethod',
        'items',
        'items.product',
        'items.stock',
      ],
    });
  }

  async create(createDto: CreateSaleReturnDto): Promise<SaleReturn> {
    return await this.dataSource.transaction(async (manager) => {
      const saleReturnRepo = manager.getRepository(SaleReturn);
      
      // Verify sale exists
      const sale = await manager.getRepository(Sale).findOne({ 
        where: { id: createDto.sale },
        relations: ['items', 'items.product', 'items.stock']
      });
      
      if (!sale) {
        throw new Error('Sale not found');
      }

      const saleReturnEntity = saleReturnRepo.create({
        returnDate: createDto.returnDate,
        sale: { id: createDto.sale },
        totalReturnAmount: createDto.totalReturnAmount,
        paymentMethod: createDto.paymentMethod ? { id: createDto.paymentMethod } : undefined,
      } as any);

      const savedSaleReturn = await saleReturnRepo.save(saleReturnEntity);

      if (createDto.items && createDto.items.length > 0) {
        const srpRepo = manager.getRepository(SaleReturnProduct);
        const stockRepo = manager.getRepository(Stock);
        const productRepo = manager.getRepository(Product);

        for (const itemDto of createDto.items) {
          const product = await productRepo.findOne({ where: { id: itemDto.product } });
          if (!product) {
            throw new Error(`Product with id ${itemDto.product} not found`);
          }

          // Find the original sale item to validate return quantity
          const originalSaleItem = sale.items.find(item => item.product.id === itemDto.product);
          if (!originalSaleItem) {
            throw new Error(`Product ${product.name} was not in the original sale`);
          }

          if (itemDto.quantity > originalSaleItem.quantity) {
            throw new Error(`Cannot return more than sold quantity for ${product.name}`);
          }

          const srpEntity = srpRepo.create({
            saleReturn: savedSaleReturn,
            product,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            totalPrice: itemDto.totalPrice,
            stock: itemDto.stock ? { id: itemDto.stock } : undefined,
          } as any);

          await srpRepo.save(srpEntity);

          // Restore stock quantity
          if (itemDto.stock) {
            const stock = await stockRepo.findOne({ where: { id: itemDto.stock } });
            if (stock) {
              stock.quantity += itemDto.quantity;
              await stockRepo.save(stock);
            }
          }
        }
      }

      return await saleReturnRepo.findOne({
        where: { id: savedSaleReturn.id },
        relations: [
          'sale',
          'sale.customer',
          'paymentMethod',
          'items',
          'items.product',
          'items.stock',
        ],
      }) as SaleReturn;
    });
  }

  async update(id: string, updateDto: UpdateSaleReturnDto): Promise<SaleReturn> {
    return await this.dataSource.transaction(async (manager) => {
      const saleReturnRepo = manager.getRepository(SaleReturn);
      const existing = await saleReturnRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.product', 'items.stock'],
      });

      if (!existing) {
        throw new Error('Sale return not found');
      }

      // Update sale return fields
      await saleReturnRepo.update(id, {
        returnDate: updateDto.returnDate,
        sale: updateDto.sale ? { id: updateDto.sale } : undefined,
        totalReturnAmount: updateDto.totalReturnAmount,
        paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
      } as any);

      // Handle items updates
      const srpRepo = manager.getRepository(SaleReturnProduct);
      const stockRepo = manager.getRepository(Stock);

      // Reverse stock changes for existing items
      for (const item of existing.items) {
        if (item.stock) {
          const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
          if (stock) {
            stock.quantity -= item.quantity;
            await stockRepo.save(stock);
          }
        }
      }

      // Remove existing items
      await srpRepo.delete({ saleReturn: { id } });

      // Add new items
      if (updateDto.items) {
        for (const itemDto of updateDto.items) {
          const product = await manager.getRepository(Product).findOne({ where: { id: itemDto.product } });
          if (!product) throw new Error(`Product ${itemDto.product} not found`);

          const newItem = srpRepo.create({
            saleReturn: { id },
            product,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            totalPrice: itemDto.totalPrice,
            stock: itemDto.stock ? { id: itemDto.stock } : undefined,
          } as any);

          await srpRepo.save(newItem);

          // Restore stock
          if (itemDto.stock) {
            const stock = await stockRepo.findOne({ where: { id: itemDto.stock } });
            if (stock) {
              stock.quantity += itemDto.quantity;
              await stockRepo.save(stock);
            }
          }
        }
      }

      return await saleReturnRepo.findOne({
        where: { id } as any,
        relations: [
          'sale',
          'sale.customer',
          'paymentMethod',
          'items',
          'items.product',
          'items.stock',
        ],
      }) as SaleReturn;
    });
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const saleReturnRepo = manager.getRepository(SaleReturn);
      const stockRepo = manager.getRepository(Stock);

      const existing = await saleReturnRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.stock'],
      });

      if (!existing) {
        throw new Error('Sale return not found');
      }

      // Reverse stock changes
      for (const item of existing.items) {
        if (item.stock) {
          const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
          if (stock) {
            stock.quantity -= item.quantity;
            if (stock.quantity < 0) stock.quantity = 0;
            await stockRepo.save(stock);
          }
        }
      }

      await saleReturnRepo.softDelete(id);
    });
  }

  async getSaleReturnsByDateRange(startDate: string, endDate: string): Promise<SaleReturn[]> {
    return await this.repository
      .createQueryBuilder('saleReturn')
      .leftJoinAndSelect('saleReturn.sale', 'sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('saleReturn.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('saleReturn.returnDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async getSaleReturnReport(startDate: string, endDate: string): Promise<any> {
    const returns = await this.getSaleReturnsByDateRange(startDate, endDate);
    
    const totalReturns = returns.length;
    const totalReturnAmount = returns.reduce((sum, ret) => sum + ret.totalReturnAmount, 0);

    return {
      totalReturns,
      totalReturnAmount,
      averageReturnValue: totalReturns > 0 ? totalReturnAmount / totalReturns : 0,
      returns,
    };
  }
}