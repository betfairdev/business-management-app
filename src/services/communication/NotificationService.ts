import { Capacitor } from '@capacitor/core';
import { PushNotifications, type PushNotificationSchema, type ActionPerformed } from '@capacitor/push-notifications';
import { getDataSource } from '../../config/database';
import { NotificationLog, NotificationType, NotificationStatus } from '../../entities/NotificationLog';

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

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey?: string;
}

export class NotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;
  private templates: NotificationTemplate[] = [];
  private dataSource = getDataSource();

  async initialize(firebaseConfig?: FirebaseConfig): Promise<void> {
    if (this.isInitialized) return;

    if (Capacitor.isNativePlatform()) {
      await this.initializeNative();
    } else {
      await this.initializeWeb(firebaseConfig);
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
        this.saveTokenToServer(token.value);
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

  private async initializeWeb(firebaseConfig?: FirebaseConfig): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window && firebaseConfig) {
      try {
        // Initialize Firebase (would need Firebase SDK)
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Web push notifications enabled');
          // Get FCM token (would need Firebase SDK)
          // this.fcmToken = await getToken(messaging, { vapidKey: firebaseConfig.vapidKey });
        }
      } catch (error) {
        console.error('Error initializing web push notifications:', error);
      }
    }
  }

  async getToken(): Promise<string | null> {
    return this.fcmToken;
  }

  async sendLocalNotification(payload: NotificationPayload, userId?: string): Promise<void> {
    try {
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

      // Log notification
      if (userId) {
        await this.logNotification({
          userId,
          type: NotificationType.IN_APP,
          title: payload.title,
          message: payload.body,
          data: payload.data,
          status: NotificationStatus.SENT,
        });
      }
    } catch (error) {
      console.error('Failed to send local notification:', error);
      if (userId) {
        await this.logNotification({
          userId,
          type: NotificationType.IN_APP,
          title: payload.title,
          message: payload.body,
          status: NotificationStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  async sendPushNotification(
    userTokens: string[],
    payload: NotificationPayload,
    userId?: string
  ): Promise<void> {
    try {
      // In a real implementation, this would send to Firebase Cloud Messaging
      console.log('Sending push notification to', userTokens.length, 'devices');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (userId) {
        await this.logNotification({
          userId,
          type: NotificationType.PUSH,
          title: payload.title,
          message: payload.body,
          data: payload.data,
          status: NotificationStatus.SENT,
        });
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
      if (userId) {
        await this.logNotification({
          userId,
          type: NotificationType.PUSH,
          title: payload.title,
          message: payload.body,
          status: NotificationStatus.FAILED,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  async sendBusinessNotification(
    type: 'sale' | 'low_stock' | 'new_customer' | 'payment_received' | 'order_placed' | 'stock_alert',
    data: any,
    userId?: string
  ): Promise<void> {
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
      order_placed: {
        title: 'New Order 📦',
        body: `Order #${data.orderNumber} placed by ${data.customerName}`,
        data: { type: 'order', orderId: data.id },
      },
      stock_alert: {
        title: 'Stock Alert 📊',
        body: `${data.productName} stock is ${data.status}`,
        data: { type: 'stock_alert', productId: data.productId },
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.sendLocalNotification(notification, userId);
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
    variables: Record<string, string>,
    userId?: string
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

    await this.sendLocalNotification({ title, body }, userId);
  }

  async scheduleNotification(
    payload: NotificationPayload,
    scheduledTime: Date,
    userId?: string
  ): Promise<string> {
    const scheduleId = Math.random().toString(36).substr(2, 9);
    
    setTimeout(async () => {
      await this.sendLocalNotification(payload, userId);
    }, scheduledTime.getTime() - Date.now());

    return scheduleId;
  }

  async getNotificationHistory(userId: string, limit: number = 50): Promise<NotificationLog[]> {
    const notificationRepo = this.dataSource.getRepository(NotificationLog);
    
    return await notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRepo = this.dataSource.getRepository(NotificationLog);
    
    await notificationRepo.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    } as any);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const notificationRepo = this.dataSource.getRepository(NotificationLog);
    
    return await notificationRepo.count({
      where: {
        userId,
        status: NotificationStatus.SENT,
      },
    });
  }

  private async logNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    status: NotificationStatus;
    channel?: string;
    recipient?: string;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const notificationRepo = this.dataSource.getRepository(NotificationLog);
      
      const log = notificationRepo.create({
        ...data,
        sentAt: data.status === NotificationStatus.SENT ? new Date() : undefined,
      } as any);

      await notificationRepo.save(log);
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  private async saveTokenToServer(token: string): Promise<void> {
    // In a real implementation, save token to your backend
    console.log('Saving FCM token to server:', token);
    localStorage.setItem('fcmToken', token);
  }

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    console.log('Notification received:', notification);
    
    // Handle notification based on type
    if (notification.data?.type) {
      this.handleBusinessNotification(notification.data.type, notification.data);
    }
  }

  private handleNotificationAction(action: ActionPerformed): void {
    console.log('Notification action:', action);
    
    // Handle notification actions (e.g., navigate to specific screen)
    if (action.notification.data?.type) {
      this.navigateToRelevantScreen(action.notification.data.type, action.notification.data);
    }
  }

  private handleBusinessNotification(type: string, data: any): void {
    // Handle different types of business notifications
    switch (type) {
      case 'sale':
        // Navigate to sales screen or show sale details
        break;
      case 'low_stock':
        // Navigate to inventory screen
        break;
      case 'new_customer':
        // Navigate to customer screen
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  }

  private navigateToRelevantScreen(type: string, data: any): void {
    // This would integrate with your router to navigate to relevant screens
    console.log('Navigate to screen for type:', type, 'with data:', data);
  }
}