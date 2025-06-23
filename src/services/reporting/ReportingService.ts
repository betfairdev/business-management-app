import { getDataSource } from '../../config/database';
import { Sale } from '../../entities/Sale';
import { Purchase } from '../../entities/Purchase';
import { Expense } from '../../entities/Expense';
import { Income } from '../../entities/Income';
import { Product } from '../../entities/Product';
import { Customer } from '../../entities/Customer';
import { Supplier } from '../../entities/Supplier';

export interface SalesReport {
  period: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: Array<{ product: Product; quantity: number; revenue: number }>;
  topCustomers: Array<{ customer: Customer; orders: number; revenue: number }>;
  salesTrend: Array<{ date: string; sales: number; revenue: number }>;
}

export interface PurchaseReport {
  period: string;
  totalPurchases: number;
  totalAmount: number;
  averageOrderValue: number;
  topSuppliers: Array<{ supplier: Supplier; orders: number; amount: number }>;
  purchaseTrend: Array<{ date: string; purchases: number; amount: number }>;
}

export interface ProfitLossReport {
  period: string;
  revenue: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    costOfGoodsSold: number;
    operatingExpenses: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface CashFlowReport {
  period: string;
  openingBalance: number;
  cashInflows: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  cashOutflows: {
    purchases: number;
    expenses: number;
    total: number;
  };
  netCashFlow: number;
  closingBalance: number;
}

export interface InventoryReport {
  totalProducts: number;
  totalStockValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  fastMovingProducts: Array<{ product: Product; movementRate: number }>;
  slowMovingProducts: Array<{ product: Product; lastMovement: string }>;
}

export class ReportingService {
  private dataSource = getDataSource();

  async getSalesReport(startDate: string, endDate: string): Promise<SalesReport> {
    const saleRepo = this.dataSource.getRepository(Sale);

    const sales = await saleRepo.find({
      where: {
        // saleDate: Between(startDate, endDate)
      },
      relations: ['customer', 'items', 'items.product'],
    });

    const periodSales = sales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate);

    const totalSales = periodSales.length;
    const totalRevenue = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Top products
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

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Top customers
    const customerSales = new Map<string, { customer: Customer; orders: number; revenue: number }>();
    
    periodSales.forEach(sale => {
      if (sale.customer) {
        const existing = customerSales.get(sale.customer.id);
        if (existing) {
          existing.orders += 1;
          existing.revenue += sale.totalAmount;
        } else {
          customerSales.set(sale.customer.id, {
            customer: sale.customer,
            orders: 1,
            revenue: sale.totalAmount,
          });
        }
      }
    });

    const topCustomers = Array.from(customerSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales trend (daily)
    const salesTrend = this.calculateDailySalesTrend(periodSales);

    return {
      period: `${startDate} to ${endDate}`,
      totalSales,
      totalRevenue,
      averageOrderValue,
      topProducts,
      topCustomers,
      salesTrend,
    };
  }

  async getPurchaseReport(startDate: string, endDate: string): Promise<PurchaseReport> {
    const purchaseRepo = this.dataSource.getRepository(Purchase);

    const purchases = await purchaseRepo.find({
      where: {
        // purchaseDate: Between(startDate, endDate)
      },
      relations: ['supplier'],
    });

    const periodPurchases = purchases.filter(p => p.purchaseDate >= startDate && p.purchaseDate <= endDate);

    const totalPurchases = periodPurchases.length;
    const totalAmount = periodPurchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
    const averageOrderValue = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    // Top suppliers
    const supplierPurchases = new Map<string, { supplier: Supplier; orders: number; amount: number }>();
    
    periodPurchases.forEach(purchase => {
      if (purchase.supplier) {
        const existing = supplierPurchases.get(purchase.supplier.id);
        if (existing) {
          existing.orders += 1;
          existing.amount += purchase.totalAmount;
        } else {
          supplierPurchases.set(purchase.supplier.id, {
            supplier: purchase.supplier,
            orders: 1,
            amount: purchase.totalAmount,
          });
        }
      }
    });

    const topSuppliers = Array.from(supplierPurchases.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Purchase trend (daily)
    const purchaseTrend = this.calculateDailyPurchaseTrend(periodPurchases);

    return {
      period: `${startDate} to ${endDate}`,
      totalPurchases,
      totalAmount,
      averageOrderValue,
      topSuppliers,
      purchaseTrend,
    };
  }

  async getProfitLossReport(startDate: string, endDate: string): Promise<ProfitLossReport> {
    const saleRepo = this.dataSource.getRepository(Sale);
    const expenseRepo = this.dataSource.getRepository(Expense);
    const incomeRepo = this.dataSource.getRepository(Income);

    // Revenue
    const sales = await saleRepo.find({
      where: {
        // saleDate: Between(startDate, endDate)
      },
      relations: ['items', 'items.stock'],
    });

    const periodSales = sales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate);
    const salesRevenue = periodSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

    const otherIncomes = await incomeRepo.find({
      where: {
        // date: Between(startDate, endDate)
      },
    });

    const periodIncomes = otherIncomes.filter(i => i.date >= startDate && i.date <= endDate);
    const otherIncomeAmount = periodIncomes.reduce((sum, income) => sum + income.amount, 0);

    const totalRevenue = salesRevenue + otherIncomeAmount;

    // Expenses
    const cogs = periodSales.reduce((sum, sale) => {
      return sum + (sale.items?.reduce((itemSum, item) => {
        return itemSum + ((item.stock?.unitCost || 0) * item.quantity);
      }, 0) || 0);
    }, 0);

    const expenses = await expenseRepo.find({
      where: {
        // date: Between(startDate, endDate)
      },
    });

    const periodExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
    const operatingExpenses = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const totalExpenses = cogs + operatingExpenses;

    const grossProfit = salesRevenue - cogs;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: `${startDate} to ${endDate}`,
      revenue: {
        sales: salesRevenue,
        otherIncome: otherIncomeAmount,
        total: totalRevenue,
      },
      expenses: {
        costOfGoodsSold: cogs,
        operatingExpenses,
        total: totalExpenses,
      },
      grossProfit,
      netProfit,
      profitMargin,
    };
  }

