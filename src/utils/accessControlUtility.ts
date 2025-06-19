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

export class AccessControlUtility {
  private static userPermissions: UserPermissions | null = null;

  /**
   * Set current user permissions
   */
  static setUserPermissions(permissions: UserPermissions): void {
    this.userPermissions = permissions;
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
   * Clear user permissions (logout)
   */
  static clearPermissions(): void {
    this.userPermissions = null;
  }

  /**
   * Get current user permissions
   */
  static getCurrentPermissions(): UserPermissions | null {
    return this.userPermissions;
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
    USERS: 'users',
    PRODUCTS: 'products',
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
  } as const;
}