import { DataSource, type FindManyOptions } from 'typeorm';
import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Sale } from '../entities/Sale';
import { CreateSaleDto } from '../dtos/CreateSaleDto';
import { UpdateSaleDto } from '../dtos/UpdateSaleDto';
import { SaleProduct } from '../entities/SaleProduct';
import { Stock } from '../entities/Stock';
import { Product } from '../entities/Product';
import { Customer } from '../entities/Customer';
import { Store } from '../entities/Store';
import { Employee } from '../entities/Employee';
import { PaymentMethod } from '../entities/PaymentMethod';
import { getDataSource } from '../config/database';

export class SaleService extends BaseService<Sale, CreateSaleDto, UpdateSaleDto> {
  protected dataSource: DataSource;

  constructor() {
    super(Sale, CreateSaleDto, UpdateSaleDto, ['invoiceNumber', 'customer.name']);
    this.dataSource = getDataSource();
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Sale>
  ): Promise<PaginatedResult<Sale>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.store', 'store')
      .leftJoinAndSelect('sale.employee', 'employee')
      .leftJoinAndSelect('sale.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('sale.items', 'items')
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
          conditions.push(`sale.${field} ILIKE :query`);
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
        qb = qb.orderBy(`sale.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('sale.createdAt', 'DESC');
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

  async findById(id: string): Promise<Sale | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: [
        'customer',
        'store',
        'employee',
        'paymentMethod',
        'items',
        'items.product',
        'items.stock',
      ],
    });
  }

  async create(createDto: CreateSaleDto): Promise<Sale> {
    return await this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      
      const saleEntity = saleRepo.create({
        saleDate: createDto.saleDate,
        customer: createDto.customer ? { id: createDto.customer } : undefined,
        store: createDto.store ? { id: createDto.store } : undefined,
        employee: createDto.employee ? { id: createDto.employee } : undefined,
        subTotal: Number(createDto.subTotal),
        discount: createDto.discount ? Number(createDto.discount) : 0,
        taxAmount: createDto.taxAmount ? Number(createDto.taxAmount) : 0,
        deliveryCharge: createDto.deliveryCharge ? Number(createDto.deliveryCharge) : 0,
        totalAmount: Number(createDto.totalAmount),
        dueAmount: Number(createDto.dueAmount),
        paymentMethod: createDto.paymentMethod ? { id: createDto.paymentMethod } : undefined,
        invoiceNumber: createDto.invoiceNumber,
        receiptOrAny: createDto.receiptOrAny,
        status: createDto.status,
        notes: createDto.notes,
      } as any);

      const savedSale = await saleRepo.save(saleEntity);

      if (createDto.items && createDto.items.length > 0) {
        const spRepo = manager.getRepository(SaleProduct);
        const stockRepo = manager.getRepository(Stock);
        const productRepo = manager.getRepository(Product);

        for (const itemDto of createDto.items) {
          const product = await productRepo.findOne({ where: { id: itemDto.product } });
          if (!product) {
            throw new Error(`Product with id ${itemDto.product} not found`);
          }

          const stock = await stockRepo.findOne({ where: { id: itemDto.stock } });
          if (!stock) {
            throw new Error(`Stock with id ${itemDto.stock} not found`);
          }

          if (stock.quantity < itemDto.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
          }

          const unitPriceNum = Number(itemDto.unitPrice);
          const totalPriceNum = itemDto.totalPrice ? Number(itemDto.totalPrice) : unitPriceNum * itemDto.quantity;

          const spEntity = spRepo.create({
            sale: savedSale,
            product,
            quantity: itemDto.quantity,
            unitPrice: unitPriceNum,
            totalPrice: totalPriceNum,
            stock,
          } as any);

          await spRepo.save(spEntity);

          // Reduce stock quantity
          stock.quantity -= itemDto.quantity;
          await stockRepo.save(stock);
        }
      }

      return await saleRepo.findOne({
        where: { id: savedSale.id },
        relations: [
          'customer',
          'store',
          'employee',
          'paymentMethod',
          'items',
          'items.product',
          'items.stock',
        ],
      }) as Sale;
    });
  }

  async update(id: string, updateDto: UpdateSaleDto): Promise<Sale> {
    return await this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const existing = await saleRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.product', 'items.stock'],
      });

      if (!existing) {
        throw new Error('Sale not found');
      }

      // Update sale fields
      await saleRepo.update(id, {
        saleDate: updateDto.saleDate,
        customer: updateDto.customer ? { id: updateDto.customer } : undefined,
        store: updateDto.store ? { id: updateDto.store } : undefined,
        employee: updateDto.employee ? { id: updateDto.employee } : undefined,
        paymentMethod: updateDto.paymentMethod ? { id: updateDto.paymentMethod } : undefined,
        invoiceNumber: updateDto.invoiceNumber,
        receiptOrAny: updateDto.receiptOrAny,
        status: updateDto.status,
        notes: updateDto.notes,
      } as any);

      // Handle items updates (similar to PurchaseService logic)
      const spRepo = manager.getRepository(SaleProduct);
      const stockRepo = manager.getRepository(Stock);
      const productRepo = manager.getRepository(Product);

      // Restore stock for existing items
      for (const item of existing.items) {
        const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
        if (stock) {
          stock.quantity += item.quantity;
          await stockRepo.save(stock);
        }
      }

      // Remove existing items
      await spRepo.delete({ sale: { id } });

      // Add new items
      if (updateDto.items) {
        for (const itemDto of updateDto.items) {
          const product = await productRepo.findOne({ where: { id: itemDto.product } });
          if (!product) throw new Error(`Product ${itemDto.product} not found`);

          const stock = await stockRepo.findOne({ where: { id: itemDto.stock } });
          if (!stock) throw new Error(`Stock ${itemDto.stock} not found`);

          if (stock.quantity < itemDto.quantity) {
            throw new Error(`Insufficient stock for product ${product.name}`);
          }

          const unitPriceNum = Number(itemDto.unitPrice);
          const totalPriceNum = itemDto.totalPrice ? Number(itemDto.totalPrice) : unitPriceNum * itemDto.quantity;

          const newItem = spRepo.create({
            sale: { id },
            product,
            quantity: itemDto.quantity,
            unitPrice: unitPriceNum,
            totalPrice: totalPriceNum,
            stock,
          } as any);

          await spRepo.save(newItem);

          // Reduce stock
          stock.quantity -= itemDto.quantity;
          await stockRepo.save(stock);
        }
      }

      return await saleRepo.findOne({
        where: { id } as any,
        relations: [
          'customer',
          'store',
          'employee',
          'paymentMethod',
          'items',
          'items.product',
          'items.stock',
        ],
      }) as Sale;
    });
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const stockRepo = manager.getRepository(Stock);

      const existing = await saleRepo.findOne({
        where: { id } as any,
        relations: ['items', 'items.stock'],
      });

      if (!existing) {
        throw new Error('Sale not found');
      }

      // Restore stock quantities
      for (const item of existing.items) {
        const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
        if (stock) {
          stock.quantity += item.quantity;
          await stockRepo.save(stock);
        }
      }

      await saleRepo.softDelete(id);
    });
  }

  async getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
    return await this.repository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.customer', 'customer')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .where('sale.saleDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();
  }

  async getSalesReport(startDate: string, endDate: string): Promise<any> {
    const sales = await this.getSalesByDateRange(startDate, endDate);
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discount, 0);
    const totalTax = sales.reduce((sum, sale) => sum + sale.taxAmount, 0);

    return {
      totalSales,
      totalRevenue,
      totalDiscount,
      totalTax,
      averageSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      sales,
    };
  }
}