  async getCashFlowReport(startDate: string, endDate: string): Promise<CashFlowReport> {
    const saleRepo = this.dataSource.getRepository(Sale);
    const purchaseRepo = this.dataSource.getRepository(Purchase);
    const expenseRepo = this.dataSource.getRepository(Expense);
    const incomeRepo = this.dataSource.getRepository(Income);

    // Cash inflows
    const sales = await saleRepo.find();
    const periodSales = sales.filter(s => s.saleDate >= startDate && s.saleDate <= endDate);
    const salesCash = periodSales.reduce((sum, sale) => sum + (sale.totalAmount - sale.dueAmount), 0);

    const incomes = await incomeRepo.find();
    const periodIncomes = incomes.filter(i => i.date >= startDate && i.date <= endDate);
    const otherIncome = periodIncomes.reduce((sum, income) => sum + income.amount, 0);

    const totalInflows = salesCash + otherIncome;

    // Cash outflows
    const purchases = await purchaseRepo.find();
    const periodPurchases = purchases.filter(p => p.purchaseDate >= startDate && p.purchaseDate <= endDate);
    const purchasesCash = periodPurchases.reduce((sum, purchase) => sum + (purchase.totalAmount - purchase.dueAmount), 0);

    const expenses = await expenseRepo.find();
    const periodExpenses = expenses.filter(e => e.date >= startDate && e.date <= endDate);
    const expensesCash = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const totalOutflows = purchasesCash + expensesCash;

    const netCashFlow = totalInflows - totalOutflows;

    return {
      period: `${startDate} to ${endDate}`,
      openingBalance: 0, // Would need to calculate from previous period
      cashInflows: {
        sales: salesCash,
        otherIncome,
        total: totalInflows,
      },
      cashOutflows: {
        purchases: purchasesCash,
        expenses: expensesCash,
        total: totalOutflows,
      },
      netCashFlow,
      closingBalance: netCashFlow, // Simplified
    };
  }

  async getInventoryReport(): Promise<InventoryReport> {
    const productRepo = this.dataSource.getRepository(Product);

    const products = await productRepo.find({
      relations: ['stockEntries'],
    });

    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, product) => {
      return sum + (product.stockEntries?.reduce((stockSum, stock) => {
        return stockSum + (stock.quantity * stock.unitCost);
      }, 0) || 0);
    }, 0);

    const lowStockItems = products.filter(product => {
      const totalStock = product.stockEntries?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalStock <= 10;
    }).length;

    const outOfStockItems = products.filter(product => {
      const totalStock = product.stockEntries?.reduce((sum, stock) => sum + stock.quantity, 0) || 0;
      return totalStock === 0;
    }).length;

    return {
      totalProducts,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      fastMovingProducts: [], // Would need movement tracking
      slowMovingProducts: [], // Would need movement tracking
    };
  }

  private calculateDailySalesTrend(sales: Sale[]): Array<{ date: string; sales: number; revenue: number }> {
    const dailyData = new Map<string, { sales: number; revenue: number }>();

    sales.forEach(sale => {
      const date = sale.saleDate;
      const existing = dailyData.get(date) || { sales: 0, revenue: 0 };
      existing.sales += 1;
      existing.revenue += sale.totalAmount;
      dailyData.set(date, existing);
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  private calculateDailyPurchaseTrend(purchases: Purchase[]): Array<{ date: string; purchases: number; amount: number }> {
    const dailyData = new Map<string, { purchases: number; amount: number }>();

    purchases.forEach(purchase => {
      const date = purchase.purchaseDate;
      const existing = dailyData.get(date) || { purchases: 0, amount: 0 };
      existing.purchases += 1;
      existing.amount += purchase.totalAmount;
      dailyData.set(date, existing);
    });

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }
}