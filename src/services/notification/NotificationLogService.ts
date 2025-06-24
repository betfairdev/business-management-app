import { BaseService } from '../core/BaseService';
import { NotificationLog, NotificationType, NotificationStatus } from '../../entities/NotificationLog';
import { CreateNotificationLogDto } from '../../dtos/CreateNotificationLogDto';
import { UpdateNotificationLogDto } from '../../dtos/UpdateNotificationLogDto';

export interface NotificationStats {
  totalNotifications: number;
  byType: Array<{ type: string; count: number }>;
  byStatus: Array<{ status: string; count: number }>;
  deliveryRate: number;
  readRate: number;
}

export class NotificationLogService extends BaseService<NotificationLog, CreateNotificationLogDto, UpdateNotificationLogDto> {
  constructor() {
    super(NotificationLog, CreateNotificationLogDto, UpdateNotificationLogDto, ['title', 'message']);
  }

  async logNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    channel?: string;
    recipient?: string;
  }): Promise<NotificationLog> {
    return await this.create({
      ...data,
      status: NotificationStatus.PENDING,
    } as CreateNotificationLogDto);
  }

  async markAsSent(notificationId: string): Promise<NotificationLog> {
    return await this.update(notificationId, {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    } as UpdateNotificationLogDto);
  }

  async markAsDelivered(notificationId: string): Promise<NotificationLog> {
    return await this.update(notificationId, {
      status: NotificationStatus.DELIVERED,
      deliveredAt: new Date(),
    } as UpdateNotificationLogDto);
  }

  async markAsRead(notificationId: string): Promise<NotificationLog> {
    return await this.update(notificationId, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    } as UpdateNotificationLogDto);
  }

  async markAsFailed(notificationId: string, errorMessage: string): Promise<NotificationLog> {
    return await this.update(notificationId, {
      status: NotificationStatus.FAILED,
      errorMessage,
    } as UpdateNotificationLogDto);
  }

  async getNotificationsByUser(userId: string, limit: number = 50): Promise<NotificationLog[]> {
    const result = await this.findAll({ query: userId, fields: ['userId'] }, { take: limit });
    return result.data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotifications(userId: string): Promise<NotificationLog[]> {
    const userNotifications = await this.getNotificationsByUser(userId);
    return userNotifications.filter(n => n.status !== NotificationStatus.READ);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const unread = await this.getUnreadNotifications(userId);
    return unread.length;
  }

  async markAllAsRead(userId: string): Promise<void> {
    const unread = await this.getUnreadNotifications(userId);
    const updates = unread.map(notification => ({
      id: notification.id,
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    }));

    await this.bulkUpdate(updates);
  }

  async getNotificationStats(userId?: string, startDate?: string, endDate?: string): Promise<NotificationStats> {
    const allNotifications = await this.findAll();
    let notifications = allNotifications.data;

    // Filter by user if provided
    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      notifications = notifications.filter(n => {
        const notificationDate = n.createdAt.toISOString().split('T')[0];
        if (startDate && notificationDate < startDate) return false;
        if (endDate && notificationDate > endDate) return false;
        return true;
      });
    }

    const totalNotifications = notifications.length;

    // Group by type
    const typeMap = new Map<string, number>();
    notifications.forEach(n => {
      typeMap.set(n.type, (typeMap.get(n.type) || 0) + 1);
    });

    const byType = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    // Group by status
    const statusMap = new Map<string, number>();
    notifications.forEach(n => {
      statusMap.set(n.status, (statusMap.get(n.status) || 0) + 1);
    });

    const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
    }));

    // Calculate delivery and read rates
    const sentNotifications = notifications.filter(n => 
      [NotificationStatus.SENT, NotificationStatus.DELIVERED, NotificationStatus.READ].includes(n.status)
    );
    const deliveredNotifications = notifications.filter(n => 
      [NotificationStatus.DELIVERED, NotificationStatus.READ].includes(n.status)
    );
    const readNotifications = notifications.filter(n => n.status === NotificationStatus.READ);

    const deliveryRate = totalNotifications > 0 ? (deliveredNotifications.length / totalNotifications) * 100 : 0;
    const readRate = sentNotifications.length > 0 ? (readNotifications.length / sentNotifications.length) * 100 : 0;

    return {
      totalNotifications,
      byType,
      byStatus,
      deliveryRate,
      readRate,
    };
  }

  async getNotificationsByType(type: NotificationType, userId?: string): Promise<NotificationLog[]> {
    const allNotifications = await this.findAll();
    let notifications = allNotifications.data.filter(n => n.type === type);

    if (userId) {
      notifications = notifications.filter(n => n.userId === userId);
    }

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const allNotifications = await this.findAll();
    const oldNotifications = allNotifications.data.filter(n => n.createdAt < cutoffDate);

    const idsToDelete = oldNotifications.map(n => n.id);
    await this.bulkDelete(idsToDelete);

    return oldNotifications.length;
  }

  async resendFailedNotifications(userId?: string): Promise<NotificationLog[]> {
    const allNotifications = await this.findAll();
    let failedNotifications = allNotifications.data.filter(n => n.status === NotificationStatus.FAILED);

    if (userId) {
      failedNotifications = failedNotifications.filter(n => n.userId === userId);
    }

    // Reset status to pending for retry
    const updates = failedNotifications.map(notification => ({
      id: notification.id,
      data: {
        status: NotificationStatus.PENDING,
        errorMessage: null,
      },
    }));

    await this.bulkUpdate(updates);

    return failedNotifications;
  }
}