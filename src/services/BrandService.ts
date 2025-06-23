import { BaseService } from './BaseService';
import { Brand } from '../entities/Brand';
import { CreateBrandDto } from '../dtos/CreateBrandDto';
import { UpdateBrandDto } from '../dtos/UpdateBrandDto';

type BrandWithProductCount = {
  id: string;
  name: string;
  description: string;
  productCount: number;
};

export class BrandService extends BaseService<Brand, CreateBrandDto, UpdateBrandDto> {
  constructor() {
    super(Brand, CreateBrandDto, UpdateBrandDto, ['name', 'description'])
  }

  async findById(id: string): Promise<Brand | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['products'],
    })
  }

  async getBrandsWithProductCount(): Promise<BrandWithProductCount[]> {
    return await this.repository
      .createQueryBuilder('brand')
      .leftJoin('brand.products', 'product')
      .select(['brand.*', 'COUNT(product.id) as productCount'])
      .groupBy('brand.id')
      .getRawMany()
  }
}
