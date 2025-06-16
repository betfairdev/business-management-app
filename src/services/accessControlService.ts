import { apiService, ApiResponse, QueryParams } from './api';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';

export interface AccessControlFilters {
  role?: string;
  status?: string;
  lastLogin?: {
    start: string;
    end: string;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: string;
  ipAddress: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

class AccessControlService {
  private endpoint = '/access-control';

  // User Management
  async getUsers(params?: QueryParams & { filters?: AccessControlFilters }): Promise<ApiResponse<User[]>> {
    return apiService.get('/users', params);
  }

  async getUser(id: string): Promise<ApiResponse<User>> {
    return apiService.get(`/users/${id}`);
  }

  async createUser(user: Partial<User>): Promise<ApiResponse<User>> {
    return apiService.post('/users', user);
  }

  async updateUser(id: string, user: Partial<User>): Promise<ApiResponse<User>> {
    return apiService.put(`/users/${id}`, user);
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/users/${id}`);
  }

  async activateUser(id: string): Promise<ApiResponse<void>> {
    return apiService.post(`/users/${id}/activate`);
  }

  async deactivateUser(id: string): Promise<ApiResponse<void>> {
    return apiService.post(`/users/${id}/deactivate`);
  }

  async resetPassword(id: string, newPassword?: string): Promise<ApiResponse<{ temporaryPassword?: string }>> {
    return apiService.post(`/users/${id}/reset-password`, { newPassword });
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return apiService.post('/users/change-password', { oldPassword, newPassword });
  }

  // Role Management
  async getRoles(params?: QueryParams): Promise<ApiResponse<Role[]>> {
    return apiService.get('/roles', params);
  }

  async getRole(id: string): Promise<ApiResponse<Role>> {
    return apiService.get(`/roles/${id}`);
  }

  async createRole(role: Partial<Role>): Promise<ApiResponse<Role>> {
    return apiService.post('/roles', role);
  }

  async updateRole(id: string, role: Partial<Role>): Promise<ApiResponse<Role>> {
    return apiService.put(`/roles/${id}`, role);
  }

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/roles/${id}`);
  }

  async assignRole(userId: string, roleId: string): Promise<ApiResponse<void>> {
    return apiService.post(`/users/${userId}/assign-role`, { roleId });
  }

  async removeRole(userId: string): Promise<ApiResponse<void>> {
    return apiService.post(`/users/${userId}/remove-role`);
  }

  // Permission Management
  async getPermissions(params?: QueryParams): Promise<ApiResponse<Permission[]>> {
    return apiService.get('/permissions', params);
  }

  async createPermission(permission: Partial<Permission>): Promise<ApiResponse<Permission>> {
    return apiService.post('/permissions', permission);
  }

  async updatePermission(id: string, permission: Partial<Permission>): Promise<ApiResponse<Permission>> {
    return apiService.put(`/permissions/${id}`, permission);
  }

  async deletePermission(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/permissions/${id}`);
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<ApiResponse<void>> {
    return apiService.post(`/roles/${roleId}/permissions`, { permissionId });
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<ApiResponse<void>> {
    return apiService.delete(`/roles/${roleId}/permissions/${permissionId}`);
  }

  async getUserPermissions(userId: string): Promise<ApiResponse<Permission[]>> {
    return apiService.get(`/users/${userId}/permissions`);
  }

  async checkPermission(userId: string, module: string, action: string): Promise<ApiResponse<{ allowed: boolean }>> {
    return apiService.get(`/users/${userId}/check-permission`, { module, action });
  }

  // Session Management
  async getUserSessions(userId?: string): Promise<ApiResponse<UserSession[]>> {
    return apiService.get(`${this.endpoint}/sessions`, { userId });
  }

  async terminateSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/sessions/${sessionId}`);
  }

  async terminateAllSessions(userId: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/sessions/user/${userId}`);
  }

  async getCurrentSession(): Promise<ApiResponse<UserSession>> {
    return apiService.get(`${this.endpoint}/sessions/current`);
  }

  // Audit Logs
  async getAuditLogs(params?: QueryParams & {
    userId?: string;
    action?: string;
    resource?: string;
    dateRange?: { start: string; end: string };
  }): Promise<ApiResponse<AuditLog[]>> {
    return apiService.get(`${this.endpoint}/audit-logs`, params);
  }

  async createAuditLog(log: {
    action: string;
    resource: string;
    details?: string;
  }): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/audit-logs`, log);
  }

  // Security Settings
  async getSecuritySettings(): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/security-settings`);
  }

  async updateSecuritySettings(settings: {
    passwordPolicy?: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expirationDays: number;
    };
    sessionTimeout?: number;
    maxLoginAttempts?: number;
    lockoutDuration?: number;
    twoFactorRequired?: boolean;
  }): Promise<ApiResponse<void>> {
    return apiService.put(`${this.endpoint}/security-settings`, settings);
  }

  // Two-Factor Authentication
  async enableTwoFactor(): Promise<ApiResponse<{ qrCode: string; secret: string }>> {
    return apiService.post(`${this.endpoint}/2fa/enable`);
  }

  async verifyTwoFactor(token: string): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/2fa/verify`, { token });
  }

  async disableTwoFactor(token: string): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/2fa/disable`, { token });
  }

  // Login Attempts
  async getLoginAttempts(userId?: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/login-attempts`, { userId });
  }

  async unlockUser(userId: string): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/unlock-user/${userId}`);
  }

  // Reports
  async getUserActivityReport(params: {
    startDate: string;
    endDate: string;
    userId?: string;
  }): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/reports/user-activity`, params);
  }

  async getSecurityReport(params: {
    startDate: string;
    endDate: string;
    reportType: 'login-attempts' | 'permission-changes' | 'security-events';
  }): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/reports/security`, params);
  }

  // Export/Import
  async exportUsers(format: 'csv' | 'excel' | 'pdf', filters?: AccessControlFilters): Promise<Blob> {
    return apiService.export('/users', format, filters);
  }

  async exportAuditLogs(format: 'csv' | 'excel' | 'pdf', params?: any): Promise<Blob> {
    return apiService.export(`${this.endpoint}/audit-logs`, format, params);
  }

  async importUsers(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return apiService.upload('/users/import', file, onProgress);
  }
}

export const accessControlService = new AccessControlService();