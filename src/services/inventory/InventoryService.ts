import { getDataSource } from '../../config/database';
import { Product } from '../../entities/Product';
import { Stock } from '../../entities/Stock';
import { StockAdjustment, AdjustmentType, AdjustmentStatus } from '../../entities/StockAdjustment';
import { StockTransfer, TransferStatus } from '../../entities/StockTransfer';
import { Batch } from '../../entities/Batch';
import { Store } from '../../entities/Store';

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiringItems: number;
  topMovingProducts: Array<{ product: Product; movementCount: number }>;
  slowMovingProducts: Array<{ product: Product; lastMovement: string }>;
}

export interface StockMovement {
  product: Product;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reference: string;
  date: string;
  store?: Store;
}

export interface InventoryValuation {
  product: Product;
  quantity: number;
  unitCost: number;
  totalValue: number;
  lastUpdated: string;
}

export class InventoryService {
  private dataSource = getDataSource();

  async getInventoryReport(): Promise<InventoryReport> {
    const productRepo = this.dataSource.getRepository(Product);
    const stockRepo = this.dataSource.getRepository(Stock);
    const batchRepo = this.dataSource.getRepository(Batch);

    const totalProducts = await productRepo.count({ where: { status: 'Active' } });

    const stocks = await stockRepo.find({
      relations: ['product', 'batch'],
    });

    const totalStockValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.unitCost), 0);
    const lowStockItems = stocks.filter(stock => stock.quantity <= 10).length;
    const outOfStockItems = stocks.filter(stock => stock.quantity === 0).length;

    // Expiring items (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringBatches = await batchRepo
      .createQueryBuilder('batch')
      .where('batch.expiryDate <= :date', { date: thirtyDaysFromNow.toISOString().split('T')[0] })
      .andWhere('batch.expiryDate IS NOT NULL')
      .getCount();

    return {
      totalProducts,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      expiringItems: expiringBatches,
      topMovingProducts: [], // Would need movement tracking
      slowMovingProducts: [], // Would need movement tracking
    };
  }

  async adjustStock(data: {
    productId: string;
    storeId?: string;
    adjustmentType: AdjustmentType;
    quantity: number;
    reason: string;
    notes?: string;
  }): Promise<StockAdjustment> {
    return await this.dataSource.transaction(async (manager) => {
      const adjustmentRepo = manager.getRepository(StockAdjustment);
      const stockRepo = manager.getRepository(Stock);

      // Create adjustment record
      const adjustment = adjustmentRepo.create({
        product: { id: data.productId },
        store: data.storeId ? { id: data.storeId } : undefined,
        adjustmentType: data.adjustmentType,
        quantityChange: data.quantity,
        reason: data.reason,
        notes: data.notes,
        status: AdjustmentStatus.DONE,
      } as any);

      const savedAdjustment = await adjustmentRepo.save(adjustment);

      // Update stock
      const stockQuery: any = { product: { id: data.productId } };
      if (data.storeId) stockQuery.store = { id: data.storeId };

      const stock = await stockRepo.findOne({ where: stockQuery });

      if (stock) {
        if (data.adjustmentType === AdjustmentType.INCREASE) {
          stock.quantity += data.quantity;
        } else {
          stock.quantity = Math.max(0, stock.quantity - data.quantity);
        }
        await stockRepo.save(stock);
      }

      return savedAdjustment;
    });
  }

  async transferStock(data: {
    productId: string;
    fromStoreId: string;
    toStoreId: string;
    quantity: number;
    notes?: string;
  }): Promise<StockTransfer> {
    return await this.dataSource.transaction(async (manager) => {
      const transferRepo = manager.getRepository(StockTransfer);
      const stockRepo = manager.getRepository(Stock);

      // Check source stock
      const sourceStock = await stockRepo.findOne({
        where: {
          product: { id: data.productId },
          store: { id: data.fromStoreId },
        },
      });

      if (!sourceStock || sourceStock.quantity < data.quantity) {
        throw new Error('Insufficient stock in source store');
      }

      // Create transfer record
      const transfer = transferRepo.create({
        product: { id: data.productId },
        fromStore: { id: data.fromStoreId },
        toStore: { id: data.toStoreId },
        quantity: data.quantity,
        status: TransferStatus.COMPLETED,
        notes: data.notes,
      } as any);

      const savedTransfer = await transferRepo.save(transfer);

      // Update source stock
      sourceStock.quantity -= data.quantity;
      await stockRepo.save(sourceStock);

      // Update or create destination stock
      const destStock = await stockRepo.findOne({
        where: {
          product: { id: data.productId },
          store: { id: data.toStoreId },
        },
      });

      if (destStock) {
        destStock.quantity += data.quantity;
        await stockRepo.save(destStock);
      } else {
        const newStock = stockRepo.create({
          product: { id: data.productId },
          store: { id: data.toStoreId },
          quantity: data.quantity,
          unitCost: sourceStock.unitCost,
        } as any);
        await stockRepo.save(newStock);
      }

      return savedTransfer;
    });
  }

  async getLowStockItems(threshold: number = 10): Promise<Stock[]> {
    const stockRepo = this.dataSource.getRepository(Stock);

    return await stockRepo.find({
      where: {
        // quantity: LessThanOrEqual(threshold)
      },
      relations: ['product', 'store'],
    });
  }

  async getExpiringItems(days: number = 30): Promise<Batch[]> {
    const batchRepo = this.dataSource.getRepository(Batch);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return await batchRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.products', 'products')
      .leftJoinAndSelect('batch.stockEntries', 'stockEntries')
      .where('batch.expiryDate <= :date', { date: futureDate.toISOString().split('T')[0] })
      .andWhere('batch.expiryDate IS NOT NULL')
      .getMany();
  }

  async getStockMovements(productId?: string, storeId?: string, startDate?: string, endDate?: string): Promise<StockMovement[]> {
    // This would require a dedicated StockMovement entity to track all movements
    // For now, return empty array
    return [];
  }

  async getInventoryValuation(storeId?: string): Promise<InventoryValuation[]> {
    const stockRepo = this.dataSource.getRepository(Stock);

    let query = stockRepo.createQueryBuilder('stock')
      .leftJoinAndSelect('stock.product', 'product');

    if (storeId) {
      query = query.where('stock.store.id = :storeId', { storeId });
    }

    const stocks = await query.getMany();

    return stocks.map(stock => ({
      product: stock.product,
      quantity: stock.quantity,
      unitCost: stock.unitCost,
      totalValue: stock.quantity * stock.unitCost,
      lastUpdated: stock.updatedAt.toISOString().split('T')[0],
    }));
  }

  async performStockCount(data: {
    storeId?: string;
    items: Array<{
      productId: string;
      countedQuantity: number;
    }>;
  }): Promise<StockAdjustment[]> {
    const adjustments: StockAdjustment[] = [];

    for (const item of data.items) {
      const stockRepo = this.dataSource.getRepository(Stock);
      
      const stockQuery: any = { product: { id: item.productId } };
      if (data.storeId) stockQuery.store = { id: data.storeId };

      const stock = await stockRepo.findOne({ where: stockQuery });

      if (stock) {
        const difference = item.countedQuantity - stock.quantity;
        
        if (difference !== 0) {
          const adjustmentType = difference > 0 ? AdjustmentType.INCREASE : AdjustmentType.DECREASE;
          
          const adjustment = await this.adjustStock({
            productId: item.productId,
            storeId: data.storeId,
            adjustmentType,
            quantity: Math.abs(difference),
            reason: 'Stock Count Adjustment',
            notes: `Physical count: ${item.countedQuantity}, System count: ${stock.quantity}`,
          });

          adjustments.push(adjustment);
        }
      }
    }

    return adjustments;
  }

  async getStockByProduct(productId: string): Promise<Stock[]> {
    const stockRepo = this.dataSource.getRepository(Stock);

    return await stockRepo.find({
      where: { product: { id: productId } },
      relations: ['product', 'store', 'batch'],
    });
  }

  async getStockByStore(storeId: string): Promise<Stock[]> {
    const stockRepo = this.dataSource.getRepository(Stock);

    return await stockRepo.find({
      where: { store: { id: storeId } },
      relations: ['product', 'store', 'batch'],
    });
  }
}