// Core Services
export { BaseService } from './core/BaseService';

// Platform Services
export { PlatformService } from './platform/PlatformService';
export { SyncService } from './sync/SyncService';
export { SecurityService } from './security/SecurityService';
export { CacheService } from './cache/CacheService';
export { AuditService } from './audit/AuditService';
export { WorkflowService } from './workflow/WorkflowService';

// Business Module Services
export { AccountingService } from './accounting/AccountingService';
export { HRService } from './hr/HRService';
export { CRMService } from './crm/CRMService';
export { SRMService } from './srm/SRMService';
export { POSService } from './pos/POSService';
export { InventoryService } from './inventory/InventoryService';
export { UserService } from './user/UserService';
export { StoreService } from './store/StoreService';
export { TaxService } from './tax/TaxService';
export { ReportingService } from './reporting/ReportingService';

// Communication Services
export { EmailService } from './communication/EmailService';
export { SMSService } from './communication/SMSService';
export { WhatsAppService } from './communication/WhatsAppService';
export { NotificationService } from './communication/NotificationService';

// Additional Services
export { AnalyticsService } from './analytics/AnalyticsService';
export { BackupService } from './backup/BackupService';
export { SubscriptionService } from './subscription/SubscriptionService';
export { IntegrationService } from './integration/IntegrationService';
export { PrintingService } from './printing/PrintingService';

// Legacy Services (for backward compatibility)
export { SettingService } from '../services/SettingService';

// Service Factory for easy access with platform awareness
export class ServiceFactory {
  private static instances = new Map<string, any>();
  private static platformInitialized = false;

  static async initialize(): Promise<void> {
    if (!this.platformInitialized) {
      const { PlatformService } = await import('./platform/PlatformService');
      await PlatformService.initialize();
      this.platformInitialized = true;
    }
  }

  // Platform Services
  static async getPlatformService() {
    await this.initialize();
    const { PlatformService } = await import('./platform/PlatformService');
    return PlatformService;
  }

  static async getSyncService(config?: any) {
    if (!this.instances.has('sync')) {
      const { SyncService } = await import('./sync/SyncService');
      this.instances.set('sync', new SyncService(config || {
        syncInterval: 30,
        autoSync: true,
        conflictResolution: 'server',
      }));
    }
    return this.instances.get('sync');
  }

