import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Employee } from '../entities/Employee';
import { CreateEmployeeDto } from '../dtos/CreateEmployeeDto';
import { UpdateEmployeeDto } from '../dtos/UpdateEmployeeDto';

export class EmployeeService extends BaseService<Employee, CreateEmployeeDto, UpdateEmployeeDto> {
  constructor() {
    super(Employee, CreateEmployeeDto, UpdateEmployeeDto, ['name', 'email', 'phone']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions & { positionId?: string; departmentId?: string; storeId?: string }
  ): Promise<PaginatedResult<Employee>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.store', 'store')
      .leftJoinAndSelect('employee.position', 'position');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions = searchFields.map(field => `employee.${field} ILIKE :query`);
      qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
    }

    if (options?.positionId) {
      qb = qb.andWhere('position.id = :positionId', { positionId: options.positionId });
    }
    if (options?.departmentId) {
      qb = qb.andWhere('department.id = :departmentId', { departmentId: options.departmentId });
    }
    if (options?.storeId) {
      qb = qb.andWhere('store.id = :storeId', { storeId: options.storeId });
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
      where: { id },
      relations: ['department', 'position', 'store', 'attendances', 'leaveRequests'],
    });
  }

  async create(createDto: CreateEmployeeDto): Promise<Employee> {
    // Only assign foreign key fields, not objects
    const employeeData = {
      ...createDto,
      department: createDto.department,
      store: createDto.store,
      position: createDto.position,
      role: createDto.role,
    };

    const employee = this.repository.create(employeeData as unknown as Employee);
    return await this.repository.save(employee);
  }

  async update(id: string, updateDto: UpdateEmployeeDto): Promise<Employee> {
    // Only assign foreign key fields, not objects
    const updateData = {
      ...updateDto,
      department: updateDto.department,
      store: updateDto.store,
      position: updateDto.position,
      role: updateDto.role,
    };

    await this.repository.update(id, updateData as unknown as Employee);
    return await this.findById(id) as Employee;
  }

  async getEmployeeAttendance(employeeId: string, startDate: string, endDate: string): Promise<ReturnType<EmployeeService['findById']>> {
    const employee = await this.repository.findOne({
      where: { id: employeeId },
      relations: ['attendances'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Filter attendances by date range
    employee.attendances = employee.attendances.filter(attendance =>
      attendance.date >= startDate && attendance.date <= endDate
    );
    return employee;
  }

  async getEmployeeLeaveRequests(employeeId: string): Promise<Employee | null> {
    const employee = await this.repository.findOne({
      where: { id: employeeId },
      relations: ['leaveRequests'],
    });

    return employee;
  }
}
