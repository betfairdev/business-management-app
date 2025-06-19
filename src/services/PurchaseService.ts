// src/services/PurchaseService.ts
import { DataSource, type FindManyOptions } from 'typeorm';
import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Purchase } from '../entities/Purchase';
import { CreatePurchaseDto } from '../dtos/CreatePurchaseDto';
import { UpdatePurchaseDto } from '../dtos/UpdatePurchaseDto';
import { PurchaseProduct } from '../entities/PurchaseProduct';
import { Stock } from '../entities/Stock';
import { Product } from '../entities/Product';
import { Batch } from '../entities/Batch';
import { Supplier } from '../entities/Supplier';
import { Store } from '../entities/Store';
import { Employee } from '../entities/Employee';
import { PaymentMethod } from '../entities/PaymentMethod';
import { getDataSource } from '../config/database';

export class PurchaseService extends BaseService<Purchase, CreatePurchaseDto, UpdatePurchaseDto> {
  protected dataSource: DataSource;

  constructor() {
    super(Purchase, CreatePurchaseDto, UpdatePurchaseDto, ['invoiceNumber', 'supplier.name']);
    this.dataSource = getDataSource();
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Purchase>
  ): Promise<PaginatedResult<Purchase>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchase.store', 'store')
      .leftJoinAndSelect('purchase.employee', 'employee')
      .leftJoinAndSelect('purchase.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.batch', 'batch');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`purchase.${field} ILIKE :query`);
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
        qb = qb.orderBy(`purchase.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('purchase.createdAt', 'DESC');
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

  async findById(id: string): Promise<Purchase | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: [
        'supplier',
        'store',
        'employee',
        'paymentMethod',
        'items',
        'items.product',
        'items.batch',
      ],
    });
  }

  async create(createDto: CreatePurchaseDto): Promise<Purchase> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(Purchase);
      
      const purchaseEntity = purchaseRepo.create({
        purchaseDate: createDto.purchaseDate,
        supplier: createDto.supplier ? { id: createDto.supplier } : undefined,
        store: createDto.store ? { id: createDto.store } : undefined,
        employee: createDto.employee ? { id: createDto.employee } : undefined,
        subTotal: Number(createDto.subTotal),
        discount: createDto.discount ? Number(createDto.discount) : 0,
        taxAmount: createDto.taxAmount ? Number(createDto.taxAmount) : 0,
        shippingCharge: createDto.shippingCharge ? Number(createDto.shippingCharge) : 0,
        totalAmount: Number(createDto.totalAmount),
        dueAmount: Number(createDto.dueAmount),
        paymentMethod: createDto.paymentMethod ? { id: createDto.paymentMethod } : undefined,
        invoiceNumber: createDto.invoiceNumber,
        receiptOrAny: createDto.receiptOrAny,
        status: createDto.status,
        notes: createDto.notes,
      } as any);

      const savedPurchase = await purchaseRepo.save(purchaseEntity);

      if (createDto.items && createDto.items.length > 0) {
        const ppRepo = manager.getRepository(PurchaseProduct);
        const stockRepo = manager.getRepository(Stock);
        const productRepo = manager.getRepository(Product);
        const batchRepo = manager.getRepository(Batch);

        for (const itemDto of createDto.items) {
          const product = await productRepo.findOne({ where: { id: itemDto.product } });
          if (!product) {
            throw new Error(`Product with id ${itemDto.product} not found`);
          }

          let batch: Batch | undefined;
          if (itemDto.batch) {
            batch = await batchRepo.findOne({ where: { id: itemDto.batch } });
            if (!batch) {
              throw new Error(`Batch with id ${itemDto.batch} not found`);
            }
          }

          const unitCostNum = Number(itemDto.unitCost);
          const totalCostNum = itemDto.totalCost ? Number(itemDto.totalCost) : unitCostNum * itemDto.quantity;

          const ppEntity = ppRepo.create({
            purchase: savedPurchase,
            product,
            quantity: itemDto.quantity,
            unitCost: unitCostNum,
            totalCost: totalCostNum,
            batch,
          } as any);
          await ppRepo.save(ppEntity);

          // Update or create stock
          const stockQuery: any = { product: { id: product.id } };
          if (batch) stockQuery.batch = { id: batch.id };
          if (createDto.store) stockQuery.store = { id: createDto.store };

          let existingStock = await stockRepo.findOne({
            where: stockQuery,
            relations: ['product', 'batch', 'store'],
          });

          if (existingStock) {
            existingStock.quantity += itemDto.quantity;
            existingStock.unitCost = unitCostNum;
            await stockRepo.save(existingStock);
          } else {
            const newStock = stockRepo.create({
              product,
              batch,
              quantity: itemDto.quantity,
              unitCost: unitCostNum,
              store: createDto.store ? { id: createDto.store } : undefined,
            } as any);
            await stockRepo.save(newStock);
          }
        }
      }

      return await purchaseRepo.findOne({
        where: { id: savedPurchase.id },
        relations: [
          'supplier',
          'store',
          'employee',
          'paymentMethod',
          'items',
          'items.product',
          'items.batch',
        ],
      }) as Purchase;
    });
  }

  async update(id: string, updateDto: UpdatePurchaseDto): Promise<Purchase> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(Purchase);
      const existing = await purchaseRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.product', 'items.batch'],
      });

      if (!existing) {
        throw new Error('Purchase not found');
      }

      await purchaseRepo.update(id, {
        purchaseDate: updateDto.purchaseDate,
        supplier: updateDto.supplier ? { id: updateDto.supplier } : undefined,
        store: updateDto.store ? { id: updateDto.store } : undefined,
        employee: updateDto.employee ? { id: updateDto.employee } : undefined,
        subTotal: updateDto.subTotal ? Number(updateDto.subTotal) : undefined,
        discount: updateDto.discount ? Number(updateDto.discount) : undefined,
        taxAmount: updateDto.taxAmount ? Number(updateDto.taxAmount) : undefined,
        shippingCharge: updateDto.shippingCharge ? Number(updateDto.shippingCharge) : undefined,
        totalAmount: updateDto.totalAmount ? Number(updateDto.totalAmount) : undefined,
        dueAmount: updateDto.dueAmount ? Number(updateDto.dueAmount) : undefined,
        paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
        invoiceNumber: updateDto.invoiceNumber,
        receiptOrAny: updateDto.receiptOrAny,
        status: updateDto.status,
        notes: updateDto.notes,
      } as any);

      return await purchaseRepo.findOne({
        where: { id } as any,
        relations: [
          'supplier',
          'store',
          'employee',
          'paymentMethod',
          'items',
          'items.product',
          'items.batch',
        ],
      }) as Purchase;
    });
  }

  async getPurchasesByDateRange(startDate: string, endDate: string): Promise<Purchase[]> {
    return await this.repository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('purchase.purchaseDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async getPurchaseReport(startDate: string, endDate: string): Promise<any> {
    const purchases = await this.getPurchasesByDateRange(startDate, endDate);
    
    const totalPurchases = purchases.length;
    const totalAmount = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const totalDiscount = purchases.reduce((sum, purchase) => sum + purchase.discount, 0);
    const totalTax = purchases.reduce((sum, purchase) => sum + purchase.taxAmount, 0);

    return {
      totalPurchases,
      totalAmount,
      totalDiscount,
      totalTax,
      averagePurchaseValue: totalPurchases > 0 ? totalAmount / totalPurchases : 0,
      purchases,
    };
  }
}