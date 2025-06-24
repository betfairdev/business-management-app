import { getDataSource } from '../../config/database';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface BackupOptions {
  includeImages?: boolean;
  includeSettings?: boolean;
  compress?: boolean;
  encrypt?: boolean;
  password?: string;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  tables: string[];
  recordCount: number;
}

export class BackupService {
  private dataSource = getDataSource();

  async createBackup(options: BackupOptions = {}): Promise<BackupInfo> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;

    try {
      // Get all entities
      const entities = this.dataSource.entityMetadatas;
      const backupData: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const entity of entities) {
        const repository = this.dataSource.getRepository(entity.target);
        const data = await repository.find();
        backupData[entity.tableName] = data;
        totalRecords += data.length;
      }

      // Include settings if requested
      if (options.includeSettings) {
        const settings = localStorage.getItem('appSettings');
        if (settings) {
          backupData._settings = JSON.parse(settings);
        }
      }

      const backupContent = JSON.stringify(backupData, null, 2);
      
      // Save to device
      await Filesystem.writeFile({
        path: `backups/${filename}`,
        data: backupContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const backupInfo: BackupInfo = {
        id: timestamp,
        filename,
        size: new Blob([backupContent]).size,
        createdAt: new Date(),
        tables: entities.map(e => e.tableName),
        recordCount: totalRecords,
      };

      // Store backup info
      const backupList = await this.getBackupList();
      backupList.push(backupInfo);
      await this.saveBackupList(backupList);

      return backupInfo;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Failed to create backup');
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      const backupList = await this.getBackupList();
      const backupInfo = backupList.find(b => b.id === backupId);
      
      if (!backupInfo) {
        throw new Error('Backup not found');
      }

      // Read backup file
      const result = await Filesystem.readFile({
        path: `backups/${backupInfo.filename}`,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const backupData = JSON.parse(result.data as string);

      // Clear existing data
      await this.clearDatabase();

      // Restore data
      for (const [tableName, records] of Object.entries(backupData)) {
        if (tableName.startsWith('_')) continue; // Skip metadata

        const entity = this.dataSource.entityMetadatas.find(e => e.tableName === tableName);
        if (entity) {
          const repository = this.dataSource.getRepository(entity.target);
          await repository.save(records as any[]);
        }
      }

      // Restore settings
      if (backupData._settings) {
        localStorage.setItem('appSettings', JSON.stringify(backupData._settings));
      }

      console.log('Backup restored successfully');
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw new Error('Failed to restore backup');
    }
  }

  async getBackupList(): Promise<BackupInfo[]> {
    try {
      const result = await Filesystem.readFile({
        path: 'backups/backup-list.json',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      return JSON.parse(result.data as string);
    } catch {
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    const backupList = await this.getBackupList();
    const backupInfo = backupList.find(b => b.id === backupId);
    
    if (!backupInfo) {
      throw new Error('Backup not found');
    }

    // Delete file
    await Filesystem.deleteFile({
      path: `backups/${backupInfo.filename}`,
      directory: Directory.Documents,
    });

    // Update backup list
    const updatedList = backupList.filter(b => b.id !== backupId);
    await this.saveBackupList(updatedList);
  }

  async shareBackup(backupId: string): Promise<void> {
    const backupList = await this.getBackupList();
    const backupInfo = backupList.find(b => b.id === backupId);
    
    if (!backupInfo) {
      throw new Error('Backup not found');
    }

    const fileUri = await Filesystem.getUri({
      directory: Directory.Documents,
      path: `backups/${backupInfo.filename}`,
    });

    await Share.share({
      title: 'Business Data Backup',
      text: 'Sharing business data backup file',
      url: fileUri.uri,
    });
  }

  async scheduleAutoBackup(intervalDays: number): Promise<void> {
    // Store auto-backup settings
    const settings = {
      enabled: true,
      intervalDays,
      lastBackup: new Date().toISOString(),
    };

    localStorage.setItem('autoBackupSettings', JSON.stringify(settings));

    // In a real app, you'd set up a background task
    console.log(`Auto-backup scheduled every ${intervalDays} days`);
  }

  async checkAutoBackup(): Promise<void> {
    const settings = localStorage.getItem('autoBackupSettings');
    if (!settings) return;

    const { enabled, intervalDays, lastBackup } = JSON.parse(settings);
    if (!enabled) return;

    const daysSinceLastBackup = Math.floor(
      (Date.now() - new Date(lastBackup).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastBackup >= intervalDays) {
      await this.createBackup();
      
      const updatedSettings = {
        enabled,
        intervalDays,
        lastBackup: new Date().toISOString(),
      };
      localStorage.setItem('autoBackupSettings', JSON.stringify(updatedSettings));
    }
  }

  private async saveBackupList(backupList: BackupInfo[]): Promise<void> {
    await Filesystem.writeFile({
      path: 'backups/backup-list.json',
      data: JSON.stringify(backupList, null, 2),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    });
  }

  private async clearDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;
    
    // Disable foreign key checks
    await this.dataSource.query('PRAGMA foreign_keys = OFF');

    try {
      for (const entity of entities) {
        await this.dataSource.query(`DELETE FROM ${entity.tableName}`);
      }
    } finally {
      // Re-enable foreign key checks
      await this.dataSource.query('PRAGMA foreign_keys = ON');
    }
  }
}