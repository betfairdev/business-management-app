import { DataSource, type FindManyOptions } from 'typeorm';
import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Product } from '../entities/Product';
import { CreateProductDto } from '../dtos/CreateProductDto';
import { UpdateProductDto } from '../dtos/UpdateProductDto';
import { Stock } from '../entities/Stock';
import { Brand } from '../entities/Brand';
import { Category } from '../entities/Category';
import { SubCategory } from '../entities/SubCategory';
import { TaxRate } from '../entities/TaxRate';
import { getDataSource } from '../config/database';

export class ProductService extends BaseService<Product, CreateProductDto, UpdateProductDto> {
  protected dataSource: DataSource;

  constructor() {
    super(Product, CreateProductDto, UpdateProductDto, ['name', 'description', 'sku', 'barcode']);
    this.dataSource = getDataSource();
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Product>
  ): Promise<PaginatedResult<Product>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.subCategory', 'subCategory')
      .leftJoinAndSelect('product.tax', 'tax')
      .leftJoinAndSelect('product.stockEntries', 'stockEntries');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions = searchFields.map(field => `product.${field} ILIKE :query`);
      qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
    }

    if (options?.sortBy) {
      qb = qb.orderBy(`product.${options.sortBy}`, options.sortOrder || 'ASC');
    } else {
      qb = qb.orderBy('product.createdAt', 'DESC');
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

  async findById(id: string): Promise<Product | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['brand', 'category', 'subCategory', 'tax', 'stockEntries', 'batches'],
    });
  }

  async create(createDto: CreateProductDto): Promise<Product> {
    return await this.dataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      
      const productData: any = {
        ...createDto,
        brand: createDto.brand ? { id: createDto.brand } : undefined,
        category: createDto.category ? { id: createDto.category } : undefined,
        subCategory: createDto.subCategory ? { id: createDto.subCategory } : undefined,
        tax: createDto.tax ? { id: createDto.tax } : undefined,
      };

      const product = productRepo.create(productData);
      return await productRepo.save(product);
    });
  }

  async update(id: string, updateDto: UpdateProductDto): Promise<Product> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Product not found');
    }

    const updateData: any = {
      ...updateDto,
      brand: updateDto.brand ? { id: updateDto.brand } : undefined,
      category: updateDto.category ? { id: updateDto.category } : undefined,
      subCategory: updateDto.subCategory ? { id: updateDto.subCategory } : undefined,
      tax: updateDto.tax ? { id: updateDto.tax } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as Product;
  }

  async getProductsWithLowStock(threshold: number = 10): Promise<Product[]> {
    return await this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.stockEntries', 'stock')
      .where('stock.quantity <= :threshold', { threshold })
      .getMany();
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await this.repository.find({
      where: { category: { id: categoryId } },
      relations: ['brand', 'category', 'subCategory', 'stockEntries'],
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.name ILIKE :query OR product.sku ILIKE :query OR product.barcode ILIKE :query', 
        { query: `%${query}%` })
      .getMany();
  }
}