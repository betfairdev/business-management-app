import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Customer, CustomerType } from '../entities/Customer';
import { CreateCustomerDto } from '../dtos/CreateCustomerDto';
import { UpdateCustomerDto } from '../dtos/UpdateCustomerDto';

export class CustomerService extends BaseService<Customer, CreateCustomerDto, UpdateCustomerDto> {
  constructor() {
    super(Customer, CreateCustomerDto, UpdateCustomerDto, ['name', 'phone', 'email', 'address']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions & { active?: boolean; customerType?: CustomerType }
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

    // Add filter for active/inactive status
    if (typeof options?.active === 'boolean') {
      qb = qb.andWhere('customer.active = :active', { active: options.active });
    }

    // Add filter for customer type
    if (options?.customerType) {
      qb = qb.andWhere('customer.customerType = :customerType', { customerType: options.customerType });
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
      where: { id },
      relations: ['sales'],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCustomerSalesHistory(customerId: string): Promise<any[]> {
    const customer = await this.repository.findOne({
      where: { id: customerId },
      relations: ['sales', 'sales.items', 'sales.items.product'],
    });

    return customer?.sales || [];
  }
}
