import { apiService, ApiResponse, QueryParams } from './api';
import { Employee } from '../entities/Employee';
import { Attendance } from '../entities/Attendance';
import { LeaveRequest } from '../entities/LeaveRequest';

export interface EmployeeFilters {
  department?: string;
  position?: string;
  status?: string;
  hireDate?: {
    start: string;
    end: string;
  };
}

export interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  turnoverRate: number;
  averageSalary: number;
  departmentBreakdown: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
}

export interface PayrollData {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  payPeriod: string;
}

class HRService {
  private endpoint = '/employees';

  // Employee Management
  async getEmployees(params?: QueryParams & { filters?: EmployeeFilters }): Promise<ApiResponse<Employee[]>> {
    return apiService.get(this.endpoint, params);
  }

  async getEmployee(id: string): Promise<ApiResponse<Employee>> {
    return apiService.get(`${this.endpoint}/${id}`);
  }

  async createEmployee(employee: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiService.post(this.endpoint, employee);
  }

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<ApiResponse<Employee>> {
    return apiService.put(`${this.endpoint}/${id}`, employee);
  }

  async deleteEmployee(id: string): Promise<ApiResponse<void>> {
    return apiService.delete(`${this.endpoint}/${id}`);
  }

  async getHRStats(): Promise<ApiResponse<HRStats>> {
    return apiService.get(`${this.endpoint}/stats`);
  }

  // Attendance Management
  async getAttendance(params?: QueryParams & {
    employeeId?: string;
    dateRange?: { start: string; end: string };
  }): Promise<ApiResponse<Attendance[]>> {
    return apiService.get('/attendance', params);
  }

  async recordAttendance(attendance: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    return apiService.post('/attendance', attendance);
  }

  async updateAttendance(id: string, attendance: Partial<Attendance>): Promise<ApiResponse<Attendance>> {
    return apiService.put(`/attendance/${id}`, attendance);
  }

  async getEmployeeAttendance(employeeId: string, month: string): Promise<ApiResponse<any>> {
    return apiService.get(`${this.endpoint}/${employeeId}/attendance`, { month });
  }

  // Leave Management
  async getLeaveRequests(params?: QueryParams & {
    employeeId?: string;
    status?: string;
  }): Promise<ApiResponse<LeaveRequest[]>> {
    return apiService.get('/leave-requests', params);
  }

  async createLeaveRequest(request: Partial<LeaveRequest>): Promise<ApiResponse<LeaveRequest>> {
    return apiService.post('/leave-requests', request);
  }

  async updateLeaveRequest(id: string, request: Partial<LeaveRequest>): Promise<ApiResponse<LeaveRequest>> {
    return apiService.put(`/leave-requests/${id}`, request);
  }

  async approveLeaveRequest(id: string, comments?: string): Promise<ApiResponse<void>> {
    return apiService.post(`/leave-requests/${id}/approve`, { comments });
  }

  async rejectLeaveRequest(id: string, comments: string): Promise<ApiResponse<void>> {
    return apiService.post(`/leave-requests/${id}/reject`, { comments });
  }

  // Payroll
  async getPayroll(params?: QueryParams & {
    payPeriod?: string;
    employeeId?: string;
  }): Promise<ApiResponse<PayrollData[]>> {
    return apiService.get('/payroll', params);
  }

  async generatePayroll(payPeriod: string, employeeIds?: string[]): Promise<ApiResponse<PayrollData[]>> {
    return apiService.post('/payroll/generate', { payPeriod, employeeIds });
  }

  async processPayroll(payrollId: string): Promise<ApiResponse<void>> {
    return apiService.post(`/payroll/${payrollId}/process`);
  }

  // Performance Management
  async getPerformanceReviews(employeeId?: string): Promise<ApiResponse<any[]>> {
    return apiService.get('/performance-reviews', { employeeId });
  }

  async createPerformanceReview(review: {
    employeeId: string;
    reviewPeriod: string;
    goals: string[];
    achievements: string[];
    rating: number;
    comments: string;
  }): Promise<ApiResponse<any>> {
    return apiService.post('/performance-reviews', review);
  }

  // Training & Development
  async getTrainingPrograms(): Promise<ApiResponse<any[]>> {
    return apiService.get('/training-programs');
  }

  async enrollEmployee(employeeId: string, programId: string): Promise<ApiResponse<void>> {
    return apiService.post(`/training-programs/${programId}/enroll`, { employeeId });
  }

  // Reports & Analytics
  async getAttendanceReport(params: {
    startDate: string;
    endDate: string;
    departmentId?: string;
  }): Promise<ApiResponse<any>> {
    return apiService.get('/reports/attendance', params);
  }

  async getPayrollReport(payPeriod: string): Promise<ApiResponse<any>> {
    return apiService.get('/reports/payroll', { payPeriod });
  }

  async getTurnoverReport(year: number): Promise<ApiResponse<any>> {
    return apiService.get('/reports/turnover', { year });
  }

  // Export/Import
  async exportEmployees(format: 'csv' | 'excel' | 'pdf', filters?: EmployeeFilters): Promise<Blob> {
    return apiService.export(this.endpoint, format, filters);
  }

  async importEmployees(file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    return apiService.upload(`${this.endpoint}/import`, file, onProgress);
  }
}

export const hrService = new HRService();