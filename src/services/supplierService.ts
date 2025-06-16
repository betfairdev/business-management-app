import { apiService, ApiResponse, QueryParams } from './api';
import { Supplier } from '../entities/Supplier';

export interface SupplierFilters {
  supplierType?: string;
  status?: string;
  location?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchases: number;
  averageOrderValue: number;
  topSuppliers: Array<{
    id: string;
    name: string;
    totalPurchased: number;
    orderCount: number;
    rating: number;
  }>;
}

export interface SupplierPerformance {
  supplierId: string;
  onTimeDelivery: number;
  qualityRating: number;
  priceCompetitiveness: number;
  overallRating: number;
  totalOrders: number;
  totalValue: number;
}

class SupplierService {
  private endpoint = '/suppliers';

  async getSuppliers(params?: QueryParams & { filters?: SupplierFilters }): Promise<ApiResponse<Supplier[]>> {
    return apiService.get(this.endpoint, params);
  }

  async getSupplier(id: string): Promise<ApiResponse<Supplier>> {
    return apiService.get(`${this.endpoint}/${id}`);
  }

  async createSupplier(supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    return apiService.post(this.endpoint, supplier);
  }

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<ApiResponse<Supplier>> {
    return apiService.put(`${this.endpoint}/${id}`, supplier);
  }

  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/${id}`);
  }

  async getSupplierStats(): Promise<ApiResponse<SupplierStats>> {
    return apiService.get(`${this.endpoint}/stats`);
  }

  async getSupplierPerformance(supplierId: string): Promise<ApiResponse<SupplierPerformance>> {
    return apiService.get(`${this.endpoint}/${supplierId}/performance`);
  }

  async getSupplierPurchases(supplierId: string, params?: QueryParams): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/${supplierId}/purchases`, params);
  }

  async getSupplierProducts(supplierId: string, params?: QueryParams): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/${supplierId}/products`, params);
  }

  async rateSupplier(supplierId: string, rating: {
    onTimeDelivery: number;
    quality: number;
    price: number;
    communication: number;
    comments?: string;
  }): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/${supplierId}/rating`, rating);
  }

  async getSupplierContracts(supplierId: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/${supplierId}/contracts`);
  }

  async createSupplierContract(supplierId: string, contract: {
    title: string;
    startDate: string;
    endDate: string;
    terms: string;
    value: number;
    status: string;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/${supplierId}/contracts`, contract);
  }

  async exportSuppliers(format: 'csv' | 'excel' | 'pdf', filters?: SupplierFilters): Promise<Blob> {
    return apiService.export(this.endpoint, format, filters);
  }

  async importSuppliers(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return apiService.upload(`${this.endpoint}/import`, file, onProgress);
  }

  async getSupplierComparison(supplierIds: string[]): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/compare`, { supplierIds });
  }
}

export const supplierService = new SupplierService();