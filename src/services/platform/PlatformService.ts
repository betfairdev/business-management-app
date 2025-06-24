import { Capacitor } from '@capacitor/core';

export interface PlatformConfig {
  isNative: boolean;
  isWeb: boolean;
  platform: 'web' | 'ios' | 'android' | 'electron';
  version: string;
  deviceInfo?: any;
}

export class PlatformService {
  private static config: PlatformConfig | null = null;

  static async initialize(): Promise<PlatformConfig> {
    if (this.config) return this.config;

    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();
    const isWeb = !isNative;

    let deviceInfo = null;
    if (isNative) {
      try {
        const { Device } = await import('@capacitor/device');
        deviceInfo = await Device.getInfo();
      } catch (error) {
        console.warn('Failed to get device info:', error);
      }
    }

    this.config = {
      isNative,
      isWeb,
      platform: platform as any,
      version: deviceInfo?.appVersion || '1.0.0',
      deviceInfo,
    };

    return this.config;
  }

  static getConfig(): PlatformConfig {
    if (!this.config) {
      throw new Error('PlatformService not initialized. Call initialize() first.');
    }
    return this.config;
  }

  static isNative(): boolean {
    return this.getConfig().isNative;
  }

  static isWeb(): boolean {
    return this.getConfig().isWeb;
  }

  static getPlatform(): string {
    return this.getConfig().platform;
  }

  static async getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
    if (this.isNative()) {
      try {
        const { Network } = await import('@capacitor/network');
        const status = await Network.getStatus();
        return {
          connected: status.connected,
          connectionType: status.connectionType,
        };
      } catch (error) {
        console.warn('Failed to get network status:', error);
        return { connected: true, connectionType: 'unknown' };
      }
    } else {
      return {
        connected: navigator.onLine,
        connectionType: 'unknown',
      };
    }
  }

  static async getDeviceInfo(): Promise<any> {
    if (this.isNative()) {
      try {
        const { Device } = await import('@capacitor/device');
        return await Device.getInfo();
      } catch (error) {
        console.warn('Failed to get device info:', error);
        return null;
      }
    } else {
      return {
        platform: 'web',
        operatingSystem: navigator.platform,
        osVersion: navigator.userAgent,
        manufacturer: 'unknown',
        model: 'web',
        isVirtual: false,
        webViewVersion: navigator.userAgent,
      };
    }
  }
}