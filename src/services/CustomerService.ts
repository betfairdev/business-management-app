import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Customer } from '../entities/Customer';
import { CreateCustomerDto } from '../dtos/CreateCustomerDto';
import { UpdateCustomerDto } from '../dtos/UpdateCustomerDto';
import { type FindManyOptions } from 'typeorm';

export class CustomerService extends BaseService<Customer, CreateCustomerDto, UpdateCustomerDto> {
  constructor() {
    super(Customer, CreateCustomerDto, UpdateCustomerDto, ['name', 'phone', 'email', 'address']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Customer>
  ): Promise<PaginatedResult<Customer>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('customer')
      .leftJoinAndSelect('customer.sales', 'sales');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions = searchFields.map(field => `customer.${field} ILIKE :query`);
      qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
    }

    if (options?.sortBy) {
      qb = qb.orderBy(`customer.${options.sortBy}`, options.sortOrder || 'ASC');
    } else {
      qb = qb.orderBy('customer.createdAt', 'DESC');
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

  async findById(id: string): Promise<Customer | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['sales'],
    });
  }

  async getCustomersByType(customerType: string): Promise<Customer[]> {
    return await this.repository.find({
      where: { customerType } as any,
    });
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return await this.repository.find({
      where: { status: 'Active' },
    });
  }

  async getCustomerSalesHistory(customerId: string): Promise<any[]> {
    const customer = await this.repository.findOne({
      where: { id: customerId },
      relations: ['sales', 'sales.items', 'sales.items.product'],
    });

    return customer?.sales || [];
  }
}