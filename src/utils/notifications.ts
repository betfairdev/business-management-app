import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  vapidKey?: string; // For web push
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
  icon?: string;
  image?: string;
  tag?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export interface LocalNotificationOptions extends LocalNotificationSchema {
  schedule?: {
    at?: Date;
    repeats?: boolean;
    every?: 'year' | 'month' | 'two-weeks' | 'week' | 'day' | 'hour' | 'minute' | 'second';
  };
}

export class NotificationManager {
  private static instance: NotificationManager;
  private firebaseApp: FirebaseApp | null = null;
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;
  private listeners: Map<string, Function[]> = new Map();

  private constructor(private config?: FirebaseConfig) {
    this.initializeListeners();
  }

  static getInstance(config?: FirebaseConfig): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(config);
    }
    return NotificationManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Initialize Firebase if config provided
      if (this.config) {
        this.firebaseApp = initializeApp(this.config);
        if (Capacitor.getPlatform() === 'web') {
          this.messaging = getMessaging(this.firebaseApp);
        }
      }

      // Request permissions
      await this.requestPermissions();

      // Initialize push notifications for native platforms
      if (Capacitor.isNativePlatform()) {
        await this.initializePushNotifications();
      }

      // Initialize local notifications
      await this.initializeLocalNotifications();

      console.log('✅ Notification manager initialized');
    } catch (error) {
      console.error('❌ Notification initialization failed:', error);
      throw error;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('Push notification permissions not granted');
          return false;
        }
      }

      // Local notifications permissions
      let localPermStatus = await LocalNotifications.checkPermissions();
      if (localPermStatus.display === 'prompt') {
        localPermStatus = await LocalNotifications.requestPermissions();
      }

      return localPermStatus.display === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  private async initializePushNotifications(): Promise<void> {
    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // Get FCM token for this device
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      this.currentToken = token.value;
      this.emit('tokenReceived', token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
      this.emit('registrationError', error);
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received: ', notification);
      this.emit('notificationReceived', notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed', notification.actionId, notification.inputValue);
      this.emit('notificationActionPerformed', notification);
    });
  }

  private async initializeLocalNotifications(): Promise<void> {
    // Listen for local notification actions
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Local notification received:', notification);
      this.emit('localNotificationReceived', notification);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Local notification action performed:', notification);
      this.emit('localNotificationActionPerformed', notification);
    });
  }

  private initializeListeners(): void {
    if (this.messaging) {
      // Handle foreground messages for web
      onMessage(this.messaging, (payload) => {
        console.log('Message received in foreground:', payload);
        this.emit('foregroundMessage', payload);
      });
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (Capacitor.getPlatform() === 'web' && this.messaging) {
        const token = await getToken(this.messaging, {
          vapidKey: this.config?.vapidKey
        });
        this.currentToken = token;
        return token;
      }
      return this.currentToken;
    } catch (error) {
      console.error('Get token failed:', error);
      return null;
    }
  }

  async scheduleLocalNotification(options: LocalNotificationOptions): Promise<void> {
    try {
      const notification: LocalNotificationSchema = {
        id: options.id || Date.now(),
        title: options.title,
        body: options.body,
        largeBody: options.largeBody,
        summaryText: options.summaryText,
        sound: options.sound,
        smallIcon: options.smallIcon,
        iconColor: options.iconColor,
        attachments: options.attachments,
        actionTypeId: options.actionTypeId,
        extra: options.extra,
        schedule: options.schedule
      };

      await LocalNotifications.schedule({
        notifications: [notification]
      });

      console.log('Local notification scheduled:', notification.id);
    } catch (error) {
      console.error('Schedule local notification failed:', error);
      throw error;
    }
  }

  async cancelLocalNotification(id: number): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: id.toString() }]
      });
    } catch (error) {
      console.error('Cancel local notification failed:', error);
      throw error;
    }
  }

  async cancelAllLocalNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map(n => ({ id: n.id }))
        });
      }
    } catch (error) {
      console.error('Cancel all local notifications failed:', error);
      throw error;
    }
  }

  async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Get pending notifications failed:', error);
      return [];
    }
  }

  async getDeliveredNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      console.error('Get delivered notifications failed:', error);
      return [];
    }
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Utility methods
  async createNotificationChannel(options: {
    id: string;
    name: string;
    description?: string;
    importance?: number;
    sound?: string;
    vibration?: boolean;
    lights?: boolean;
    lightColor?: string;
  }): Promise<void> {
    try {
      await LocalNotifications.createChannel({
        id: options.id,
        name: options.name,
        description: options.description || '',
        importance: options.importance || 3,
        sound: options.sound,
        vibration: options.vibration !== false,
        lights: options.lights !== false,
        lightColor: options.lightColor
      });
    } catch (error) {
      console.error('Create notification channel failed:', error);
      throw error;
    }
  }

  async deleteNotificationChannel(channelId: string): Promise<void> {
    try {
      await LocalNotifications.deleteChannel({ id: channelId });
    } catch (error) {
      console.error('Delete notification channel failed:', error);
      throw error;
    }
  }

  async listNotificationChannels(): Promise<any[]> {
    try {
      const result = await LocalNotifications.listChannels();
      return result.channels;
    } catch (error) {
      console.error('List notification channels failed:', error);
      return [];
    }
  }

  // Quick notification methods
  async showInstantNotification(title: string, body: string, data?: any): Promise<void> {
    await this.scheduleLocalNotification({
      id: Date.now(),
      title,
      body,
      extra: data,
      schedule: { at: new Date(Date.now() + 1000) } // 1 second delay
    });
  }

  async showDelayedNotification(title: string, body: string, delayMs: number, data?: any): Promise<void> {
    await this.scheduleLocalNotification({
      id: Date.now(),
      title,
      body,
      extra: data,
      schedule: { at: new Date(Date.now() + delayMs) }
    });
  }

  async showRepeatingNotification(title: string, body: string, interval: 'day' | 'week' | 'month', data?: any): Promise<void> {
    await this.scheduleLocalNotification({
      id: Date.now(),
      title,
      body,
      extra: data,
      schedule: {
        at: new Date(Date.now() + 60000), // Start in 1 minute
        repeats: true,
        every: interval
      }
    });
  }
}