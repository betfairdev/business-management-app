import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { DatabaseManager } from '../config/database';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private dbManager: DatabaseManager;
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.dbManager = DatabaseManager.getInstance({
      type: 'sqlite',
      sqliteConfig: {
        database: 'business_app.db',
        version: 1,
        encrypted: false,
        mode: 'no-encryption'
      }
    });

    this.setupInterceptors();
    this.setupNetworkListener();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  private setupNetworkListener(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async get<T>(endpoint: string, params?: any): Promise<ApiResponse<T>> {
    try {
      if (!this.isOnline) {
        return await this.getFromLocal(endpoint, params);
      }

      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.get(endpoint, { params });
      
      // Cache successful responses
      if (response.data.success) {
        await this.cacheData(endpoint, response.data);
      }

      return response.data;
    } catch (error) {
      console.error('API GET error:', error);
      return await this.getFromLocal(endpoint, params);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      if (!this.isOnline) {
        return await this.saveToLocal(endpoint, data, 'POST');
      }

      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('API POST error:', error);
      return await this.saveToLocal(endpoint, data, 'POST');
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      if (!this.isOnline) {
        return await this.saveToLocal(endpoint, data, 'PUT');
      }

      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error('API PUT error:', error);
      return await this.saveToLocal(endpoint, data, 'PUT');
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      if (!this.isOnline) {
        return await this.saveToLocal(endpoint, null, 'DELETE');
      }

      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error('API DELETE error:', error);
      return await this.saveToLocal(endpoint, null, 'DELETE');
    }
  }

  private async getFromLocal(endpoint: string, params?: any): Promise<ApiResponse> {
    try {
      const cachedData = await this.dbManager.select('api_cache', { endpoint });
      if (cachedData.length > 0) {
        return {
          success: true,
          data: JSON.parse(cachedData[0].data),
          message: 'Data retrieved from cache'
        };
      }
    } catch (error) {
      console.error('Local storage error:', error);
    }

    return {
      success: false,
      error: 'No cached data available and offline'
    };
  }

  private async saveToLocal(endpoint: string, data: any, method: string): Promise<ApiResponse> {
    try {
      await this.dbManager.insert('offline_queue', {
        endpoint,
        method,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Data queued for sync when online'
      };
    } catch (error) {
      console.error('Offline queue error:', error);
      return {
        success: false,
        error: 'Failed to queue data for offline sync'
      };
    }
  }

  private async cacheData(endpoint: string, data: any): Promise<void> {
    try {
      await this.dbManager.insert('api_cache', {
        endpoint,
        data: JSON.stringify(data),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Cache error:', error);
    }
  }

  private async syncOfflineData(): Promise<void> {
    try {
      const queuedItems = await this.dbManager.select('offline_queue');
      
      for (const item of queuedItems) {
        try {
          const data = JSON.parse(item.data);
          
          switch (item.method) {
            case 'POST':
              await this.axiosInstance.post(item.endpoint, data);
              break;
            case 'PUT':
              await this.axiosInstance.put(item.endpoint, data);
              break;
            case 'DELETE':
              await this.axiosInstance.delete(item.endpoint);
              break;
          }

          // Remove from queue after successful sync
          await this.dbManager.delete('offline_queue', { id: item.id });
        } catch (error) {
          console.error('Sync error for item:', item, error);
        }
      }
    } catch (error) {
      console.error('Offline sync error:', error);
    }
  }
}