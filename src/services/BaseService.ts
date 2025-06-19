/* eslint-disable @typescript-eslint/no-explicit-any */
import { Repository, type FindManyOptions, type FindOneOptions, type DeepPartial, type ObjectLiteral } from 'typeorm';
import { getDataSource } from '../config/database';
import { plainToClass, type ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchOptions {
  query?: string;
  fields?: string[];
}

export class BaseService<Entity extends ObjectLiteral, CreateDto, UpdateDto> {
  protected repository: Repository<Entity>;
  protected entityClass: ClassConstructor<Entity>;
  protected createDtoClass: ClassConstructor<CreateDto>;
  protected updateDtoClass: ClassConstructor<UpdateDto>;
  protected searchableFields: string[];

  constructor(
    entityClass: ClassConstructor<Entity>,
    createDtoClass: ClassConstructor<CreateDto>,
    updateDtoClass: ClassConstructor<UpdateDto>,
    searchableFields: string[] = []
  ) {
    this.entityClass = entityClass;
    this.createDtoClass = createDtoClass;
    this.updateDtoClass = updateDtoClass;
    this.searchableFields = searchableFields;
    this.repository = getDataSource().getRepository(entityClass);
  }

  /**
   * Create a new entity
   */
  async create(createDto: CreateDto): Promise<Entity> {
    // Validate DTO
    const dto = plainToClass(this.createDtoClass, createDto);
    const errors = await validate(dto as any);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    const entity = this.repository.create(createDto as any);
    return await this.repository.save(entity as any as DeepPartial<Entity>);
  }

  /**
   * Find all entities with optional pagination and search
   */
  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Entity>
  ): Promise<PaginatedResult<Entity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let queryBuilder = this.repository.createQueryBuilder('entity');

    // Apply search if provided
    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const searchConditions = searchFields.map(field =>
        `entity.${field} ILIKE :query`
      ).join(' OR ');

      queryBuilder = queryBuilder.where(`(${searchConditions})`, {
        query: `%${options.query}%`
      });
    }

    // Apply sorting
    if (options?.sortBy) {
      queryBuilder = queryBuilder.orderBy(
        `entity.${options.sortBy}`,
        options.sortOrder || 'ASC'
      );
    } else {
      queryBuilder = queryBuilder.orderBy('entity.createdAt', 'DESC');
    }

    // Apply additional find options
    if (Array.isArray(findOptions?.relations)) {
      findOptions.relations.forEach(relation => {
        queryBuilder = queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      });
    }

    // Get total count and data
    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find entity by ID
   */
  async findById(id: string, options?: FindOneOptions<Entity>): Promise<Entity | null> {
    return await this.repository.findOne({
      where: { id } as any,
      ...options,
    });
  }

  /**
   * Update entity by ID
   */
  async update(id: string, updateDto: UpdateDto): Promise<Entity> {
    // Validate DTO
    const dto = plainToClass(this.updateDtoClass, updateDto);
    const errors = await validate(dto as any);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }

    await this.repository.update(id, updateDto as any);
    return await this.findById(id) as Entity;
  }

  /**
   * Delete entity by ID (soft delete)
   */
  async delete(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }

    await this.repository.softDelete(id);
  }

  /**
   * Restore soft deleted entity
   */
  async restore(id: string): Promise<Entity> {
    await this.repository.restore(id);
    return await this.findById(id) as Entity;
  }

  /**
   * Hard delete entity
   */
  async hardDelete(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }

    await this.repository.delete(id);
  }

  /**
   * Count entities
   */
  async count(options?: SearchOptions): Promise<number> {
    let queryBuilder = this.repository.createQueryBuilder('entity');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const searchConditions = searchFields.map(field =>
        `entity.${field} ILIKE :query`
      ).join(' OR ');

      queryBuilder = queryBuilder.where(`(${searchConditions})`, {
        query: `%${options.query}%`
      });
    }

    return await queryBuilder.getCount();
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as any });
    return count > 0;
  }

  /**
   * Bulk create entities
   */
  async bulkCreate(createDtos: CreateDto[]): Promise<Entity[]> {
    const entities = createDtos.map(dto => this.repository.create(dto as any));
    return await this.repository.save(entities as DeepPartial<Entity>[]) as Entity[];
  }

  /**
   * Bulk update entities
   */
  async bulkUpdate(updates: Array<{ id: string; data: Partial<UpdateDto> }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, data }) => this.repository.update(id, data as any))
    );
  }

  /**
   * Bulk delete entities
   */
  async bulkDelete(ids: string[]): Promise<void> {
    await this.repository.softDelete(ids);
  }

  /**
   * Find entities by field value
   */
  async findByField(field: string, value: any): Promise<Entity[]> {
    return await this.repository.find({
      where: { [field]: value } as any,
    });
  }

  /**
   * Find one entity by field value
   */
  async findOneByField(field: string, value: any): Promise<Entity | null> {
    return await this.repository.findOne({
      where: { [field]: value } as any,
    });
  }

  /**
   * Get repository for advanced queries
   */
  getRepository(): Repository<Entity> {
    return this.repository;
  }
}
