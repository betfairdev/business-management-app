import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  icon?: string;
  badge?: number;
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

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
    try {
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        await PushNotifications.register();

        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          this.sendTokenToServer(token.value);
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received: ', notification);
          this.handleNotificationReceived(notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed', notification);
          this.handleNotificationAction(notification);
        });
      }
    } catch (error) {
      console.error('Native notification initialization error:', error);
    }
  }

  private async initializeWeb(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        }
      } catch (error) {
        console.error('Web notification initialization error:', error);
      }
    }
  }

  async showLocalNotification(payload: NotificationPayload): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor Local Notifications plugin
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      await LocalNotifications.schedule({
        notifications: [{
          title: payload.title,
          body: payload.body,
          id: Date.now(),
          extra: payload.data,
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

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      // Send token to your backend
      const response = await fetch('/api/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) {
        throw new Error('Failed to register notification token');
      }
    } catch (error) {
      console.error('Error sending token to server:', error);
    }
  }

  private handleNotificationReceived(notification: any): void {
    // Handle foreground notification
    console.log('Notification received in foreground:', notification);
  }

  private handleNotificationAction(notification: any): void {
    // Handle notification tap/action
    console.log('Notification action performed:', notification);
    
    // Navigate to specific screen based on notification data
    if (notification.notification?.data?.route) {
      window.location.href = notification.notification.data.route;
    }
  }
}