  static async getSecurityService(config?: any) {
    if (!this.instances.has('security')) {
      const { SecurityService } = await import('./security/SecurityService');
      this.instances.set('security', new SecurityService(config || {
        encryptionEnabled: true,
        biometricEnabled: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordPolicy: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
        },
      }));
    }
    return this.instances.get('security');
  }

  static async getCacheService(config?: any) {
    if (!this.instances.has('cache')) {
      const { CacheService } = await import('./cache/CacheService');
      this.instances.set('cache', new CacheService(config || {
        defaultTTL: 3600,
        maxSize: 50,
        strategy: 'LRU',
      }));
    }
    return this.instances.get('cache');
  }

  static getAuditService() {
    if (!this.instances.has('audit')) {
      const { AuditService } = require('./audit/AuditService');
      this.instances.set('audit', new AuditService());
    }
    return this.instances.get('audit');
  }

  static getWorkflowService() {
    if (!this.instances.has('workflow')) {
      const { WorkflowService } = require('./workflow/WorkflowService');
      this.instances.set('workflow', new WorkflowService());
    }
    return this.instances.get('workflow');
  }

  // Business Services
  static getAccountingService() {
    if (!this.instances.has('accounting')) {
      const { AccountingService } = require('./accounting/AccountingService');
      this.instances.set('accounting', new AccountingService());
    }
    return this.instances.get('accounting');
  }

  static getHRService() {
    if (!this.instances.has('hr')) {
      const { HRService } = require('./hr/HRService');
      this.instances.set('hr', new HRService());
    }
    return this.instances.get('hr');
  }

  static getCRMService() {
    if (!this.instances.has('crm')) {
      const { CRMService } = require('./crm/CRMService');
      this.instances.set('crm', new CRMService());
    }
    return this.instances.get('crm');
  }

  static getSRMService() {
    if (!this.instances.has('srm')) {
      const { SRMService } = require('./srm/SRMService');
      this.instances.set('srm', new SRMService());
    }
    return this.instances.get('srm');
  }

  static getPOSService() {
    if (!this.instances.has('pos')) {
      const { POSService } = require('./pos/POSService');
      this.instances.set('pos', new POSService());
    }
    return this.instances.get('pos');
  }

  static getInventoryService() {
    if (!this.instances.has('inventory')) {
      const { InventoryService } = require('./inventory/InventoryService');
      this.instances.set('inventory', new InventoryService());
    }
    return this.instances.get('inventory');
  }

  static getUserService() {
    if (!this.instances.has('user')) {
      const { UserService } = require('./user/UserService');
      this.instances.set('user', new UserService());
    }
    return this.instances.get('user');
  }

  static getStoreService() {
    if (!this.instances.has('store')) {
      const { StoreService } = require('./store/StoreService');
      this.instances.set('store', new StoreService());
    }
    return this.instances.get('store');
  }

  static getTaxService() {
    if (!this.instances.has('tax')) {
      const { TaxService } = require('./tax/TaxService');
      this.instances.set('tax', new TaxService());
    }
    return this.instances.get('tax');
  }

  static getReportingService() {
    if (!this.instances.has('reporting')) {
      const { ReportingService } = require('./reporting/ReportingService');
      this.instances.set('reporting', new ReportingService());
    }
    return this.instances.get('reporting');
  }

  static getAnalyticsService() {
    if (!this.instances.has('analytics')) {
      const { AnalyticsService } = require('./analytics/AnalyticsService');
      this.instances.set('analytics', new AnalyticsService());
    }
    return this.instances.get('analytics');
  }

  static getBackupService() {
    if (!this.instances.has('backup')) {
      const { BackupService } = require('./backup/BackupService');
      this.instances.set('backup', new BackupService());
    }
    return this.instances.get('backup');
  }

  static getSubscriptionService() {
    if (!this.instances.has('subscription')) {
      const { SubscriptionService } = require('./subscription/SubscriptionService');
      this.instances.set('subscription', new SubscriptionService());
    }
    return this.instances.get('subscription');
  }

  static getIntegrationService() {
    if (!this.instances.has('integration')) {
      const { IntegrationService } = require('./integration/IntegrationService');
      this.instances.set('integration', new IntegrationService());
    }
    return this.instances.get('integration');
  }

  static async getEmailService() {
    if (!this.instances.has('email')) {
      const { EmailService } = await import('./communication/EmailService');
      this.instances.set('email', new EmailService());
    }
    return this.instances.get('email');
  }

  static getSMSService() {
    if (!this.instances.has('sms')) {
      const { SMSService } = require('./communication/SMSService');
      this.instances.set('sms', new SMSService());
    }
    return this.instances.get('sms');
  }

  static getWhatsAppService() {
    if (!this.instances.has('whatsapp')) {
      const { WhatsAppService } = require('./communication/WhatsAppService');
      this.instances.set('whatsapp', new WhatsAppService());
    }
    return this.instances.get('whatsapp');
  }

  static async getNotificationService() {
    if (!this.instances.has('notification')) {
      const { NotificationService } = await import('./communication/NotificationService');
      const service = new NotificationService();
      await service.initialize();
      this.instances.set('notification', service);
    }
    return this.instances.get('notification');
  }

  static getPrintingService() {
    if (!this.instances.has('printing')) {
      const { PrintingService } = require('./printing/PrintingService');
      this.instances.set('printing', new PrintingService());
    }
    return this.instances.get('printing');
  }

  static getSettingService() {
    if (!this.instances.has('setting')) {
      const { SettingService } = require('../services/SettingService');
      this.instances.set('setting', new SettingService());
    }
    return this.instances.get('setting');
  }

  // Utility methods
  static async isNativePlatform(): Promise<boolean> {
    const platformService = await this.getPlatformService();
    return platformService.isNative();
  }

  static async getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
    const platformService = await this.getPlatformService();
    return await platformService.getNetworkStatus();
  }

  // Clear all instances (useful for testing)
  static clearInstances(): void {
    this.instances.clear();
    this.platformInitialized = false;
  }

  // Get service configuration based on platform
  static async getServiceConfig(serviceName: string): Promise<any> {
    const platformService = await this.getPlatformService();
    const isNative = platformService.isNative();
    
    // Return platform-specific configurations
    const configs: Record<string, any> = {
      notification: {
        web: { useServiceWorker: true },
        native: { useFCM: true, useLocalNotifications: true },
      },
      cache: {
        web: { storage: 'localStorage', maxSize: 50 },
        native: { storage: 'preferences', maxSize: 100 },
      },
      security: {
        web: { biometricEnabled: false, encryptionEnabled: false },
        native: { biometricEnabled: true, encryptionEnabled: true },
      },
    };

    const serviceConfig = configs[serviceName];
    if (!serviceConfig) return {};

    return isNative ? serviceConfig.native : serviceConfig.web;
  }
}