import { getDataSource } from '../../config/database';
import { SettingService } from '../SettingService';
import { UserService } from '../user/UserService';
import { Role } from '../../entities/Role';
import { Permission } from '../../entities/Permission';
import { Store, StoreType } from '../../entities/Store';
import { PaymentMethod } from '../../entities/PaymentMethod';
import { ExpenseType } from '../../entities/ExpenseType';
import { IncomeType } from '../../entities/IncomeType';
import { TaxRate } from '../../entities/TaxRate';
import { Account, AccountType } from '../../entities/Account';
import { Feature, FeatureType } from '../../entities/Feature';
import { SubscriptionPlan } from '../../entities/Subscription';

export interface SetupData {
  // Business Information
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  businessType: string;
  currency: string;
  timezone: string;
  
  // Admin User
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
  
  // Initial Store
  storeName: string;
  storeAddress?: string;
  storeType: StoreType;
  
  // Basic Settings
  dateFormat: string;
  timeFormat: string;
  language: string;
  theme: string;
}

export interface SetupProgress {
  step: number;
  totalSteps: number;
  currentTask: string;
  completed: boolean;
}

export class SetupService {
  private dataSource = getDataSource();
  private settingService = new SettingService();
  private userService = new UserService();

  async isSetupComplete(): Promise<boolean> {
    const setupComplete = await this.settingService.getSettingValue('setup_complete');
    return setupComplete === 'true';
  }

  async runSetup(data: SetupData, onProgress?: (progress: SetupProgress) => void): Promise<void> {
    const totalSteps = 8;
    let currentStep = 0;

    const updateProgress = (task: string) => {
      currentStep++;
      onProgress?.({
        step: currentStep,
        totalSteps,
        currentTask: task,
        completed: false,
      });
    };

    try {
      await this.dataSource.transaction(async (manager) => {
        // Step 1: Create default roles and permissions
        updateProgress('Creating default roles and permissions...');
        await this.createDefaultRolesAndPermissions(manager);

        // Step 2: Create admin user
        updateProgress('Creating admin user...');
        await this.createAdminUser(data, manager);

        // Step 3: Create default store
        updateProgress('Creating default store...');
        await this.createDefaultStore(data, manager);

        // Step 4: Create default payment methods
        updateProgress('Setting up payment methods...');
        await this.createDefaultPaymentMethods(manager);

        // Step 5: Create default expense and income types
        updateProgress('Setting up expense and income types...');
        await this.createDefaultExpenseIncomeTypes(manager);

        // Step 6: Create default tax rates
        updateProgress('Setting up tax rates...');
        await this.createDefaultTaxRates(manager);

        // Step 7: Create default chart of accounts
        updateProgress('Setting up chart of accounts...');
        await this.createDefaultAccounts(manager);

        // Step 8: Create default features and save settings
        updateProgress('Finalizing setup...');
        await this.createDefaultFeatures(manager);
        await this.saveBusinessSettings(data);
      });

      // Mark setup as complete
      await this.settingService.setSetting('setup_complete', 'true');
      await this.settingService.setSetting('setup_date', new Date().toISOString());

      onProgress?.({
        step: totalSteps,
        totalSteps,
        currentTask: 'Setup completed successfully!',
        completed: true,
      });

    } catch (error) {
      console.error('Setup failed:', error);
      throw new Error('Setup failed. Please try again.');
    }
  }

