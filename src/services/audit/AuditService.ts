import { getDataSource } from '../../config/database';
import { PlatformService } from '../platform/PlatformService';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  platform: string;
}

export class AuditService {
  private dataSource = getDataSource();
  private logs: AuditLog[] = [];

  async logAction(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }): Promise<void> {
    const deviceInfo = await PlatformService.getDeviceInfo();
    
    const auditLog: AuditLog = {
      id: this.generateId(),
      ...data,
      ipAddress: await this.getIpAddress(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      platform: PlatformService.getPlatform(),
    };

    // Store in memory for now (would use database in production)
    this.logs.push(auditLog);

    // Also store in localStorage for persistence
    this.persistLogs();

    console.log('Audit log created:', auditLog);
  }

  async getAuditLogs(filters?: {
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.entity) {
        filteredLogs = filteredLogs.filter(log => log.entity === filters.entity);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        filteredLogs = filteredLogs.slice(0, filters.limit);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async exportAuditLogs(format: 'json' | 'csv' = 'json'): Promise<string> {
    const logs = await this.getAuditLogs();

    if (format === 'csv') {
      const headers = ['ID', 'User ID', 'Action', 'Entity', 'Entity ID', 'Timestamp', 'Platform'];
      const rows = logs.map(log => [
        log.id,
        log.userId || '',
        log.action,
        log.entity,
        log.entityId || '',
        log.timestamp.toISOString(),
        log.platform,
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(logs, null, 2);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async getIpAddress(): Promise<string> {
    if (PlatformService.isWeb()) {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (error) {
        return 'unknown';
      }
    }
    return 'mobile-device';
  }

  private persistLogs(): void {
    try {
      localStorage.setItem('auditLogs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to persist audit logs:', error);
    }
  }

  async loadPersistedLogs(): Promise<void> {
    try {
      const stored = localStorage.getItem('auditLogs');
      if (stored) {
        this.logs = JSON.parse(stored).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
        }));
      }
    } catch (error) {
      console.error('Failed to load persisted audit logs:', error);
    }
  }
}