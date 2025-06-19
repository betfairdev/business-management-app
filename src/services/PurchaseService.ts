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
    // searchableFields: invoiceNumber and supplier name (use "supplier.name" for relation search)
    super(Purchase, CreatePurchaseDto, UpdatePurchaseDto, ['invoiceNumber', 'supplier.name']);
    this.dataSource = getDataSource();
  }

  /**
   * Override findAll to include relations by default and search across purchase and supplier.
   */
  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Purchase>
  ): Promise<PaginatedResult<Purchase>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const repo = this.repository;
    let qb = repo.createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.supplier', 'supplier')
      .leftJoinAndSelect('purchase.store', 'store')
      .leftJoinAndSelect('purchase.employee', 'employee')
      .leftJoinAndSelect('purchase.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('purchase.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.batch', 'batch');

    // Apply search if provided
    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields && options.fields.length > 0
        ? options.fields
        : this.searchableFields;
      const conditions: string[] = [];
      const params: Record<string, string> = {};
      params.query = `%${options.query}%`;
      searchFields.forEach((field, idx) => {
        if (field.includes('.')) {
          // relation field, e.g. supplier.name
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`purchase.${field} ILIKE :query`);
        }
      });
      if (conditions.length > 0) {
        qb = qb.andWhere(`(${conditions.join(' OR ')})`, params);
      }
    }

    // Apply sorting
    if (options?.sortBy) {
      // Allow relation sorting if sortBy contains '.'
      if (options.sortBy.includes('.')) {
        const [alias, col] = options.sortBy.split('.');
        qb = qb.orderBy(`${alias}.${col}`, options.sortOrder || 'ASC');
      } else {
        qb = qb.orderBy(`purchase.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('purchase.createdAt', 'DESC');
    }

    // Apply additional findOptions.relations if provided: but we already load main relations
    // skip/take and count
    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Override findById to load relations.
   */
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

  /**
   * Create a new Purchase with items and stock updates in a transaction.
   */
  async create(createDto: CreatePurchaseDto): Promise<Purchase> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(Purchase);
      // Create Purchase entity (trusting DTO fields, or recompute after items)
      const purchaseEntity = purchaseRepo.create({
        purchaseDate: createDto.purchaseDate,
        supplier: createDto.supplier ? { id: createDto.supplier } : undefined,
        store: createDto.store ? { id: createDto.store } : undefined,
        employee: createDto.employee ? { id: createDto.employee } : undefined,
        subTotal: Number(createDto.subTotal),
        discount: createDto.discount != null ? Number(createDto.discount) : 0,
        taxAmount: createDto.taxAmount != null ? Number(createDto.taxAmount) : 0,
        shippingCharge: createDto.shippingCharge != null ? Number(createDto.shippingCharge) : 0,
        totalAmount: Number(createDto.totalAmount),
        dueAmount: Number(createDto.dueAmount),
        paymentMethod: createDto.paymentMethod ? { id: createDto.paymentMethod } : undefined,
        invoiceNumber: createDto.invoiceNumber,
        receiptOrAny: createDto.receiptOrAny,
        status: createDto.status,
        notes: createDto.notes,
      } as any);
      const savedPurchase = await purchaseRepo.save(purchaseEntity);

      // Handle items and stock
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
          const totalCostNum = itemDto.totalCost != null
            ? Number(itemDto.totalCost)
            : unitCostNum * itemDto.quantity;

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

      // Optionally, recalc subTotal/totalAmount here by summing items; omitted for brevity

      return await manager.getRepository(Purchase).findOne({
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

  /**
   * Override update to handle item adjustments and stock deltas.
   */
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

      // 1. Adjust purchase fields (excluding items)
      await purchaseRepo.update(id, {
        purchaseDate: updateDto.purchaseDate,
        supplier: updateDto.supplier ? { id: updateDto.supplier } : undefined,
        store: updateDto.store ? { id: updateDto.store } : undefined,
        employee: updateDto.employee ? { id: updateDto.employee } : undefined,
        // We will recalc subTotal/totalAmount after handling items:
        // Temporarily skip updating subTotal/taxAmount/etc here.
        paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
        invoiceNumber: updateDto.invoiceNumber,
        receiptOrAny: updateDto.receiptOrAny,
        status: updateDto.status,
        notes: updateDto.notes,
      } as any);

      // 2. Handle items diff
      const ppRepo = manager.getRepository(PurchaseProduct);
      const stockRepo = manager.getRepository(Stock);
      const productRepo = manager.getRepository(Product);
      const batchRepo = manager.getRepository(Batch);

      // Map existing items by productId+batchId (string key)
      const existingMap = new Map<string, PurchaseProduct>();
      for (const item of existing.items) {
        const bId = item.batch?.id || '';
        existingMap.set(`${item.product.id}::${bId}`, item);
      }

      // Map incoming items
      const incomingMap = new Map<string, { dto: typeof updateDto.items[0] }>();
      if (updateDto.items) {
        for (const dto of updateDto.items) {
          const bId = dto.batch || '';
          incomingMap.set(`${dto.product}::${bId}`, { dto });
        }
      }

      // 2a. Items to remove: in existing but not in incoming
      for (const [key, existingItem] of existingMap.entries()) {
        if (!incomingMap.has(key)) {
          // Remove this PurchaseProduct and deduct stock
          // Deduct stock: find matching stock entry
          const stockQuery: any = { product: { id: existingItem.product.id } };
          if (existingItem.batch) stockQuery.batch = { id: existingItem.batch.id };
          if (existing.store) stockQuery.store = { id: existing.store.id };
          const stockEntry = await stockRepo.findOne({ where: stockQuery });
          if (stockEntry) {
            stockEntry.quantity -= existingItem.quantity;
            if (stockEntry.quantity < 0) stockEntry.quantity = 0;
            await stockRepo.save(stockEntry);
          }
          // Delete PurchaseProduct
          await ppRepo.delete(existingItem.id);
        }
      }

      // 2b. Items to add or update quantity
      if (updateDto.items) {
        for (const dto of updateDto.items) {
          const key = `${dto.product}::${dto.batch || ''}`;
          const unitCostNum = Number(dto.unitCost);
          const totalCostNum = dto.totalCost != null
            ? Number(dto.totalCost)
            : unitCostNum * dto.quantity;
          if (existingMap.has(key)) {
            const existingItem = existingMap.get(key)!;
            // If quantity changed or cost changed, adjust stock delta
            if (existingItem.quantity !== dto.quantity) {
              const diff = dto.quantity - existingItem.quantity; // positive means increase stock, negative means reduce
              const stockQuery: any = { product: { id: existingItem.product.id } };
              if (existingItem.batch) stockQuery.batch = { id: existingItem.batch.id };
              if (existing.store) stockQuery.store = { id: existing.store.id };
              const stockEntry = await stockRepo.findOne({ where: stockQuery });
              if (stockEntry) {
                stockEntry.quantity += diff;
                if (stockEntry.quantity < 0) stockEntry.quantity = 0;
                await stockRepo.save(stockEntry);
              }
            }
            // Update PurchaseProduct row
            await ppRepo.update(existingItem.id, {
              quantity: dto.quantity,
              unitCost: unitCostNum,
              totalCost: totalCostNum,
            } as any);
          } else {
            // New item: create PurchaseProduct and increase stock
            const product = await productRepo.findOne({ where: { id: dto.product } });
            if (!product) throw new Error(`Product ${dto.product} not found`);
            let batch: Batch | undefined;
            if (dto.batch) {
              batch = await batchRepo.findOne({ where: { id: dto.batch } });
              if (!batch) throw new Error(`Batch ${dto.batch} not found`);
            }
            const newItem = ppRepo.create({
              purchase: { id },
              product,
              quantity: dto.quantity,
              unitCost: unitCostNum,
              totalCost: totalCostNum,
              batch,
            } as any);
            await ppRepo.save(newItem);
            // Adjust stock
            const stockQuery: any = { product: { id: product.id } };
            if (batch) stockQuery.batch = { id: batch.id };
            if (updateDto.store) stockQuery.store = { id: updateDto.store };
            let stockEntry = await stockRepo.findOne({ where: stockQuery });
            if (stockEntry) {
              stockEntry.quantity += dto.quantity;
              stockEntry.unitCost = unitCostNum;
              await stockRepo.save(stockEntry);
            } else {
              const newStock = stockRepo.create({
                product,
                batch,
                quantity: dto.quantity,
                unitCost: unitCostNum,
                store: updateDto.store ? { id: updateDto.store } : undefined,
              } as any);
              await stockRepo.save(newStock);
            }
          }
        }
      }

      // 3. Recalculate subTotal, totalAmount, dueAmount if desired, or trust updateDto values:
      // Optionally:
      // const sums = await ppRepo.createQueryBuilder('pp')
      //   .select('SUM(pp.totalCost)', 'sum')
      //   .where('pp.purchaseId = :pid', { pid: id })
      //   .getRawOne();
      // const newSubTotal = Number(sums.sum) || 0;
      // await purchaseRepo.update(id, {
      //   subTotal: newSubTotal,
      //   totalAmount: newSubTotal + (updateDto.taxAmount? Number(updateDto.taxAmount):0) - (updateDto.discount?Number(updateDto.discount):0) + (updateDto.shippingCharge?Number(updateDto.shippingCharge):0),
      //   dueAmount: /* adjust based on payments */,
      // } as any);

      // 4. Finally return updated entity with relations
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

  /**
   * Override delete (soft) to reverse stock quantities.
   */
  async delete(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(Purchase);
      const ppRepo = manager.getRepository(PurchaseProduct);
      const stockRepo = manager.getRepository(Stock);

      const existing = await purchaseRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.product', 'items.batch', 'store'],
      });
      if (!existing) {
        throw new Error('Purchase not found');
      }
      // Deduct stock for each item
      for (const item of existing.items) {
        const stockQuery: any = { product: { id: item.product.id } };
        if (item.batch) stockQuery.batch = { id: item.batch.id };
        if (existing.store) stockQuery.store = { id: existing.store.id };
        const stockEntry = await stockRepo.findOne({ where: stockQuery });
        if (stockEntry) {
          stockEntry.quantity -= item.quantity;
          if (stockEntry.quantity < 0) stockEntry.quantity = 0;
          await stockRepo.save(stockEntry);
        }
      }
      // Then soft-delete purchase (and cascade soft-delete of items if configured)
      await purchaseRepo.softDelete(id);
    });
  }

  /**
   * Override restore to re-add stock quantities.
   */
  async restore(id: string): Promise<Purchase> {
    return await this.dataSource.transaction(async (manager) => {
      const purchaseRepo = manager.getRepository(Purchase);
      const ppRepo = manager.getRepository(PurchaseProduct);
      const stockRepo = manager.getRepository(Stock);

      // Restore the purchase first
      await purchaseRepo.restore(id);

      const existing = await purchaseRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.product', 'items.batch', 'store'],
      });
      if (!existing) {
        throw new Error('Purchase not found after restore');
      }
      // Re-add stock for each item
      for (const item of existing.items) {
        const stockQuery: any = { product: { id: item.product.id } };
        if (item.batch) stockQuery.batch = { id: item.batch.id };
        if (existing.store) stockQuery.store = { id: existing.store.id };
        let stockEntry = await stockRepo.findOne({ where: stockQuery });
        if (stockEntry) {
          stockEntry.quantity += item.quantity;
          await stockRepo.save(stockEntry);
        } else {
          const newStock = stockRepo.create({
            product: { id: item.product.id },
            batch: item.batch ? { id: item.batch.id } : undefined,
            quantity: item.quantity,
            unitCost: item.unitCost,
            store: existing.store ? { id: existing.store.id } : undefined,
          } as any);
          await stockRepo.save(newStock);
        }
      }
      // Return restored purchase with relations
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

  /**
   * Hard delete: optionally first remove related PurchaseProduct, but here we just delete.
   */
  async hardDelete(id: string): Promise<void> {
    // It might be wise to soft-delete first and adjust stock; here assume delete after soft-delete handled.
    await this.repository.delete(id);
  }
}