  private async createDefaultRolesAndPermissions(manager: any): Promise<void> {
    const permissionRepo = manager.getRepository(Permission);
    const roleRepo = manager.getRepository(Role);

    // Define all modules and actions
    const modules = [
      'dashboard', 'users', 'roles', 'products', 'categories', 'brands',
      'customers', 'suppliers', 'sales', 'purchases', 'inventory',
      'employees', 'attendance', 'leaves', 'departments', 'positions',
      'expenses', 'income', 'accounting', 'reports', 'settings',
      'stores', 'taxes', 'communications', 'crm', 'hrm', 'pos'
    ];

    const actions = ['create', 'read', 'update', 'delete', 'export', 'import', 'approve'];

    // Create all permissions
    const permissions: Permission[] = [];
    for (const module of modules) {
      for (const action of actions) {
        const permission = permissionRepo.create({
          module,
          action,
          isAllowed: true,
        });
        permissions.push(permission);
      }
    }

    const savedPermissions = await permissionRepo.save(permissions);

    // Create Super Admin role with all permissions
    const superAdminRole = roleRepo.create({
      name: 'Super Admin',
      description: 'Full system access',
      isSystemRole: true,
      permissions: savedPermissions,
    });

    // Create Admin role with most permissions (excluding user management)
    const adminPermissions = savedPermissions.filter(p => 
      !(p.module === 'users' && ['create', 'delete'].includes(p.action)) &&
      !(p.module === 'roles' && ['create', 'update', 'delete'].includes(p.action))
    );

    const adminRole = roleRepo.create({
      name: 'Admin',
      description: 'Administrative access',
      isSystemRole: true,
      permissions: adminPermissions,
    });

    // Create Manager role with limited permissions
    const managerPermissions = savedPermissions.filter(p => 
      !['users', 'roles', 'settings'].includes(p.module) &&
      !['delete'].includes(p.action)
    );

    const managerRole = roleRepo.create({
      name: 'Manager',
      description: 'Management access',
      isSystemRole: true,
      permissions: managerPermissions,
    });

    // Create Employee role with basic permissions
    const employeePermissions = savedPermissions.filter(p => 
      ['dashboard', 'products', 'customers', 'sales', 'inventory', 'pos'].includes(p.module) &&
      ['read', 'create', 'update'].includes(p.action)
    );

    const employeeRole = roleRepo.create({
      name: 'Employee',
      description: 'Basic employee access',
      isSystemRole: true,
      permissions: employeePermissions,
    });

    await roleRepo.save([superAdminRole, adminRole, managerRole, employeeRole]);
  }

  private async createAdminUser(data: SetupData, manager: any): Promise<void> {
    const roleRepo = manager.getRepository(Role);
    const superAdminRole = await roleRepo.findOne({ where: { name: 'Super Admin' } });

    await this.userService.create({
      email: data.adminEmail,
      password: data.adminPassword,
      firstName: data.adminFirstName,
      lastName: data.adminLastName,
      role: superAdminRole?.id,
    });
  }

  private async createDefaultStore(data: SetupData, manager: any): Promise<void> {
    const storeRepo = manager.getRepository(Store);

    const store = storeRepo.create({
      name: data.storeName,
      address: data.storeAddress,
      phone: data.businessPhone,
      type: data.storeType,
    });

    await storeRepo.save(store);
  }

  private async createDefaultPaymentMethods(manager: any): Promise<void> {
    const paymentMethodRepo = manager.getRepository(PaymentMethod);

    const methods = [
      { name: 'Cash', description: 'Cash payment' },
      { name: 'Credit Card', description: 'Credit card payment' },
      { name: 'Debit Card', description: 'Debit card payment' },
      { name: 'Bank Transfer', description: 'Bank transfer payment' },
      { name: 'Check', description: 'Check payment' },
      { name: 'Digital Wallet', description: 'Digital wallet payment' },
    ];

    const paymentMethods = methods.map(method => paymentMethodRepo.create(method));
    await paymentMethodRepo.save(paymentMethods);
  }

