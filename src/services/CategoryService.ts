import { BaseService } from './BaseService';
import { Category } from '../entities/Category';
import { CreateCategoryDto } from '../dtos/CreateCategoryDto';
import { UpdateCategoryDto } from '../dtos/UpdateCategoryDto';

export class CategoryService extends BaseService<Category, CreateCategoryDto, UpdateCategoryDto> {
  constructor() {
    super(Category, CreateCategoryDto, UpdateCategoryDto, ['name', 'description']);
  }

  async findById(id: string): Promise<Category | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['subcategories'],
    });
  }

  async getCategoriesWithSubcategories(): Promise<Category[]> {
    return await this.repository.find({
      relations: ['subcategories'],
    });
  }

  async getActiveCategories(): Promise<Category[]> {
    return await this.repository.find({
      where: { status: 'Active' },
      relations: ['subcategories'],
    });
  }
}