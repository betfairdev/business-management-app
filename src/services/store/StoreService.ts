import { BaseService } from '../core/BaseService';
import { Store, StoreType } from '../../entities/Store';
import { CreateStoreDto } from '../../dtos/CreateStoreDto';
import { UpdateStoreDto } from '../../dtos/UpdateStoreDto';
import { getDataSource } from '../../config/database';

export interface StorePerformance {
  store: Store;
  totalSales: number;
  totalRevenue: number;
  totalPurchases: number;
  totalExpenses: number;
  profit: number;
  employeeCount: number;
  stockValue: number;
}

export interface StoreReport {
  totalStores: number;
  storesByType: Array<{ type: string; count: number }>;
  topPerformingStores: Array<{ store: Store; revenue: number }>;
  averageRevenue: number;
}

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

  async getStoresByType(type: StoreType): Promise<Store[]> {
    return await this.repository.find({
      where: { type } as any,
    });
  }

  async getStorePerformance(storeId: string, startDate: string, endDate: string): Promise<StorePerformance> {
    const store = await this.repository.findOne({
      where: { id: storeId },
      relations: ['sales', 'purchases', 'employees', 'stocks'],
    });

    if (!store) {
      throw new Error('Store not found');
    }

    const sales = store.sales?.filter(sale => 
      sale.saleDate >= startDate && sale.saleDate <= endDate
    ) || [];

    const purchases = store.purchases?.filter(purchase => 
      purchase.purchaseDate >= startDate && purchase.purchaseDate <= endDate
    ) || [];

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPurchases = purchases.length;
    const totalExpenses = purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const profit = totalRevenue - totalExpenses;
    const employeeCount = store.employees?.length || 0;
    const stockValue = store.stocks?.reduce((sum, stock) => sum + (stock.quantity * stock.unitCost), 0) || 0;

    return {
      store,
      totalSales,
      totalRevenue,
      totalPurchases,
      totalExpenses,
      profit,
      employeeCount,
      stockValue,
    };
  }

  async getStoreReport(): Promise<StoreReport> {
    const stores = await this.repository.find({ relations: ['sales'] });
    const totalStores = stores.length;

    // Stores by type
    const typeMap = new Map<string, number>();
    stores.forEach(store => {
      const type = store.type || StoreType.RETAIL;
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const storesByType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // Top performing stores
    const storeRevenues = stores.map(store => {
      const revenue = store.sales?.reduce((sum, sale) => sum + sale.totalAmount, 0) || 0;
      return { store, revenue };
    });

    const topPerformingStores = storeRevenues
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const averageRevenue = storeRevenues.length > 0 
      ? storeRevenues.reduce((sum, sr) => sum + sr.revenue, 0) / storeRevenues.length 
      : 0;

    return {
      totalStores,
      storesByType,
      topPerformingStores,
      averageRevenue,
    };
  }

  async transferInventoryBetweenStores(
    fromStoreId: string,
    toStoreId: string,
    items: Array<{ productId: string; quantity: number }>
  ): Promise<void> {
    const dataSource = getDataSource();
    
    await dataSource.transaction(async (manager) => {
      const stockRepo = manager.getRepository('Stock');

      for (const item of items) {
        // Get source stock
        const sourceStock = await stockRepo.findOne({
          where: {
            product: { id: item.productId },
            store: { id: fromStoreId },
          },
        });

        if (!sourceStock || sourceStock.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId} in source store`);
        }

        // Update source stock
        sourceStock.quantity -= item.quantity;
        await stockRepo.save(sourceStock);

        // Get or create destination stock
        let destStock = await stockRepo.findOne({
          where: {
            product: { id: item.productId },
            store: { id: toStoreId },
          },
        });

        if (destStock) {
          destStock.quantity += item.quantity;
        } else {
          destStock = stockRepo.create({
            product: { id: item.productId },
            store: { id: toStoreId },
            quantity: item.quantity,
            unitCost: sourceStock.unitCost,
          });
        }

        await stockRepo.save(destStock);
      }
    });
  }

  async getStoreInventoryValue(storeId: string): Promise<number> {
    const store = await this.repository.findOne({
      where: { id: storeId },
      relations: ['stocks'],
    });

    if (!store) {
      throw new Error('Store not found');
    }

    return store.stocks?.reduce((sum, stock) => sum + (stock.quantity * stock.unitCost), 0) || 0;
  }

  async getStoreEmployees(storeId: string): Promise<any[]> {
    const store = await this.repository.findOne({
      where: { id: storeId },
      relations: ['employees', 'employees.department', 'employees.position'],
    });

    return store?.employees || [];
  }
}