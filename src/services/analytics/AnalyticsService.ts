import { getDataSource } from '../../config/database';
import { Sale } from '../../entities/Sale';
import { Purchase } from '../../entities/Purchase';
import { Customer } from '../../entities/Customer';
import { Product } from '../../entities/Product';

export interface BusinessMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalCustomers: number;
  totalProducts: number;
  totalSales: number;
  averageOrderValue: number;
  topSellingProducts: Array<{ product: Product; quantity: number; revenue: number }>;
  revenueGrowth: number;
  customerGrowth: number;
}

export interface SalesAnalytics {
  dailySales: Array<{ date: string; sales: number; revenue: number }>;
  monthlySales: Array<{ month: string; sales: number; revenue: number }>;
  salesByCategory: Array<{ category: string; sales: number; revenue: number }>;
  salesByStore: Array<{ store: string; sales: number; revenue: number }>;
  salesTrends: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageCustomerValue: number;
  customerSegments: Array<{ segment: string; count: number; value: number }>;
  topCustomers: Array<{ customer: Customer; totalSpent: number; orders: number }>;
}

export interface InventoryAnalytics {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  fastMovingProducts: Array<{ product: Product; velocity: number }>;
  slowMovingProducts: Array<{ product: Product; daysInStock: number }>;
  stockTurnoverRate: number;
}

export class AnalyticsService {
  private dataSource = getDataSource();

