import { DataSource, type FindManyOptions } from 'typeorm';
import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { PurchaseReturn } from '../entities/PurchaseReturn';
import { CreatePurchaseReturnDto } from '../dtos/CreatePurchaseReturnDto';
import { UpdatePurchaseReturnDto } from '../dtos/UpdatePurchaseReturnDto';
import { PurchaseReturnProduct } from '../entities/PurchaseReturnProduct';
import { Stock } from '../entities/Stock';
import { Product } from '../entities/Product';
import { Purchase } from '../entities/Purchase';
import { PaymentMethod } from '../entities/PaymentMethod';
import { getDataSource } from '../config/database';

export class PurchaseReturnService extends BaseService<PurchaseReturn, CreatePurchaseReturnDto, UpdatePurchaseReturnDto> {
  protected dataSource: DataSource;

  constructor() {
    super(PurchaseReturn, CreatePurchaseReturnDto, UpdatePurchaseReturnDto, ['returnDate', 'purchase.invoiceNumber']);
    this.dataSource = getDataSource();
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<PurchaseReturn>
  ): Promise<PaginatedResult<PurchaseReturn>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('purchaseReturn')
      .leftJoinAndSelect('purchaseReturn.purchase', 'purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchaseReturn.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('purchaseReturn.items', 'items')
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
          conditions.push(`purchaseReturn.${field} ILIKE :query`);
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
        qb = qb.orderBy(`purchaseReturn.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('purchaseReturn.createdAt', 'DESC');
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

  async findById(id: string): Promise<PurchaseReturn | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: [
        'purchase',
        'purchase.supplier',
        'paymentMethod',
        'items',
        'items.product',
        'items.stock',
      ],
    });
  }

  async create(createDto: CreatePurchaseReturnDto): Promise<PurchaseReturn> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseReturnRepo = manager.getRepository(PurchaseReturn);
      
      // Verify purchase exists
      const purchase = await manager.getRepository(Purchase).findOne({ 
        where: { id: createDto.purchase },
        relations: ['items', 'items.product', 'items.stock']
      });
      
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      const purchaseReturnEntity = purchaseReturnRepo.create({
        returnDate: createDto.returnDate,
        purchase: { id: createDto.purchase },
        totalReturnAmount: createDto.totalReturnAmount,
        paymentMethod: createDto.paymentMethod ? { id: createDto.paymentMethod } : undefined,
      } as any);

      const savedPurchaseReturn = await purchaseReturnRepo.save(purchaseReturnEntity);

      if (createDto.items && createDto.items.length > 0) {
        const prpRepo = manager.getRepository(PurchaseReturnProduct);
        const stockRepo = manager.getRepository(Stock);
        const productRepo = manager.getRepository(Product);

        for (const itemDto of createDto.items) {
          const product = await productRepo.findOne({ where: { id: itemDto.productId } });
          if (!product) {
            throw new Error(`Product with id ${itemDto.productId} not found`);
          }

          // Find the original purchase item to validate return quantity
          const originalPurchaseItem = purchase.items.find(item => item.product.id === itemDto.productId);
          if (!originalPurchaseItem) {
            throw new Error(`Product ${product.name} was not in the original purchase`);
          }

          if (itemDto.quantity > originalPurchaseItem.quantity) {
            throw new Error(`Cannot return more than purchased quantity for ${product.name}`);
          }

          const prpEntity = prpRepo.create({
            purchaseReturn: savedPurchaseReturn,
            product,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            totalPrice: itemDto.totalPrice,
            stock: itemDto.stock ? { id: itemDto.stock } : undefined,
          } as any);

          await prpRepo.save(prpEntity);

          // Reduce stock quantity
          if (itemDto.stock) {
            const stock = await stockRepo.findOne({ where: { id: itemDto.stock } });
            if (stock) {
              stock.quantity -= itemDto.quantity;
              if (stock.quantity < 0) stock.quantity = 0;
              await stockRepo.save(stock);
            }
          }
        }
      }

      return await purchaseReturnRepo.findOne({
        where: { id: savedPurchaseReturn.id },
        relations: [
          'purchase',
          'purchase.supplier',
          'paymentMethod',
          'items',
          'items.product',
          'items.stock',
        ],
      }) as PurchaseReturn;
    });
  }

  async update(id: string, updateDto: UpdatePurchaseReturnDto): Promise<PurchaseReturn> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseReturnRepo = manager.getRepository(PurchaseReturn);
      const existing = await purchaseReturnRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.product', 'items.stock'],
      });

      if (!existing) {
        throw new Error('Purchase return not found');
      }

      // Update purchase return fields
      await purchaseReturnRepo.update(id, {
        returnDate: updateDto.returnDate,
        purchase: updateDto.purchase ? { id: updateDto.purchase } : undefined,
        totalReturnAmount: updateDto.totalReturnAmount,
        paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
      } as any);

      // Handle items updates
      const prpRepo = manager.getRepository(PurchaseReturnProduct);
      const stockRepo = manager.getRepository(Stock);

      // Reverse stock changes for existing items
      for (const item of existing.items) {
        if (item.stock) {
          const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
          if (stock) {
            stock.quantity += item.quantity;
            await stockRepo.save(stock);
          }
        }
      }

      // Remove existing items
      await prpRepo.delete({ purchaseReturn: { id } });

      // Add new items
      if (updateDto.items) {
        for (const itemDto of updateDto.items) {
          const product = await manager.getRepository(Product).findOne({ where: { id: itemDto.productId } });
          if (!product) throw new Error(`Product ${itemDto.productId} not found`);

          const newItem = prpRepo.create({
            purchaseReturn: { id },
            product,
            quantity: itemDto.quantity,
            unitPrice: itemDto.unitPrice,
            totalPrice: itemDto.totalPrice,
            stock: itemDto.stock ? { id: itemDto.stock } : undefined,
          } as any);

          await prpRepo.save(newItem);

          // Reduce stock
          if (itemDto.stock) {
            const stock = await stockRepo.findOne({ where: { id: itemDto.stock } });
            if (stock) {
              stock.quantity -= itemDto.quantity;
              if (stock.quantity < 0) stock.quantity = 0;
              await stockRepo.save(stock);
            }
          }
        }
      }

      return await purchaseReturnRepo.findOne({
        where: { id } as any,
        relations: [
          'purchase',
          'purchase.supplier',
          'paymentMethod',
          'items',
          'items.product',
          'items.stock',
        ],
      }) as PurchaseReturn;
    });
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const purchaseReturnRepo = manager.getRepository(PurchaseReturn);
      const stockRepo = manager.getRepository(Stock);

      const existing = await purchaseReturnRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.stock'],
      });

      if (!existing) {
        throw new Error('Purchase return not found');
      }

      // Reverse stock changes
      for (const item of existing.items) {
        if (item.stock) {
          const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
          if (stock) {
            stock.quantity += item.quantity;
            await stockRepo.save(stock);
          }
        }
      }

      await purchaseReturnRepo.softDelete(id);
    });
  }

  async getPurchaseReturnsByDateRange(startDate: string, endDate: string): Promise<PurchaseReturn[]> {
    return await this.repository
      .createQueryBuilder('purchaseReturn')
      .leftJoinAndSelect('purchaseReturn.purchase', 'purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchaseReturn.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('purchaseReturn.returnDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async getPurchaseReturnReport(startDate: string, endDate: string): Promise<any> {
    const returns = await this.getPurchaseReturnsByDateRange(startDate, endDate);
    
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