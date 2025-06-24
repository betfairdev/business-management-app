// Core Services
export { BaseService } from './core/BaseService';

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

// Service Factory for easy access
export class ServiceFactory {
  private static instances = new Map<string, any>();

  static getAccountingService(): AccountingService {
    if (!this.instances.has('accounting')) {
      this.instances.set('accounting', new AccountingService());
    }
    return this.instances.get('accounting');
  }

  static getHRService(): HRService {
    if (!this.instances.has('hr')) {
      this.instances.set('hr', new HRService());
    }
    return this.instances.get('hr');
  }

  static getCRMService(): CRMService {
    if (!this.instances.has('crm')) {
      this.instances.set('crm', new CRMService());
    }
    return this.instances.get('crm');
  }

  static getSRMService(): SRMService {
    if (!this.instances.has('srm')) {
      this.instances.set('srm', new SRMService());
    }
    return this.instances.get('srm');
  }

  static getPOSService(): POSService {
    if (!this.instances.has('pos')) {
      this.instances.set('pos', new POSService());
    }
    return this.instances.get('pos');
  }

  static getInventoryService(): InventoryService {
    if (!this.instances.has('inventory')) {
      this.instances.set('inventory', new InventoryService());
    }
    return this.instances.get('inventory');
  }

  static getUserService(): UserService {
    if (!this.instances.has('user')) {
      this.instances.set('user', new UserService());
    }
    return this.instances.get('user');
  }

  static getStoreService(): StoreService {
    if (!this.instances.has('store')) {
      this.instances.set('store', new StoreService());
    }
    return this.instances.get('store');
  }

  static getTaxService(): TaxService {
    if (!this.instances.has('tax')) {
      this.instances.set('tax', new TaxService());
    }
    return this.instances.get('tax');
  }

  static getReportingService(): ReportingService {
    if (!this.instances.has('reporting')) {
      this.instances.set('reporting', new ReportingService());
    }
    return this.instances.get('reporting');
  }

  static getAnalyticsService(): AnalyticsService {
    if (!this.instances.has('analytics')) {
      this.instances.set('analytics', new AnalyticsService());
    }
    return this.instances.get('analytics');
  }

  static getBackupService(): BackupService {
    if (!this.instances.has('backup')) {
      this.instances.set('backup', new BackupService());
    }
    return this.instances.get('backup');
  }

  static getSubscriptionService(): SubscriptionService {
    if (!this.instances.has('subscription')) {
      this.instances.set('subscription', new SubscriptionService());
    }
    return this.instances.get('subscription');
  }

  static getIntegrationService(): IntegrationService {
    if (!this.instances.has('integration')) {
      this.instances.set('integration', new IntegrationService());
    }
    return this.instances.get('integration');
  }

  static getEmailService(): EmailService {
    if (!this.instances.has('email')) {
      this.instances.set('email', new EmailService());
    }
    return this.instances.get('email');
  }

  static getSMSService(): SMSService {
    if (!this.instances.has('sms')) {
      this.instances.set('sms', new SMSService());
    }
    return this.instances.get('sms');
  }

  static getWhatsAppService(): WhatsAppService {
    if (!this.instances.has('whatsapp')) {
      this.instances.set('whatsapp', new WhatsAppService());
    }
    return this.instances.get('whatsapp');
  }

  static getNotificationService(): NotificationService {
    if (!this.instances.has('notification')) {
      this.instances.set('notification', new NotificationService());
    }
    return this.instances.get('notification');
  }

  static getPrintingService(): PrintingService {
    if (!this.instances.has('printing')) {
      this.instances.set('printing', new PrintingService());
    }
    return this.instances.get('printing');
  }

  static getSettingService(): SettingService {
    if (!this.instances.has('setting')) {
      this.instances.set('setting', new SettingService());
    }
    return this.instances.get('setting');
  }

  // Clear all instances (useful for testing)
  static clearInstances(): void {
    this.instances.clear();
  }
}