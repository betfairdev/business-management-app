import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

export interface StorageOptions {
  encrypt?: boolean;
  expiry?: number; // in milliseconds
}

export interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expiry?: number;
}

export class StorageUtility {
  private static isNative = Capacitor.isNativePlatform();

  // Set item in storage
  static async setItem<T>(key: string, value: T, options: StorageOptions = {}): Promise<void> {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      expiry: options.expiry ? Date.now() + options.expiry : undefined,
    };

    const serialized = JSON.stringify(item);
    
    if (this.isNative) {
      await Preferences.set({ key, value: serialized });
    } else {
      localStorage.setItem(key, serialized);
    }
  }

  // Get item from storage
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      let serialized: string | null;

      if (this.isNative) {
        const result = await Preferences.get({ key });
        serialized = result.value;
      } else {
        serialized = localStorage.getItem(key);
      }

      if (!serialized) return null;

      const item: StorageItem<T> = JSON.parse(serialized);

      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        await this.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  }

  // Remove item from storage
  static async removeItem(key: string): Promise<void> {
    if (this.isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  // Clear all storage
  static async clear(): Promise<void> {
    if (this.isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }

  // Get all keys
  static async keys(): Promise<string[]> {
    if (this.isNative) {
      const result = await Preferences.keys();
      return result.keys;
    } else {
      return Object.keys(localStorage);
    }
  }

  // Check if key exists
  static async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  // Get storage size (approximate for web)
  static async getStorageSize(): Promise<number> {
    if (this.isNative) {
      // For native, we'd need to calculate based on all stored items
      const keys = await this.keys();
      let totalSize = 0;
      
      for (const key of keys) {
        const result = await Preferences.get({ key });
        if (result.value) {
          totalSize += new Blob([result.value]).size;
        }
      }
      
      return totalSize;
    } else {
      // For web, calculate localStorage size
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      return totalSize;
    }
  }

  // Batch operations
  static async setMultiple(items: Record<string, any>, options: StorageOptions = {}): Promise<void> {
    const promises = Object.entries(items).map(([key, value]) =>
      this.setItem(key, value, options)
    );
    await Promise.all(promises);
  }

  static async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    const promises = keys.map(async (key) => ({
      key,
      value: await this.getItem<T>(key),
    }));
    
    const results = await Promise.all(promises);
    return results.reduce((acc, { key, value }) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, T | null>);
  }

  static async removeMultiple(keys: string[]): Promise<void> {
    const promises = keys.map(key => this.removeItem(key));
    await Promise.all(promises);
  }

  // Cache utilities
  static async cache<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = 5 * 60 * 1000 // 5 minutes default
  ): Promise<T> {
    const cached = await this.getItem<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFunction();
    await this.setItem(key, fresh, { expiry: ttl });
    return fresh;
  }

  // Session storage (expires when app closes)
  static async setSessionItem<T>(key: string, value: T): Promise<void> {
    if (this.isNative) {
      // For native, we'll use a special prefix and clear on app start
      await this.setItem(`session_${key}`, value);
    } else {
      sessionStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
    }
  }

  static async getSessionItem<T>(key: string): Promise<T | null> {
    if (this.isNative) {
      return await this.getItem<T>(`session_${key}`);
    } else {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      
      try {
        const parsed = JSON.parse(item);
        return parsed.value;
      } catch {
        return null;
      }
    }
  }

  static async removeSessionItem(key: string): Promise<void> {
    if (this.isNative) {
      await this.removeItem(`session_${key}`);
    } else {
      sessionStorage.removeItem(key);
    }
  }

  // Clear expired items
  static async clearExpired(): Promise<void> {
    const keys = await this.keys();
    const now = Date.now();

    for (const key of keys) {
      try {
        let serialized: string | null;

        if (this.isNative) {
          const result = await Preferences.get({ key });
          serialized = result.value;
        } else {
          serialized = localStorage.getItem(key);
        }

        if (serialized) {
          const item: StorageItem = JSON.parse(serialized);
          if (item.expiry && now > item.expiry) {
            await this.removeItem(key);
          }
        }
      } catch (error) {
        // If we can't parse the item, it might be corrupted, so remove it
        await this.removeItem(key);
      }
    }
  }
}