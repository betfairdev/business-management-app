import { PlatformService } from '../platform/PlatformService';

export interface CacheConfig {
  defaultTTL: number; // seconds
  maxSize: number; // MB
  strategy: 'LRU' | 'FIFO' | 'TTL';
}

export interface CacheItem<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  size: number;
}

export class CacheService {
  private cache = new Map<string, CacheItem>();
  private config: CacheConfig;
  private currentSize = 0; // bytes

  constructor(config: CacheConfig) {
    this.config = config;
    this.loadFromStorage();
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const item: CacheItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      size: this.calculateSize(value),
    };

    // Check if we need to evict items
    await this.evictIfNeeded(item.size);

    this.cache.set(key, item);
    this.currentSize += item.size;

    await this.persistToStorage();
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined;

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      await this.delete(key);
      return null;
    }

    // Update timestamp for LRU strategy
    if (this.config.strategy === 'LRU') {
      item.timestamp = Date.now();
    }

    return item.value;
  }

  async delete(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    this.cache.delete(key);
    this.currentSize -= item.size;

    await this.persistToStorage();
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.currentSize = 0;
    await this.persistToStorage();
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    if (!item) {
      return false;
    }

    if (this.isExpired(item)) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  async keys(): Promise<string[]> {
    const validKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (!this.isExpired(item)) {
        validKeys.push(key);
      } else {
        await this.delete(key);
      }
    }

    return validKeys;
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  async getStats(): Promise<{
    itemCount: number;
    totalSize: number;
    maxSize: number;
    hitRate: number;
  }> {
    return {
      itemCount: this.cache.size,
      totalSize: this.currentSize,
      maxSize: this.config.maxSize * 1024 * 1024, // Convert MB to bytes
      hitRate: 0, // Would need to track hits/misses
    };
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl * 1000;
  }

  private calculateSize(value: any): number {
    // Rough estimation of object size in bytes
    return JSON.stringify(value).length * 2; // UTF-16 uses 2 bytes per character
  }

  private async evictIfNeeded(newItemSize: number): Promise<void> {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;

    while (this.currentSize + newItemSize > maxSizeBytes && this.cache.size > 0) {
      await this.evictOne();
    }
  }

  private async evictOne(): Promise<void> {
    let keyToEvict: string | null = null;

    switch (this.config.strategy) {
      case 'LRU':
        keyToEvict = this.findLRUKey();
        break;
      case 'FIFO':
        keyToEvict = this.findFIFOKey();
        break;
      case 'TTL':
        keyToEvict = this.findExpiredKey();
        break;
    }

    if (keyToEvict) {
      await this.delete(keyToEvict);
    }
  }

  private findLRUKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findFIFOKey(): string | null {
    return this.cache.keys().next().value || null;
  }

  private findExpiredKey(): string | null {
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        return key;
      }
    }
    return this.findLRUKey(); // Fallback to LRU if no expired items
  }

  private async persistToStorage(): Promise<void> {
    if (PlatformService.isNative()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const cacheData = Array.from(this.cache.entries());
        await Preferences.set({
          key: 'app_cache',
          value: JSON.stringify(cacheData),
        });
      } catch (error) {
        console.warn('Failed to persist cache to native storage:', error);
      }
    } else {
      try {
        const cacheData = Array.from(this.cache.entries());
        localStorage.setItem('app_cache', JSON.stringify(cacheData));
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }

  private async loadFromStorage(): Promise<void> {
    let cacheData: string | null = null;

    if (PlatformService.isNative()) {
      try {
        const { Preferences } = await import('@capacitor/preferences');
        const result = await Preferences.get({ key: 'app_cache' });
        cacheData = result.value;
      } catch (error) {
        console.warn('Failed to load cache from native storage:', error);
      }
    } else {
      cacheData = localStorage.getItem('app_cache');
    }

    if (cacheData) {
      try {
        const entries = JSON.parse(cacheData);
        this.cache = new Map(entries);
        this.currentSize = Array.from(this.cache.values())
          .reduce((total, item) => total + item.size, 0);
      } catch (error) {
        console.error('Failed to parse cached data:', error);
      }
    }
  }
}