  private async createDefaultExpenseIncomeTypes(manager: any): Promise<void> {
    const expenseTypeRepo = manager.getRepository(ExpenseType);
    const incomeTypeRepo = manager.getRepository(IncomeType);

    // Expense Types
    const expenseTypes = [
      { name: 'Office Supplies', description: 'Office supplies and stationery' },
      { name: 'Rent', description: 'Office or store rent' },
      { name: 'Utilities', description: 'Electricity, water, internet' },
      { name: 'Marketing', description: 'Marketing and advertising expenses' },
      { name: 'Travel', description: 'Business travel expenses' },
      { name: 'Equipment', description: 'Equipment and machinery' },
      { name: 'Maintenance', description: 'Maintenance and repairs' },
      { name: 'Insurance', description: 'Business insurance' },
      { name: 'Professional Services', description: 'Legal, accounting, consulting' },
      { name: 'Other', description: 'Other miscellaneous expenses' },
    ];

    const expenseEntities = expenseTypes.map(type => expenseTypeRepo.create(type));
    await expenseTypeRepo.save(expenseEntities);

    // Income Types
    const incomeTypes = [
      { name: 'Product Sales', description: 'Revenue from product sales' },
      { name: 'Service Revenue', description: 'Revenue from services' },
      { name: 'Interest Income', description: 'Interest earned on deposits' },
      { name: 'Rental Income', description: 'Income from property rental' },
      { name: 'Commission', description: 'Commission income' },
      { name: 'Other Income', description: 'Other miscellaneous income' },
    ];

    const incomeEntities = incomeTypes.map(type => incomeTypeRepo.create(type));
    await incomeTypeRepo.save(incomeEntities);
  }

  private async createDefaultTaxRates(manager: any): Promise<void> {
    const taxRateRepo = manager.getRepository(TaxRate);

    const taxRates = [
      { name: 'No Tax', rate: 0, description: 'No tax applied' },
      { name: 'Standard Tax', rate: 10, description: 'Standard tax rate' },
      { name: 'Reduced Tax', rate: 5, description: 'Reduced tax rate' },
      { name: 'High Tax', rate: 18, description: 'High tax rate' },
    ];

    const taxEntities = taxRates.map(tax => taxRateRepo.create(tax));
    await taxRateRepo.save(taxEntities);
  }

  private async createDefaultAccounts(manager: any): Promise<void> {
    const accountRepo = manager.getRepository(Account);

    const accounts = [
      // Assets
      { name: 'Cash', accountType: AccountType.ASSET, currency: 'USD', isActive: true },
      { name: 'Bank Account', accountType: AccountType.ASSET, currency: 'USD', isActive: true },
      { name: 'Accounts Receivable', accountType: AccountType.ASSET, currency: 'USD', isActive: true },
      { name: 'Inventory', accountType: AccountType.ASSET, currency: 'USD', isActive: true },
      { name: 'Equipment', accountType: AccountType.ASSET, currency: 'USD', isActive: true },

      // Liabilities
      { name: 'Accounts Payable', accountType: AccountType.LIABILITY, currency: 'USD', isActive: true },
      { name: 'Credit Card', accountType: AccountType.LIABILITY, currency: 'USD', isActive: true },
      { name: 'Loans Payable', accountType: AccountType.LIABILITY, currency: 'USD', isActive: true },

      // Equity
      { name: 'Owner Equity', accountType: AccountType.EQUITY, currency: 'USD', isActive: true },
      { name: 'Retained Earnings', accountType: AccountType.EQUITY, currency: 'USD', isActive: true },

      // Revenue
      { name: 'Sales Revenue', accountType: AccountType.REVENUE, currency: 'USD', isActive: true },
      { name: 'Service Revenue', accountType: AccountType.REVENUE, currency: 'USD', isActive: true },
      { name: 'Other Income', accountType: AccountType.REVENUE, currency: 'USD', isActive: true },

      // Expenses
      { name: 'Cost of Goods Sold', accountType: AccountType.EXPENSE, currency: 'USD', isActive: true },
      { name: 'Operating Expenses', accountType: AccountType.EXPENSE, currency: 'USD', isActive: true },
      { name: 'Marketing Expenses', accountType: AccountType.EXPENSE, currency: 'USD', isActive: true },
      { name: 'Administrative Expenses', accountType: AccountType.EXPENSE, currency: 'USD', isActive: true },
    ];

    const accountEntities = accounts.map(account => accountRepo.create(account));
    await accountRepo.save(accountEntities);
  }

