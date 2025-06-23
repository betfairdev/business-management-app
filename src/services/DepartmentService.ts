import { BaseService } from './BaseService';
import { Department } from '../entities/Department';
import { CreateDepartmentDto } from '../dtos/CreateDepartmentDto';
import { UpdateDepartmentDto } from '../dtos/UpdateDepartmentDto';

  interface DepartmentStats {
    department: Department;
    totalEmployees: number;
    totalSalary: number;
    averageSalary: number;
  }

  interface DepartmentReport {
    id: string;
    name: string;
    description: string;
    employeeCount: number;
    totalSalary: number;
  }


export class DepartmentService extends BaseService<Department, CreateDepartmentDto, UpdateDepartmentDto> {
  constructor() {
    super(Department, CreateDepartmentDto, UpdateDepartmentDto, ['name', 'description']);
  }

  async findById(id: string): Promise<Department | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['employees'],
    });
  }

  async getDepartmentWithEmployees(id: string): Promise<Department | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['employees', 'employees.attendances', 'employees.leaveRequests'],
    });
  }

  async getDepartmentStats(id: string): Promise<DepartmentStats> {
    const department = await this.getDepartmentWithEmployees(id);

    if (!department) {
      throw new Error('Department not found');
    }

    const totalEmployees = department.employees?.length || 0;
    const totalSalary = department.employees?.reduce((sum, emp) => sum + (emp.salary || 0), 0) || 0;

    return {
      department,
      totalEmployees,
      totalSalary,
      averageSalary: totalEmployees > 0 ? totalSalary / totalEmployees : 0,
    };
  }

  async getDepartmentReport(): Promise<DepartmentReport[]> {
    const departments = await this.repository.find({
      relations: ['employees'],
    });

    return departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      description: dept.description ?? '',
      employeeCount: dept.employees?.length || 0,
      totalSalary: dept.employees?.reduce((sum, emp) => sum + (emp.salary || 0), 0) || 0,
    }));
  }
}
