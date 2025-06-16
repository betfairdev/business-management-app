import { apiService, ApiResponse } from './api';

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf' | 'json';
  includeHeaders?: boolean;
  dateFormat?: string;
  currency?: string;
  filters?: Record<string, any>;
  columns?: string[];
}

export interface ImportOptions {
  skipFirstRow?: boolean;
  dateFormat?: string;
  currency?: string;
  mapping?: Record<string, string>;
  validateOnly?: boolean;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface ExportTemplate {
  id: string;
  name: string;
  entity: string;
  format: string;
  columns: string[];
  filters: Record<string, any>;
  isDefault: boolean;
}

class ExportImportService {
  private endpoint = '/export-import';

  // Export Operations
  async exportData(entity: string, options: ExportOptions): Promise<Blob> {
    try {
      const response = await apiService.export(`/${entity}`, options.format, {
        ...options.filters,
        columns: options.columns,
        includeHeaders: options.includeHeaders,
        dateFormat: options.dateFormat,
        currency: options.currency,
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  async exportCustomQuery(query: string, options: ExportOptions): Promise<Blob> {
    try {
      const response = await fetch(`${apiService['baseURL']}/export/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          query,
          format: options.format,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  async getExportTemplates(entity?: string): Promise<ApiResponse<ExportTemplate[]>> {
    return apiService.get(`${this.endpoint}/templates`, { entity });
  }

  async createExportTemplate(template: Omit<ExportTemplate, 'id'>): Promise<ApiResponse<ExportTemplate>> {
    return apiService.post(`${this.endpoint}/templates`, template);
  }

  async updateExportTemplate(id: string, template: Partial<ExportTemplate>): Promise<ApiResponse<ExportTemplate>> {
    return apiService.put(`${this.endpoint}/templates/${id}`, template);
  }

  async deleteExportTemplate(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/templates/${id}`);
  }

  async exportWithTemplate(templateId: string, additionalFilters?: Record<string, any>): Promise<Blob> {
    try {
      const response = await fetch(`${apiService['baseURL']}/export/template/${templateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ additionalFilters }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  // Import Operations
  async importData(
    entity: string,
    file: File,
    options: ImportOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<ImportResult>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve({ success: false, error: 'Invalid response format' });
            }
          } else {
            reject(new Error(`Import failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Import failed'));
        });

        xhr.open('POST', `${apiService['baseURL']}/${entity}/import`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`);
        xhr.send(formData);
      });
    } catch (error) {
      throw error;
    }
  }

  async validateImportFile(
    entity: string,
    file: File,
    options: ImportOptions = {}
  ): Promise<ApiResponse<ImportResult>> {
    return this.importData(entity, file, { ...options, validateOnly: true });
  }

  async getImportTemplate(entity: string, format: 'csv' | 'excel'): Promise<Blob> {
    try {
      const response = await fetch(`${apiService['baseURL']}/${entity}/import-template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get import template');
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  async getImportHistory(entity?: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/history`, { entity });
  }

  async getImportStatus(importId: string): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/status/${importId}`);
  }

  // Bulk Operations
  async bulkExport(entities: Array<{
    entity: string;
    options: ExportOptions;
  }>): Promise<Blob> {
    try {
      const response = await fetch(`${apiService['baseURL']}/export/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ entities }),
      });

      if (!response.ok) {
        throw new Error('Bulk export failed');
      }

      return await response.blob();
    } catch (error) {
      throw error;
    }
  }

  async bulkImport(
    imports: Array<{
      entity: string;
      file: File;
      options: ImportOptions;
    }>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<ImportResult[]>> {
    try {
      const formData = new FormData();
      
      imports.forEach((importItem, index) => {
        formData.append(`file_${index}`, importItem.file);
        formData.append(`entity_${index}`, importItem.entity);
        formData.append(`options_${index}`, JSON.stringify(importItem.options));
      });

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch {
              resolve({ success: false, error: 'Invalid response format' });
            }
          } else {
            reject(new Error(`Bulk import failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Bulk import failed'));
        });

        xhr.open('POST', `${apiService['baseURL']}/import/bulk`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`);
        xhr.send(formData);
      });
    } catch (error) {
      throw error;
    }
  }

  // Data Mapping
  async getFieldMapping(entity: string): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/field-mapping/${entity}`);
  }

  async saveFieldMapping(entity: string, mapping: Record<string, string>): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/field-mapping/${entity}`, { mapping });
  }

  // Scheduled Exports
  async getScheduledExports(): Promise<ApiResponse<any[]>> {
    return apiService.get(`${this.endpoint}/scheduled`);
  }

  async createScheduledExport(schedule: {
    name: string;
    entity: string;
    options: ExportOptions;
    schedule: string; // cron expression
    recipients: string[];
    isActive: boolean;
  }): Promise<ApiResponse<any>> {
    return apiService.post(`${this.endpoint}/scheduled`, schedule);
  }

  async updateScheduledExport(id: string, schedule: any): Promise<ApiResponse<any>> {
    return apiService.put(`${this.endpoint}/scheduled/${id}`, schedule);
  }

  async deleteScheduledExport(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/scheduled/${id}`);
  }

  async runScheduledExport(id: string): Promise<ApiResponse<void>> {
    return apiService.post(`${this.endpoint}/scheduled/${id}/run`);
  }

  // Utility Methods
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
      csv: 'csv',
      excel: 'xlsx',
      pdf: 'pdf',
      json: 'json',
    };
    return extensions[format] || 'txt';
  }

  generateFilename(entity: string, format: string, timestamp?: Date): string {
    const date = timestamp || new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    const extension = this.getFileExtension(format);
    return `${entity}_${dateStr}_${timeStr}.${extension}`;
  }
}

export const exportImportService = new ExportImportService();