import { BaseService } from './BaseService';
import { Store } from '../entities/Store';
import { CreateStoreDto } from '../dtos/CreateStoreDto';
import { UpdateStoreDto } from '../dtos/UpdateStoreDto';

export class StoreService extends BaseService<Store, CreateStoreDto, UpdateStoreDto> {
  constructor() {
    super(Store, CreateStoreDto, UpdateStoreDto, ['name', 'address']);
  }

  async findById(id: string): Promise<Store | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['stocks', 'employees', 'sales', 'purchases'],
    });
  }

  async getStoresByType(type: string): Promise<Store[]> {
    return await this.repository.find({
      where: { type } as any,
    });
  }

  async getStorePerformance(storeId: string, startDate: string, endDate: string): Promise<any> {
    const store = await this.repository.findOne({
      where: { id: storeId },
      relations: ['sales', 'purchases'],
    });

    if (!store) {
      throw new Error('Store not found');
    }

    const sales = store.sales.filter(sale => 
      sale.saleDate >= startDate && sale.saleDate <= endDate
    );

    const purchases = store.purchases.filter(purchase => 
      purchase.purchaseDate >= startDate && purchase.purchaseDate <= endDate
    );

    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

    return {
      store,
      totalSales,
      totalPurchases,
      profit: totalSales - totalPurchases,
      salesCount: sales.length,
      purchasesCount: purchases.length,
    };
  }
}