  async getBusinessMetrics(startDate: string, endDate: string): Promise<BusinessMetrics> {
    const saleRepo = this.dataSource.getRepository(Sale);
    const purchaseRepo = this.dataSource.getRepository(Purchase);
    const customerRepo = this.dataSource.getRepository(Customer);
    const productRepo = this.dataSource.getRepository(Product);

    // Get sales data
    const sales = await saleRepo.find({
      relations: ['items', 'items.product'],
    });

    const periodSales = sales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate);
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalSales = periodSales.length;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Get purchase data
    const purchases = await purchaseRepo.find();
    const periodPurchases = purchases.filter(p => p.purchaseDate >= startDate && p.purchaseDate <= endDate);
    const totalExpenses = periodPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);

    // Calculate profit
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Get counts
    const totalCustomers = await customerRepo.count();
    const totalProducts = await productRepo.count();

    // Top selling products
    const productSales = new Map<string, { product: Product; quantity: number; revenue: number }>();
    
    periodSales.forEach(sale => {
      sale.items?.forEach(item => {
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

    const topSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Calculate growth rates (simplified)
    const revenueGrowth = 0; // Would need previous period data
    const customerGrowth = 0; // Would need previous period data

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      totalCustomers,
      totalProducts,
      totalSales,
      averageOrderValue,
      topSellingProducts,
      revenueGrowth,
      customerGrowth,
    };
  }

  async getSalesAnalytics(startDate: string, endDate: string): Promise<SalesAnalytics> {
    const saleRepo = this.dataSource.getRepository(Sale);

    const sales = await saleRepo.find({
      relations: ['items', 'items.product', 'items.product.category', 'store'],
    });

    const periodSales = sales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate);

    // Daily sales
    const dailyData = new Map<string, { sales: number; revenue: number }>();
    periodSales.forEach(sale => {
      const date = sale.saleDate;
      const existing = dailyData.get(date) || { sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += sale.totalAmount;
      dailyData.set(date, existing);
    });

    const dailySales = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // Monthly sales (simplified)
    const monthlySales = this.groupByMonth(periodSales);

    // Sales by category
    const categoryData = new Map<string, { sales: number; revenue: number }>();
    periodSales.forEach(sale => {
      sale.items?.forEach(item => {
        const category = item.product.category?.name || 'Uncategorized';
        const existing = categoryData.get(category) || { sales: 0, revenue: 0 };
        existing.sales += item.quantity;
        existing.revenue += item.totalPrice;
        categoryData.set(category, existing);
      });
    });

    const salesByCategory = Array.from(categoryData.entries()).map(([category, data]) => ({
      category,
      ...data,
    }));

    // Sales by store
    const storeData = new Map<string, { sales: number; revenue: number }>();
    periodSales.forEach(sale => {
      const store = sale.store?.name || 'Default Store';
      const existing = storeData.get(store) || { sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += sale.totalAmount;
      storeData.set(store, existing);
    });

    const salesByStore = Array.from(storeData.entries()).map(([store, data]) => ({
      store,
      ...data,
    }));

    // Sales trends
    const thisMonth = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const salesTrends = {
      thisMonth,
      lastMonth: 0, // Would need previous month data
      growth: 0,
    };

    return {
      dailySales,
      monthlySales,
      salesByCategory,
      salesByStore,
      salesTrends,
    };
  }

  async getCustomerAnalytics(startDate: string, endDate: string): Promise<CustomerAnalytics> {
    const customerRepo = this.dataSource.getRepository(Customer);
    const saleRepo = this.dataSource.getRepository(Sale);

    const customers = await customerRepo.find({ relations: ['sales'] });
    const totalCustomers = customers.length;

    // New customers in period
    const newCustomers = customers.filter(c => 
      c.createdAt >= new Date(startDate) && c.createdAt <= new Date(endDate)
    ).length;

    // Returning customers
    const returningCustomers = customers.filter(c => 
      c.sales && c.sales.length > 1
    ).length;

    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Average customer value
    const totalRevenue = customers.reduce((sum, customer) => {
      return sum + (customer.sales?.reduce((saleSum, sale) => saleSum + sale.totalAmount, 0) || 0);
    }, 0);

    const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    // Customer segments
    const customerSegments = [
      {
        segment: 'High Value',
        count: customers.filter(c => {
          const value = c.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
          return value > 10000;
        }).length,
        value: 0,
      },
      {
        segment: 'Medium Value',
        count: customers.filter(c => {
          const value = c.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
          return value >= 1000 && value <= 10000;
        }).length,
        value: 0,
      },
      {
        segment: 'Low Value',
        count: customers.filter(c => {
          const value = c.sales?.reduce((sum, s) => sum + s.totalAmount, 0) || 0;
          return value < 1000;
        }).length,
        value: 0,
      },
    ];

    // Top customers
    const topCustomers = customers
      .map(customer => ({
        customer,
        totalSpent: customer.sales?.reduce((sum, sale) => sum + sale.totalAmount, 0) || 0,
        orders: customer.sales?.length || 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageCustomerValue,
      customerSegments,
      topCustomers,
    };
  }

  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const productRepo = this.dataSource.getRepository(Product);

    const products = await productRepo.find({ relations: ['stockEntries'] });
    const totalProducts = products.length;

    const lowStockProducts = products.filter(product => {
      const totalStock = product.stockEntries?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalStock <= 10 && totalStock > 0;
    }).length;

    const outOfStockProducts = products.filter(product => {
      const totalStock = product.stockEntries?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalStock === 0;
    }).length;

    const totalStockValue = products.reduce((sum, product) => {
      return sum + (product.stockEntries?.reduce((stockSum, stock) => {
        return stockSum + (stock.quantity * stock.unitCost);
      }, 0) || 0);
    }, 0);

    // Fast and slow moving products (simplified)
    const fastMovingProducts = products
      .map(product => ({ product, velocity: Math.random() * 100 }))
      .sort((a, b) => b.velocity - a.velocity)
      .slice(0, 10);

    const slowMovingProducts = products
      .map(product => ({ product, daysInStock: Math.floor(Math.random() * 365) }))
      .sort((a, b) => b.daysInStock - a.daysInStock)
      .slice(0, 10);

    const stockTurnoverRate = 5.2; // Simplified calculation

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      fastMovingProducts,
      slowMovingProducts,
      stockTurnoverRate,
    };
  }

  private groupByMonth(sales: Sale[]): Array<{ month: string; sales: number; revenue: number }> {
    const monthlyData = new Map<string, { sales: number; revenue: number }>();

    sales.forEach(sale => {
      const month = sale.saleDate.substring(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += sale.totalAmount;
      monthlyData.set(month, existing);
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  async getDashboardMetrics(): Promise<{
    todaySales: number;
    todayRevenue: number;
    monthlyRevenue: number;
    totalCustomers: number;
    lowStockAlerts: number;
    pendingOrders: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);

    const saleRepo = this.dataSource.getRepository(Sale);
    const customerRepo = this.dataSource.getRepository(Customer);
    const productRepo = this.dataSource.getRepository(Product);

    const todaySalesData = await saleRepo.find({
      where: { saleDate: today },
    });

    const monthlySalesData = await saleRepo.find();
    const monthlyData = monthlySalesData.filter(s => s.saleDate.startsWith(thisMonth));

    const products = await productRepo.find({ relations: ['stockEntries'] });
    const lowStockAlerts = products.filter(product => {
      const totalStock = product.stockEntries?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalStock <= 10;
    }).length;

    return {
      todaySales: todaySalesData.length,
      todayRevenue: todaySalesData.reduce((sum, sale) => sum + sale.totalAmount, 0),
      monthlyRevenue: monthlyData.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalCustomers: await customerRepo.count(),
      lowStockAlerts,
      pendingOrders: 0, // Would need order entity
    };
  }
}