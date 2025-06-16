import { apiService, ApiResponse, QueryParams } from './api';
import { Account } from '../entities/Account';
import { JournalEntry } from '../entities/JournalEntry';

export interface AccountingFilters {
  accountType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface FinancialStatement {
  balanceSheet: {
    assets: Array<{ account: string; amount: number }>;
    liabilities: Array<{ account: string; amount: number }>;
    equity: Array<{ account: string; amount: number }>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  incomeStatement: {
    revenue: Array<{ account: string; amount: number }>;
    expenses: Array<{ account: string; amount: number }>;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    netCashFlow: number;
  };
}

export interface BudgetData {
  id: string;
  name: string;
  period: string;
  accounts: Array<{
    accountId: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
  }>;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
}

class AccountingService {
  private endpoint = '/accounting';

  // Chart of Accounts
  async getAccounts(params?: QueryParams): Promise<ApiResponse<Account[]>> {
    return apiService.get('/accounts', params);
  }

  async getAccount(id: string): Promise<ApiResponse<Account>> {
    return apiService.get(`/accounts/${id}`);
  }

  async createAccount(account: Partial<Account>): Promise<ApiResponse<Account>> {
    return apiService.post('/accounts', account);
  }

  async updateAccount(id: string, account: Partial<Account>): Promise<ApiResponse<Account>> {
    return apiService.put(`/accounts/${id}`, account);
  }

  async deleteAccount(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/accounts/${id}`);
  }

  // Journal Entries
  async getJournalEntries(params?: QueryParams & AccountingFilters): Promise<ApiResponse<JournalEntry[]>> {
    return apiService.get('/journal-entries', params);
  }

  async createJournalEntry(entry: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> {
    return apiService.post('/journal-entries', entry);
  }

  async updateJournalEntry(id: string, entry: Partial<JournalEntry>): Promise<ApiResponse<JournalEntry>> {
    return apiService.put(`/journal-entries/${id}`, entry);
  }

  async deleteJournalEntry(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/journal-entries/${id}`);
  }

  // Financial Statements
  async getFinancialStatements(params: {
    startDate: string;
    endDate: string;
    includeComparative?: boolean;
  }): Promise<ApiResponse<FinancialStatement>> {
    return apiService.get(`${this.endpoint}/financial-statements`, params);
  }

  async getTrialBalance(date: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/trial-balance`, { date });
  }

  async getGeneralLedger(accountId: string, params?: {
    startDate: string;
    endDate: string;
  }): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/general-ledger/${accountId}`, params);
  }

  // Budgeting
  async getBudgets(year?: number): Promise<ApiResponse<BudgetData[]>> {
    return apiService.get(`${this.endpoint}/budgets`, { year });
  }

  async createBudget(budget: {
    name: string;
    period: string;
    accounts: Array<{ accountId: string; budgetedAmount: number }>;
  }): Promise<ApiResponse<BudgetData>> {
    return apiService.post(`${this.endpoint}/budgets`, budget);
  }

  async updateBudget(id: string, budget: Partial<BudgetData>): Promise<ApiResponse<BudgetData>> {
    return apiService.put(`${this.endpoint}/budgets/${id}`, budget);
  }

  async getBudgetVariance(budgetId: string): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/budgets/${budgetId}/variance`);
  }

  // Tax Management
  async getTaxReports(params: {
    taxYear: number;
    quarter?: number;
  }): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/tax-reports`, params);
  }

  async generateTaxReport(params: {
    taxYear: number;
    quarter?: number;
    reportType: string;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/tax-reports/generate`, params);
  }

  // Reconciliation
  async getBankReconciliations(accountId?: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/reconciliations`, { accountId });
  }

  async createBankReconciliation(reconciliation: {
    accountId: string;
    statementDate: string;
    statementBalance: number;
    transactions: Array<{
      id: string;
      amount: number;
      cleared: boolean;
    }>;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/reconciliations`, reconciliation);
  }

  // Accounts Receivable
  async getAccountsReceivable(): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/accounts-receivable`);
  }

  async getAgingReport(type: 'receivable' | 'payable'): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/aging-report`, { type });
  }

  // Accounts Payable
  async getAccountsPayable(): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/accounts-payable`);
  }

  // Fixed Assets
  async getFixedAssets(): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/fixed-assets`);
  }

  async createFixedAsset(asset: {
    name: string;
    category: string;
    purchaseDate: string;
    purchasePrice: number;
    depreciationMethod: string;
    usefulLife: number;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/fixed-assets`, asset);
  }

  async calculateDepreciation(assetId: string, date: string): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/fixed-assets/${assetId}/depreciation`, { date });
  }

  // Reports
  async getProfitLossReport(params: {
    startDate: string;
    endDate: string;
    compareWith?: string;
  }): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/reports/profit-loss`, params);
  }

  async getCashFlowReport(params: {
    startDate: string;
    endDate: string;
    method: 'direct' | 'indirect';
  }): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/reports/cash-flow`, params);
  }

  async getFinancialRatios(date: string): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/reports/financial-ratios`, { date });
  }

  // Export/Import
  async exportFinancialData(params: {
    format: 'csv' | 'excel' | 'pdf';
    reportType: string;
    startDate: string;
    endDate: string;
  }): Promise<Blob> {
    return apiService.export(`${this.endpoint}/export`, params.format, params);
  }

  async importChartOfAccounts(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return apiService.upload(`${this.endpoint}/import/accounts`, file, onProgress);
  }

  async importJournalEntries(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return apiService.upload(`${this.endpoint}/import/journal-entries`, file, onProgress);
  }
}

export const accountingService = new AccountingService();