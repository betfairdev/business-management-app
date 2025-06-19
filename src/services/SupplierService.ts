import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Supplier } from '../entities/Supplier';
import { CreateSupplierDto } from '../dtos/CreateSupplierDto';
import { UpdateSupplierDto } from '../dtos/UpdateSupplierDto';
import { type FindManyOptions } from 'typeorm';

export class SupplierService extends BaseService<Supplier, CreateSupplierDto, UpdateSupplierDto> {
  constructor() {
    super(Supplier, CreateSupplierDto, UpdateSupplierDto, ['name', 'phone', 'email', 'address']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Supplier>
  ): Promise<PaginatedResult<Supplier>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('supplier')
      .leftJoinAndSelect('supplier.purchases', 'purchases');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions = searchFields.map(field => `supplier.${field} ILIKE :query`);
      qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
    }

    if (options?.sortBy) {
      qb = qb.orderBy(`supplier.${options.sortBy}`, options.sortOrder || 'ASC');
    } else {
      qb = qb.orderBy('supplier.createdAt', 'DESC');
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

  async findById(id: string): Promise<Supplier | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['purchases'],
    });
  }

  async getSuppliersByType(supplierType: string): Promise<Supplier[]> {
    return await this.repository.find({
      where: { supplierType } as any,
    });
  }

  async getActiveSuppliers(): Promise<Supplier[]> {
    return await this.repository.find({
      where: { status: 'Active' },
    });
  }

  async getSupplierPurchaseHistory(supplierId: string): Promise<any[]> {
    const supplier = await this.repository.findOne({
      where: { id: supplierId },
      relations: ['purchases', 'purchases.items', 'purchases.items.product'],
    });

    return supplier?.purchases || [];
  }
}