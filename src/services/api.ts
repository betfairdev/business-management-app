import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
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
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.get(endpoint, { params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post(endpoint, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put(endpoint, data);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete(endpoint);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // File upload
  async upload<T>(endpoint: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      };

      const response = await this.api.post(endpoint, formData, config);
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  // Export data
  async export(endpoint: string, format: 'csv' | 'excel' | 'pdf', params?: any): Promise<Blob> {
    try {
      const response = await this.api.get(`${endpoint}/export`, {
        params: { format, ...params },
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  // Raw SQL query execution
  async executeQuery<T>(query: string, params?: any[]): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.post('/query/execute', { query, params });
      return response.data;
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private handleError(error: any): ApiResponse {
    console.error('API Error:', error);
    
    if (error.response) {
      return {
        success: false,
        error: error.response.data?.error || error.response.data?.message || 'Server error',
      };
    } else if (error.request) {
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    } else {
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }
}

export const apiService = new ApiService();