import { apiService, ApiResponse, QueryParams } from './api';
import { Customer } from '../entities/Customer';

export interface CustomerFilters {
  customerType?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newThisMonth: number;
  totalSales: number;
  averageOrderValue: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalSpent: number;
    orderCount: number;
  }>;
}

export interface CustomerActivity {
  id: string;
  customerId: string;
  type: 'sale' | 'return' | 'contact' | 'note';
  description: string;
  amount?: number;
  date: string;
  createdBy: string;
}

class CRMService {
  private endpoint = '/customers';

  async getCustomers(params?: QueryParams & { filters?: CustomerFilters }): Promise<ApiResponse<Customer[]>> {
    return apiService.get(this.endpoint, params);
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return apiService.get(`${this.endpoint}/${id}`);
  }

  async createCustomer(customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return apiService.post(this.endpoint, customer);
  }

  async updateCustomer(id: string, customer: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return apiService.put(`${this.endpoint}/${id}`, customer);
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/${id}`);
  }

  async getCustomerStats(): Promise<ApiResponse<CustomerStats>> {
    return apiService.get(`${this.endpoint}/stats`);
  }

  async getCustomerActivity(customerId: string): Promise<ApiResponse<CustomerActivity[]>> {
    return apiService.get(`${this.endpoint}/${customerId}/activity`);
  }

  async addCustomerNote(customerId: string, note: string): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/${customerId}/notes`, { note });
  }

  async getCustomerSales(customerId: string, params?: QueryParams): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/${customerId}/sales`, params);
  }

  async getCustomerReturns(customerId: string, params?: QueryParams): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/${customerId}/returns`, params);
  }

  async exportCustomers(format: 'csv' | 'excel' | 'pdf', filters?: CustomerFilters): Promise<Blob> {
    return apiService.export(this.endpoint, format, filters);
  }

  async importCustomers(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return apiService.upload(`${this.endpoint}/import`, file, onProgress);
  }

  async mergeCustomers(primaryId: string, duplicateId: string): Promise<ApiResponse<Customer>> {
    return apiService.post(`${this.endpoint}/${primaryId}/merge`, { duplicateId });
  }

  async getCustomerSegments(): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/segments`);
  }

  async createCustomerSegment(segment: {
    name: string;
    criteria: Record<string, any>;
    description?: string;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/segments`, segment);
  }
}

export const crmService = new CRMService();