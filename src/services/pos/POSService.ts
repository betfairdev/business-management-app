import { getDataSource } from '../../config/database';
import { Sale, SaleStatus } from '../../entities/Sale';
import { SaleProduct } from '../../entities/SaleProduct';
import { Product } from '../../entities/Product';
import { Stock } from '../../entities/Stock';
import { Customer } from '../../entities/Customer';
import { PaymentMethod } from '../../entities/PaymentMethod';

export interface POSTransaction {
  id: string;
  items: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    stock: Stock;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customer?: Customer;
  paymentMethod?: PaymentMethod;
  status: 'Draft' | 'Completed' | 'Cancelled';
}

export interface POSReport {
  totalSales: number;
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: Array<{ product: Product; quantity: number; revenue: number }>;
  hourlyBreakdown: Array<{ hour: number; sales: number; revenue: number }>;
}

export class POSService {
  private dataSource = getDataSource();

  async createTransaction(): Promise<POSTransaction> {
    return {
      id: `POS-${Date.now()}`,
      items: [],
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
      status: 'Draft',
    };
  }

  async addItemToTransaction(
    transaction: POSTransaction,
    productId: string,
    quantity: number,
    stockId: string
  ): Promise<POSTransaction> {
    const productRepo = this.dataSource.getRepository(Product);
    const stockRepo = this.dataSource.getRepository(Stock);

    const product = await productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    const stock = await stockRepo.findOne({
      where: { id: stockId },
    });

    if (!stock) {
      throw new Error('Stock not found');
    }

    if (stock.quantity < quantity) {
      throw new Error('Insufficient stock');
    }

    const unitPrice = product.mrpPrice;
    const totalPrice = unitPrice * quantity;

    // Check if item already exists in transaction
    const existingItemIndex = transaction.items.findIndex(
      item => item.product.id === productId && item.stock.id === stockId
    );

    if (existingItemIndex >= 0) {
      transaction.items[existingItemIndex].quantity += quantity;
      transaction.items[existingItemIndex].totalPrice += totalPrice;
    } else {
      transaction.items.push({
        product,
        quantity,
        unitPrice,
        totalPrice,
        stock,
      });
    }

    this.calculateTransactionTotals(transaction);
    return transaction;
  }

  async removeItemFromTransaction(
    transaction: POSTransaction,
    productId: string,
    stockId: string
  ): Promise<POSTransaction> {
    transaction.items = transaction.items.filter(
      item => !(item.product.id === productId && item.stock.id === stockId)
    );

    this.calculateTransactionTotals(transaction);
    return transaction;
  }

  async applyDiscount(
    transaction: POSTransaction,
    discountAmount: number
  ): Promise<POSTransaction> {
    transaction.discount = discountAmount;
    this.calculateTransactionTotals(transaction);
    return transaction;
  }

  async processPayment(
    transaction: POSTransaction,
    paymentMethodId: number,
    customerId?: string
  ): Promise<Sale> {
    if (transaction.items.length === 0) {
      throw new Error('No items in transaction');
    }

    return await this.dataSource.transaction(async (manager) => {
      const saleRepo = manager.getRepository(Sale);
      const saleProductRepo = manager.getRepository(SaleProduct);
      const stockRepo = manager.getRepository(Stock);

      // Create sale
      const sale = saleRepo.create({
        saleDate: new Date().toISOString().split('T')[0],
        customer: customerId ? { id: customerId } : undefined,
        subTotal: transaction.subtotal,
        discount: transaction.discount,
        taxAmount: transaction.tax,
        totalAmount: transaction.total,
        dueAmount: 0, // POS sales are typically paid in full
        paymentMethod: { id: paymentMethodId },
        status: SaleStatus.PAID,
        invoiceNumber: `INV-${Date.now()}`,
      } as any);

      const savedSale = await saleRepo.save(sale);

      // Create sale products and update stock
      for (const item of transaction.items) {
        const saleProduct = saleProductRepo.create({
          sale: savedSale,
          product: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          stock: item.stock,
        } as any);

        await saleProductRepo.save(saleProduct);

        // Update stock
        const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
        if (stock) {
          stock.quantity -= item.quantity;
          await stockRepo.save(stock);
        }
      }

      return await saleRepo.findOne({
        where: { id: savedSale.id },
        relations: ['customer', 'paymentMethod', 'items', 'items.product'],
      }) as Sale;
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    const productRepo = this.dataSource.getRepository(Product);

    return await productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.stockEntries', 'stock')
      .where('product.name ILIKE :query OR product.sku ILIKE :query OR product.barcode ILIKE :query', 
        { query: `%${query}%` })
      .andWhere('product.status = :status', { status: 'Active' })
      .getMany();
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const productRepo = this.dataSource.getRepository(Product);

    return await productRepo.findOne({
      where: { barcode },
      relations: ['stockEntries'],
    });
  }

  async getPOSReport(date: string): Promise<POSReport> {
    const saleRepo = this.dataSource.getRepository(Sale);

    const sales = await saleRepo.find({
      where: { saleDate: date },
      relations: ['items', 'items.product'],
    });

    const totalTransactions = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Calculate top products
    const productSales = new Map<string, { product: Product; quantity: number; revenue: number }>();

    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = productSales.get(item.product.id);
        if (existing) {
          existing.quantity += item.quantity;
          existing.revenue += item.totalPrice;
        } else {
          productSales.set(item.product.id, {
            product: item.product,
            quantity: item.quantity,
            revenue: item.totalPrice,
          });
        }
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Hourly breakdown (simplified)
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      revenue: 0,
    }));

    return {
      totalSales: totalTransactions,
      totalRevenue,
      totalTransactions,
      averageTransactionValue,
      topProducts,
      hourlyBreakdown,
    };
  }

  async holdTransaction(transaction: POSTransaction): Promise<string> {
    // Store transaction in temporary storage (could use localStorage or database)
    const holdId = `HOLD-${Date.now()}`;
    localStorage.setItem(`pos_hold_${holdId}`, JSON.stringify(transaction));
    return holdId;
  }

  async retrieveHeldTransaction(holdId: string): Promise<POSTransaction | null> {
    const stored = localStorage.getItem(`pos_hold_${holdId}`);
    return stored ? JSON.parse(stored) : null;
  }

  async voidTransaction(saleId: string, reason: string): Promise<void> {
    const saleRepo = this.dataSource.getRepository(Sale);
    const stockRepo = this.dataSource.getRepository(Stock);

    await this.dataSource.transaction(async (manager) => {
      const sale = await manager.getRepository(Sale).findOne({
        where: { id: saleId },
        relations: ['items', 'items.stock'],
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      // Restore stock quantities
      for (const item of sale.items) {
        if (item.stock) {
          const stock = await stockRepo.findOne({ where: { id: item.stock.id } });
          if (stock) {
            stock.quantity += item.quantity;
            await manager.getRepository(Stock).save(stock);
          }
        }
      }

      // Update sale status
      await manager.getRepository(Sale).update(saleId, {
        status: SaleStatus.CANCELLED,
        notes: `Voided: ${reason}`,
      } as any);
    });
  }

  private calculateTransactionTotals(transaction: POSTransaction): void {
    transaction.subtotal = transaction.items.reduce((sum, item) => sum + item.totalPrice, 0);
    transaction.tax = (transaction.subtotal - transaction.discount) * 0.1; // 10% tax
    transaction.total = transaction.subtotal - transaction.discount + transaction.tax;
  }
}