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

export class NotificationService {
  private isInitialized = false;
  private fcmToken: string | null = null;

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
    // Request permission
    const permission = await PushNotifications.requestPermissions();
    
    if (permission.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();

      // Listen for registration
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        this.fcmToken = token.value;
      });

      // Listen for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Listen for push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received: ', notification);
        this.handleNotificationReceived(notification);
      });

      // Listen for notification actions
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push notification action performed', notification);
        this.handleNotificationAction(notification);
      });
    }
  }

  private async initializeWeb(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Request notification permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          // Get FCM token (would need Firebase SDK)
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
      // Use Capacitor Local Notifications plugin
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
      // Web notification
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

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // Handle received notification
    console.log('Notification received:', notification);
  }

  private handleNotificationAction(action: ActionPerformed): void {
    // Handle notification action
    console.log('Notification action:', action);
  }

  async sendBusinessNotification(type: 'sale' | 'low_stock' | 'new_customer', data: any): Promise<void> {
    const notifications: Record<string, NotificationPayload> = {
      sale: {
        title: 'New Sale!',
        body: `Sale of ${data.amount} completed`,
        data: { type: 'sale', saleId: data.id },
      },
      low_stock: {
        title: 'Low Stock Alert',
        body: `${data.productName} is running low (${data.quantity} left)`,
        data: { type: 'low_stock', productId: data.productId },
      },
      new_customer: {
        title: 'New Customer',
        body: `${data.customerName} joined your business`,
        data: { type: 'new_customer', customerId: data.customerId },
      },
    };

    const notification = notifications[type];
    if (notification) {
      await this.sendLocalNotification(notification);
    }
  }
}