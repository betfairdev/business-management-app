import { getDataSource } from '../../config/database';
import { Account, AccountType } from '../../entities/Account';
import { JournalEntry } from '../../entities/JournalEntry';
import { Sale } from '../../entities/Sale';
import { Purchase } from '../../entities/Purchase';
import { Expense } from '../../entities/Expense';
import { Income } from '../../entities/Income';

export interface TrialBalance {
  account: Account;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

export interface ProfitLossReport {
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueBreakdown: Array<{ category: string; amount: number }>;
  expenseBreakdown: Array<{ category: string; amount: number }>;
}

export interface BalanceSheetReport {
  assets: Array<{ account: string; amount: number }>;
  liabilities: Array<{ account: string; amount: number }>;
  equity: Array<{ account: string; amount: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface CashFlowReport {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

export class AccountingService {
  private dataSource = getDataSource();

  async createJournalEntry(
    date: string,
    refType: string,
    refId: string,
    debitAccountId: string,
    creditAccountId: string,
    amount: number,
    description?: string,
    transactionReference?: string
  ): Promise<JournalEntry> {
    const journalRepo = this.dataSource.getRepository(JournalEntry);
    
    const entry = journalRepo.create({
      date,
      refType,
      refId,
      debitAccountId,
      creditAccountId,
      amount,
      description,
      transactionReference,
    });

    return await journalRepo.save(entry);
  }

  async recordSaleTransaction(sale: Sale): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const journalRepo = manager.getRepository(JournalEntry);

      // Debit: Accounts Receivable or Cash
      // Credit: Sales Revenue
      const salesEntry = journalRepo.create({
        date: sale.saleDate,
        refType: 'SALE',
        refId: sale.id,
        debitAccountId: 'accounts-receivable', // Should be actual account ID
        creditAccountId: 'sales-revenue', // Should be actual account ID
        amount: sale.totalAmount,
        description: `Sale ${sale.invoiceNumber}`,
        transactionReference: sale.invoiceNumber,
      });

      await journalRepo.save(salesEntry);

      // Record COGS if applicable
      if (sale.items && sale.items.length > 0) {
        const cogs = sale.items.reduce((total, item) => {
          return total + (item.stock?.unitCost || 0) * item.quantity;
        }, 0);

        if (cogs > 0) {
          const cogsEntry = journalRepo.create({
            date: sale.saleDate,
            refType: 'SALE_COGS',
            refId: sale.id,
            debitAccountId: 'cost-of-goods-sold',
            creditAccountId: 'inventory',
            amount: cogs,
            description: `COGS for Sale ${sale.invoiceNumber}`,
            transactionReference: sale.invoiceNumber,
          });

          await journalRepo.save(cogsEntry);
        }
      }
    });
  }

  async recordPurchaseTransaction(purchase: Purchase): Promise<void> {
    const journalRepo = this.dataSource.getRepository(JournalEntry);

    // Debit: Inventory or Expense
    // Credit: Accounts Payable or Cash
    const entry = journalRepo.create({
      date: purchase.purchaseDate,
      refType: 'PURCHASE',
      refId: purchase.id,
      debitAccountId: 'inventory',
      creditAccountId: 'accounts-payable',
      amount: purchase.totalAmount,
      description: `Purchase ${purchase.invoiceNumber}`,
      transactionReference: purchase.invoiceNumber,
    });

    await journalRepo.save(entry);
  }

  async recordExpenseTransaction(expense: Expense): Promise<void> {
    const journalRepo = this.dataSource.getRepository(JournalEntry);

    const entry = journalRepo.create({
      date: expense.date,
      refType: 'EXPENSE',
      refId: expense.id.toString(),
      debitAccountId: 'expenses',
      creditAccountId: 'cash',
      amount: expense.amount,
      description: expense.description,
    });

    await journalRepo.save(entry);
  }

  async recordIncomeTransaction(income: Income): Promise<void> {
    const journalRepo = this.dataSource.getRepository(JournalEntry);

    const entry = journalRepo.create({
      date: income.date,
      refType: 'INCOME',
      refId: income.id.toString(),
      debitAccountId: 'cash',
      creditAccountId: 'other-income',
      amount: income.amount,
      description: income.description,
    });

    await journalRepo.save(entry);
  }

