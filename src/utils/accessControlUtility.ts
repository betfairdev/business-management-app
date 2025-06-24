export interface Permission {
  module: string;
  action: string;
  isAllowed: boolean;
}

export interface UserPermissions {
  userId: string;
  roleId?: string;
  permissions: Permission[];
}

export interface FeatureAccess {
  hasAccess: boolean;
  limit?: number;
  currentUsage?: number;
}

export class AccessControlUtility {
  private static userPermissions: UserPermissions | null = null;
  private static userPlan: string | null = null;
  private static planFeatures: Record<string, FeatureAccess> = {};

  /**
   * Set current user permissions
   */
  static setUserPermissions(permissions: UserPermissions): void {
    this.userPermissions = permissions;
  }

  /**
   * Set current user subscription plan and features
   */
  static setUserPlan(plan: string, features: Record<string, FeatureAccess>): void {
    this.userPlan = plan;
    this.planFeatures = features;
  }

  /**
   * Check if user has permission for a specific action
   */
  static hasPermission(module: string, action: string): boolean {
    if (!this.userPermissions) {
      return false;
    }

    const permission = this.userPermissions.permissions.find(
      p => p.module === module && p.action === action
    );

    return permission?.isAllowed ?? false;
  }

  /**
   * Check multiple permissions at once
   */
  static hasPermissions(checks: Array<{ module: string; action: string }>): boolean {
    return checks.every(check => this.hasPermission(check.module, check.action));
  }

  /**
   * Check if user has any permission in a module
   */
  static hasModuleAccess(module: string): boolean {
    if (!this.userPermissions) {
      return false;
    }

    return this.userPermissions.permissions.some(
      p => p.module === module && p.isAllowed
    );
  }

  /**
   * Check if user has access to a feature based on subscription plan
   */
  static hasFeatureAccess(featureKey: string): boolean {
    const feature = this.planFeatures[featureKey];
    return feature?.hasAccess ?? false;
  }

  /**
   * Get feature limit for current user's plan
   */
  static getFeatureLimit(featureKey: string): number | undefined {
    const feature = this.planFeatures[featureKey];
    return feature?.limit;
  }

  /**
   * Check if user is within feature limit
   */
  static isWithinFeatureLimit(featureKey: string, currentUsage: number): boolean {
    const feature = this.planFeatures[featureKey];
    if (!feature?.hasAccess) return false;
    
    // -1 means unlimited
    if (feature.limit === -1) return true;
    if (feature.limit === undefined) return true;
    
    return currentUsage < feature.limit;
  }

  /**
   * Get remaining usage for a feature
   */
  static getRemainingFeatureUsage(featureKey: string, currentUsage: number): number {
    const feature = this.planFeatures[featureKey];
    if (!feature?.hasAccess) return 0;
    
    // -1 means unlimited
    if (feature.limit === -1) return -1;
    if (feature.limit === undefined) return -1;
    
    return Math.max(0, feature.limit - currentUsage);
  }

  /**
   * Check both permission and feature access
   */
  static hasFullAccess(module: string, action: string, featureKey?: string): boolean {
    const hasPermission = this.hasPermission(module, action);
    
    if (featureKey) {
      const hasFeature = this.hasFeatureAccess(featureKey);
      return hasPermission && hasFeature;
    }
    
    return hasPermission;
  }

  /**
   * Get all allowed actions for a module
   */
  static getAllowedActions(module: string): string[] {
    if (!this.userPermissions) {
      return [];
    }

    return this.userPermissions.permissions
      .filter(p => p.module === module && p.isAllowed)
      .map(p => p.action);
  }

  /**
   * Get all accessible features
   */
  static getAccessibleFeatures(): string[] {
    return Object.keys(this.planFeatures).filter(key => 
      this.planFeatures[key].hasAccess
    );
  }

  /**
   * Clear user permissions and plan data (logout)
   */
  static clearPermissions(): void {
    this.userPermissions = null;
    this.userPlan = null;
    this.planFeatures = {};
  }

  /**
   * Get current user permissions
   */
  static getCurrentPermissions(): UserPermissions | null {
    return this.userPermissions;
  }

  /**
   * Get current user plan
   */
  static getCurrentPlan(): string | null {
    return this.userPlan;
  }

  /**
   * Get current plan features
   */
  static getCurrentPlanFeatures(): Record<string, FeatureAccess> {
    return this.planFeatures;
  }

  /**
   * Permission constants for common actions
   */
  static readonly ACTIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
    IMPORT: 'import',
    APPROVE: 'approve',
    REJECT: 'reject',
  } as const;

  /**
   * Module constants
   */
  static readonly MODULES = {
    DASHBOARD: 'dashboard',
    USERS: 'users',
    ROLES: 'roles',
    PRODUCTS: 'products',
    CATEGORIES: 'categories',
    BRANDS: 'brands',
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',
    SALES: 'sales',
    PURCHASES: 'purchases',
    INVENTORY: 'inventory',
    REPORTS: 'reports',
    SETTINGS: 'settings',
    EMPLOYEES: 'employees',
    ATTENDANCE: 'attendance',
    EXPENSES: 'expenses',
    INCOME: 'income',
    ACCOUNTING: 'accounting',
    STORES: 'stores',
    TAXES: 'taxes',
    COMMUNICATIONS: 'communications',
    CRM: 'crm',
    HRM: 'hrm',
    POS: 'pos',
  } as const;

  /**
   * Feature constants
   */
  static readonly FEATURES = {
    BASIC_POS: 'basic_pos',
    INVENTORY_MANAGEMENT: 'inventory_management',
    CUSTOMER_MANAGEMENT: 'customer_management',
    SUPPLIER_MANAGEMENT: 'supplier_management',
    EMPLOYEE_MANAGEMENT: 'employee_management',
    ACCOUNTING: 'accounting',
    ADVANCED_REPORTS: 'advanced_reports',
    MULTI_STORE: 'multi_store',
    INTEGRATIONS: 'integrations',
    API_ACCESS: 'api_access',
    PRODUCT_LIMIT: 'product_limit',
    CUSTOMER_LIMIT: 'customer_limit',
    EMPLOYEE_LIMIT: 'employee_limit',
    STORE_LIMIT: 'store_limit',
  } as const;
}