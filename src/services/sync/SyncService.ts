import { PlatformService } from '../platform/PlatformService';
import { getDataSource } from '../../config/database';

export interface SyncConfig {
  serverUrl?: string;
  apiKey?: string;
  syncInterval: number; // minutes
  autoSync: boolean;
  conflictResolution: 'server' | 'client' | 'manual';
}

export interface SyncStatus {
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  syncInProgress: boolean;
  errors: string[];
}

export class SyncService {
  private config: SyncConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private dataSource = getDataSource();

  constructor(config: SyncConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.config.autoSync) {
      this.startAutoSync();
    }

    // Listen for network changes
    if (PlatformService.isNative()) {
      try {
        const { Network } = await import('@capacitor/network');
        Network.addListener('networkStatusChange', (status) => {
          if (status.connected && this.config.autoSync) {
            this.syncNow();
          }
        });
      } catch (error) {
        console.warn('Failed to setup network listener:', error);
      }
    }
  }

  async syncNow(): Promise<void> {
    if (!this.config.serverUrl) {
      console.warn('No server URL configured for sync');
      return;
    }

    const networkStatus = await PlatformService.getNetworkStatus();
    if (!networkStatus.connected) {
      console.warn('No network connection available for sync');
      return;
    }

    try {
      console.log('Starting sync...');
      
      // Get pending changes
      const pendingChanges = await this.getPendingChanges();
      
      // Upload changes to server
      if (pendingChanges.length > 0) {
        await this.uploadChanges(pendingChanges);
      }

      // Download changes from server
      await this.downloadChanges();

      // Update last sync time
      localStorage.setItem('lastSync', new Date().toISOString());
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const lastSyncStr = localStorage.getItem('lastSync');
    const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
    const networkStatus = await PlatformService.getNetworkStatus();
    const pendingChanges = await this.getPendingChanges();

    return {
      lastSync,
      isOnline: networkStatus.connected,
      pendingChanges: pendingChanges.length,
      syncInProgress: false, // Would track actual sync state
      errors: [],
    };
  }

  private async getPendingChanges(): Promise<any[]> {
    // This would query for entities with pending sync flags
    // For now, return empty array
    return [];
  }

  private async uploadChanges(changes: any[]): Promise<void> {
    if (!this.config.serverUrl || !this.config.apiKey) return;

    const response = await fetch(`${this.config.serverUrl}/api/sync/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ changes }),
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  }

  private async downloadChanges(): Promise<void> {
    if (!this.config.serverUrl || !this.config.apiKey) return;

    const lastSync = localStorage.getItem('lastSync');
    const url = new URL(`${this.config.serverUrl}/api/sync/download`);
    if (lastSync) {
      url.searchParams.set('since', lastSync);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const { changes } = await response.json();
    await this.applyChanges(changes);
  }

  private async applyChanges(changes: any[]): Promise<void> {
    // Apply changes to local database
    for (const change of changes) {
      try {
        await this.applyChange(change);
      } catch (error) {
        console.error('Failed to apply change:', change, error);
      }
    }
  }

  private async applyChange(change: any): Promise<void> {
    const { entity, operation, data } = change;
    const repository = this.dataSource.getRepository(entity);

    switch (operation) {
      case 'create':
        await repository.save(data);
        break;
      case 'update':
        await repository.update(data.id, data);
        break;
      case 'delete':
        await repository.softDelete(data.id);
        break;
    }
  }

  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncNow().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }, this.config.syncInterval * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }
}