  async getTrialBalance(asOfDate?: string): Promise<TrialBalance[]> {
    const accountRepo = this.dataSource.getRepository(Account);
    const journalRepo = this.dataSource.getRepository(JournalEntry);

    const accounts = await accountRepo.find();
    const trialBalance: TrialBalance[] = [];

    for (const account of accounts) {
      let query = journalRepo.createQueryBuilder('je')
        .where('je.debitAccountId = :accountId OR je.creditAccountId = :accountId', { accountId: account.id });

      if (asOfDate) {
        query = query.andWhere('je.date <= :asOfDate', { asOfDate });
      }

      const entries = await query.getMany();

      const debitTotal = entries
        .filter(e => e.debitAccountId === account.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const creditTotal = entries
        .filter(e => e.creditAccountId === account.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const balance = debitTotal - creditTotal;

      trialBalance.push({
        account,
        debitTotal,
        creditTotal,
        balance,
      });
    }

    return trialBalance;
  }

  async getProfitLossReport(startDate: string, endDate: string): Promise<ProfitLossReport> {
    const saleRepo = this.dataSource.getRepository(Sale);
    const expenseRepo = this.dataSource.getRepository(Expense);

    // Get sales revenue
    const salesResult = await saleRepo
      .createQueryBuilder('sale')
      .select('SUM(sale.totalAmount)', 'total')
      .where('sale.saleDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const revenue = Number(salesResult.total) || 0;

    // Get expenses
    const expensesResult = await expenseRepo
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'total')
      .where('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const expenses = Number(expensesResult.total) || 0;

    // Calculate COGS
    const cogsResult = await saleRepo
      .createQueryBuilder('sale')
      .leftJoin('sale.items', 'item')
      .leftJoin('item.stock', 'stock')
      .select('SUM(item.quantity * stock.unitCost)', 'cogs')
      .where('sale.saleDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    const cogs = Number(cogsResult.cogs) || 0;

    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;
    const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      expenses: expenses + cogs,
      grossProfit,
      netProfit,
      profitMargin,
      revenueBreakdown: [{ category: 'Sales', amount: revenue }],
      expenseBreakdown: [
        { category: 'Cost of Goods Sold', amount: cogs },
        { category: 'Operating Expenses', amount: expenses },
      ],
    };
  }

  async getBalanceSheet(asOfDate: string): Promise<BalanceSheetReport> {
    const trialBalance = await this.getTrialBalance(asOfDate);

    const assets = trialBalance
      .filter(tb => tb.account.accountType === AccountType.ASSET)
      .map(tb => ({ account: tb.account.name, amount: tb.balance }));

    const liabilities = trialBalance
      .filter(tb => tb.account.accountType === AccountType.LIABILITY)
      .map(tb => ({ account: tb.account.name, amount: Math.abs(tb.balance) }));

    const equity = trialBalance
      .filter(tb => tb.account.accountType === AccountType.EQUITY)
      .map(tb => ({ account: tb.account.name, amount: Math.abs(tb.balance) }));

    return {
      assets,
      liabilities,
      equity,
      totalAssets: assets.reduce((sum, a) => sum + a.amount, 0),
      totalLiabilities: liabilities.reduce((sum, l) => sum + l.amount, 0),
      totalEquity: equity.reduce((sum, e) => sum + e.amount, 0),
    };
  }

  async getCashFlowReport(startDate: string, endDate: string): Promise<CashFlowReport> {
    const journalRepo = this.dataSource.getRepository(JournalEntry);

    // Simplified cash flow calculation
    const cashEntries = await journalRepo
      .createQueryBuilder('je')
      .where('je.debitAccountId = :cashAccount OR je.creditAccountId = :cashAccount', { cashAccount: 'cash' })
      .andWhere('je.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const cashInflows = cashEntries
      .filter(e => e.debitAccountId === 'cash')
      .reduce((sum, e) => sum + e.amount, 0);

    const cashOutflows = cashEntries
      .filter(e => e.creditAccountId === 'cash')
      .reduce((sum, e) => sum + e.amount, 0);

    const netCashFlow = cashInflows - cashOutflows;

    return {
      operatingActivities: netCashFlow, // Simplified
      investingActivities: 0,
      financingActivities: 0,
      netCashFlow,
      openingBalance: 0, // Would need to calculate from previous period
      closingBalance: netCashFlow,
    };
  }

  async getAccountBalance(accountId: string, asOfDate?: string): Promise<number> {
    const journalRepo = this.dataSource.getRepository(JournalEntry);

    let query = journalRepo.createQueryBuilder('je')
      .where('je.debitAccountId = :accountId OR je.creditAccountId = :accountId', { accountId });

    if (asOfDate) {
      query = query.andWhere('je.date <= :asOfDate', { asOfDate });
    }

    const entries = await query.getMany();

    const debits = entries
      .filter(e => e.debitAccountId === accountId)
      .reduce((sum, e) => sum + e.amount, 0);

    const credits = entries
      .filter(e => e.creditAccountId === accountId)
      .reduce((sum, e) => sum + e.amount, 0);

    return debits - credits;
  }
}