  private async createDefaultFeatures(manager: any): Promise<void> {
    const featureRepo = manager.getRepository(Feature);

    const features = [
      // Core Features
      {
        key: 'basic_pos',
        name: 'Basic POS',
        description: 'Basic point of sale functionality',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'inventory_management',
        name: 'Inventory Management',
        description: 'Product and stock management',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'customer_management',
        name: 'Customer Management',
        description: 'Customer relationship management',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'supplier_management',
        name: 'Supplier Management',
        description: 'Supplier relationship management',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'employee_management',
        name: 'Employee Management',
        description: 'Human resource management',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'accounting',
        name: 'Accounting',
        description: 'Financial accounting and reporting',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'advanced_reports',
        name: 'Advanced Reports',
        description: 'Detailed business reports and analytics',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'multi_store',
        name: 'Multi-Store Management',
        description: 'Manage multiple store locations',
        type: FeatureType.MODULE,
        availableInPlans: [SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'integrations',
        name: 'Third-party Integrations',
        description: 'Connect with external services',
        type: FeatureType.INTEGRATION,
        availableInPlans: [SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'api_access',
        name: 'API Access',
        description: 'REST API for custom integrations',
        type: FeatureType.ADVANCED,
        availableInPlans: [SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },

      // Limits
      {
        key: 'product_limit',
        name: 'Product Limit',
        description: 'Maximum number of products',
        type: FeatureType.LIMIT,
        limits: {
          [SubscriptionPlan.FREE]: 100,
          [SubscriptionPlan.BASIC]: 1000,
          [SubscriptionPlan.PREMIUM]: 10000,
          [SubscriptionPlan.ENTERPRISE]: -1, // unlimited
        },
        availableInPlans: [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'customer_limit',
        name: 'Customer Limit',
        description: 'Maximum number of customers',
        type: FeatureType.LIMIT,
        limits: {
          [SubscriptionPlan.FREE]: 50,
          [SubscriptionPlan.BASIC]: 500,
          [SubscriptionPlan.PREMIUM]: 5000,
          [SubscriptionPlan.ENTERPRISE]: -1, // unlimited
        },
        availableInPlans: [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'employee_limit',
        name: 'Employee Limit',
        description: 'Maximum number of employees',
        type: FeatureType.LIMIT,
        limits: {
          [SubscriptionPlan.FREE]: 1,
          [SubscriptionPlan.BASIC]: 5,
          [SubscriptionPlan.PREMIUM]: 50,
          [SubscriptionPlan.ENTERPRISE]: -1, // unlimited
        },
        availableInPlans: [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
      {
        key: 'store_limit',
        name: 'Store Limit',
        description: 'Maximum number of stores',
        type: FeatureType.LIMIT,
        limits: {
          [SubscriptionPlan.FREE]: 1,
          [SubscriptionPlan.BASIC]: 1,
          [SubscriptionPlan.PREMIUM]: 5,
          [SubscriptionPlan.ENTERPRISE]: -1, // unlimited
        },
        availableInPlans: [SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM, SubscriptionPlan.ENTERPRISE],
        isActive: true,
      },
    ];

    const featureEntities = features.map(feature => featureRepo.create(feature));
    await featureRepo.save(featureEntities);
  }

  private async saveBusinessSettings(data: SetupData): Promise<void> {
    const settings = [
      { key: 'business_name', value: data.businessName },
      { key: 'business_address', value: data.businessAddress },
      { key: 'business_phone', value: data.businessPhone },
      { key: 'business_email', value: data.businessEmail },
      { key: 'business_type', value: data.businessType },
      { key: 'currency', value: data.currency },
      { key: 'timezone', value: data.timezone },
      { key: 'date_format', value: data.dateFormat },
      { key: 'time_format', value: data.timeFormat },
      { key: 'language', value: data.language },
      { key: 'theme', value: data.theme },
    ];

    for (const setting of settings) {
      await this.settingService.setSetting(setting.key, setting.value);
    }
  }

  async resetSetup(): Promise<void> {
    // This should only be used in development/testing
    await this.settingService.deleteSetting('setup_complete');
    await this.settingService.deleteSetting('setup_date');
  }

  async getSetupStatus(): Promise<{
    isComplete: boolean;
    setupDate?: string;
    version?: string;
  }> {
    const isComplete = await this.isSetupComplete();
    const setupDate = await this.settingService.getSettingValue('setup_date');
    const version = await this.settingService.getSettingValue('app_version');

    return {
      isComplete,
      setupDate: setupDate || undefined,
      version: version || undefined,
    };
  }
}