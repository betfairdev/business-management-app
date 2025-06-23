/* eslint-disable @typescript-eslint/no-explicit-any */
import { Repository, type FindManyOptions, type FindOneOptions, type DeepPartial, type ObjectLiteral } from 'typeorm';
import { getDataSource } from '../../config/database';
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

export abstract class BaseService<Entity extends ObjectLiteral, CreateDto, UpdateDto> {
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

  async create(createDto: CreateDto): Promise<Entity> {
    const dto = plainToClass(this.createDtoClass, createDto);
    const errors = await validate(dto as any);

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => Object.values(e.constraints || {}).join(', ')).join('; ')}`);
    }

    const entity = this.repository.create(createDto as any);
    return await this.repository.save(entity as any as DeepPartial<Entity>);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Entity>
  ): Promise<PaginatedResult<Entity>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

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

    if (options?.sortBy) {
      queryBuilder = queryBuilder.orderBy(
        `entity.${options.sortBy}`,
        options.sortOrder || 'ASC'
      );
    } else {
      queryBuilder = queryBuilder.orderBy('entity.createdAt', 'DESC');
    }

    if (Array.isArray(findOptions?.relations)) {
      findOptions.relations.forEach(relation => {
        queryBuilder = queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      });
    }

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

  async findById(id: string, options?: FindOneOptions<Entity>): Promise<Entity | null> {
    return await this.repository.findOne({
      where: { id } as any,
      ...options,
    });
  }

  async update(id: string, updateDto: UpdateDto): Promise<Entity> {
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

  async delete(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    await this.repository.softDelete(id);
  }

  async restore(id: string): Promise<Entity> {
    await this.repository.restore(id);
    return await this.findById(id) as Entity;
  }

  async hardDelete(id: string): Promise<void> {
    const entity = await this.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }
    await this.repository.delete(id);
  }

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

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } as any });
    return count > 0;
  }

  async bulkCreate(createDtos: CreateDto[]): Promise<Entity[]> {
    const entities = createDtos.map(dto => this.repository.create(dto as any));
    return await this.repository.save(entities as DeepPartial<Entity>[]) as Entity[];
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<UpdateDto> }>): Promise<void> {
    await Promise.all(
      updates.map(({ id, data }) => this.repository.update(id, data as any))
    );
  }

  async bulkDelete(ids: string[]): Promise<void> {
    await this.repository.softDelete(ids);
  }

  async findByField(field: string, value: any): Promise<Entity[]> {
    return await this.repository.find({
      where: { [field]: value } as any,
    });
  }

  async findOneByField(field: string, value: any): Promise<Entity | null> {
    return await this.repository.findOne({
      where: { [field]: value } as any,
    });
  }

  getRepository(): Repository<Entity> {
    return this.repository;
  }
}