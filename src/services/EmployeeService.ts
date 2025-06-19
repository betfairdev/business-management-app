import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Employee } from '../entities/Employee';
import { CreateEmployeeDto } from '../dtos/CreateEmployeeDto';
import { UpdateEmployeeDto } from '../dtos/UpdateEmployeeDto';
import { type FindManyOptions } from 'typeorm';

export class EmployeeService extends BaseService<Employee, CreateEmployeeDto, UpdateEmployeeDto> {
  constructor() {
    super(Employee, CreateEmployeeDto, UpdateEmployeeDto, ['name', 'email', 'phone']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Employee>
  ): Promise<PaginatedResult<Employee>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.store', 'store');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions = searchFields.map(field => `employee.${field} ILIKE :query`);
      qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
    }

    if (options?.sortBy) {
      qb = qb.orderBy(`employee.${options.sortBy}`, options.sortOrder || 'ASC');
    } else {
      qb = qb.orderBy('employee.createdAt', 'DESC');
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Employee | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['department', 'store', 'attendances', 'leaveRequests'],
    });
  }

  async create(createDto: CreateEmployeeDto): Promise<Employee> {
    const employeeData: any = {
      ...createDto,
      department: createDto.department ? { id: createDto.department } : undefined,
      store: createDto.store ? { id: createDto.store } : undefined,
      role: createDto.role ? { id: createDto.role } : undefined,
    };

    const employee = this.repository.create(employeeData);
    return await this.repository.save(employee);
  }

  async update(id: string, updateDto: UpdateEmployeeDto): Promise<Employee> {
    const updateData: any = {
      ...updateDto,
      department: updateDto.department ? { id: updateDto.department } : undefined,
      store: updateDto.store ? { id: updateDto.store } : undefined,
      role: updateDto.role ? { id: updateDto.role } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as Employee;
  }

  async getEmployeesByDepartment(departmentId: string): Promise<Employee[]> {
    return await this.repository.find({
      where: { department: { id: departmentId } },
      relations: ['department', 'store'],
    });
  }

  async getEmployeesByStore(storeId: string): Promise<Employee[]> {
    return await this.repository.find({
      where: { store: { id: storeId } },
      relations: ['department', 'store'],
    });
  }

  async getEmployeeAttendance(employeeId: string, startDate: string, endDate: string): Promise<any[]> {
    const employee = await this.repository.findOne({
      where: { id: employeeId },
      relations: ['attendances'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    return employee.attendances.filter(attendance => 
      attendance.date >= startDate && attendance.date <= endDate
    );
  }

  async getEmployeeLeaveRequests(employeeId: string): Promise<any[]> {
    const employee = await this.repository.findOne({
      where: { id: employeeId },
      relations: ['leaveRequests'],
    });

    return employee?.leaveRequests || [];
  }
}