import { Capacitor } from '@capacitor/core';
import { PushNotifications, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  actions?: Array<{
    id: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  category: 'business' | 'marketing' | 'system';
  variables: string[];
}

export class NotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private templates: NotificationTemplate[] = [];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Capacitor.isNativePlatform()) {
      await this.initializeNative();
    } else {
      await this.initializeWeb();
    }

    this.isInitialized = true;
  }

  private async initializeNative(): Promise<void> {
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        this.fcmToken = token.value;
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
        this.handleNotificationReceived(notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification);
        this.handleNotificationAction(notification);
      });
    }
  }

  private async initializeWeb(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Web push notifications enabled');
        }
      } catch (error) {
        console.error('Error initializing web push notifications:', error);
      }
    }
  }

  async getToken(): Promise<string | null> {
    return this.fcmToken;
  }

  async sendLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title: payload.title,
          body: payload.body,
          extra: payload.data,
          sound: payload.sound,
          iconColor: '#3b82f6',
        }]
      });
    } else {
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon || '/favicon.ico',
          badge: payload.badge,
          data: payload.data,
        });
      }
    }
  }

  async sendBusinessNotification(type: 'sale' | 'low_stock' | 'new_customer' | 'payment_received', data: any): Promise<void> {
    const notifications: Record<string, NotificationPayload> = {
      sale: {
        title: 'New Sale! 💰',
        body: `Sale of ${data.amount} completed`,
        data: { type: 'sale', saleId: data.id },
      },
      low_stock: {
        title: 'Low Stock Alert ⚠️',
        body: `${data.productName} is running low (${data.quantity} left)`,
        data: { type: 'low_stock', productId: data.productId },
      },
      new_customer: {
        title: 'New Customer 👋',
        body: `${data.customerName} joined your business`,
        data: { type: 'new_customer', customerId: data.customerId },
      },
      payment_received: {
        title: 'Payment Received 💳',
        body: `Payment of ${data.amount} received from ${data.customerName}`,
        data: { type: 'payment', paymentId: data.id },
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.sendLocalNotification(notification);
    }
  }

  async createTemplate(template: Omit<NotificationTemplate, 'id'>): Promise<NotificationTemplate> {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9),
    };
    
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async getTemplates(): Promise<NotificationTemplate[]> {
    return this.templates;
  }

  async sendTemplateNotification(
    templateId: string,
    variables: Record<string, string>
  ): Promise<void> {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let title = template.title;
    let body = template.body;

    // Replace variables
    template.variables.forEach(variable => {
      const value = variables[variable] || '';
      title = title.replace(`{{${variable}}}`, value);
      body = body.replace(`{{${variable}}}`, value);
    });

    await this.sendLocalNotification({ title, body });
  }

  async scheduleNotification(
    payload: NotificationPayload,
    scheduledTime: Date
  ): Promise<string> {
    const scheduleId = Math.random().toString(36).substr(2, 9);
    
    setTimeout(async () => {
      await this.sendLocalNotification(payload);
    }, scheduledTime.getTime() - Date.now());

    return scheduleId;
  }

  async sendBulkNotification(
    userTokens: string[],
    payload: NotificationPayload
  ): Promise<void> {
    // In a real implementation, this would send to Firebase Cloud Messaging
    console.log('Sending bulk notification to', userTokens.length, 'users');
    
    // For demo, just send local notification
    await this.sendLocalNotification(payload);
  }

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    console.log('Notification received:', notification);
  }

  private handleNotificationAction(action: ActionPerformed): void {
    console.log('Notification action:', action);
  }
}