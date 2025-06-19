import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { LeaveRequest } from '../entities/LeaveRequest';
import { CreateLeaveRequestDto } from '../dtos/CreateLeaveRequestDto';
import { UpdateLeaveRequestDto } from '../dtos/UpdateLeaveRequestDto';
import { type FindManyOptions } from 'typeorm';

export class LeaveRequestService extends BaseService<LeaveRequest, CreateLeaveRequestDto, UpdateLeaveRequestDto> {
  constructor() {
    super(LeaveRequest, CreateLeaveRequestDto, UpdateLeaveRequestDto, ['employee.name', 'reason']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<LeaveRequest>
  ): Promise<PaginatedResult<LeaveRequest>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('leaveRequest')
      .leftJoinAndSelect('leaveRequest.employee', 'employee');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`leaveRequest.${field} ILIKE :query`);
        }
      });
      if (conditions.length > 0) {
        qb = qb.andWhere(`(${conditions.join(' OR ')})`, { query: `%${options.query}%` });
      }
    }

    if (options?.sortBy) {
      if (options.sortBy.includes('.')) {
        const [alias, col] = options.sortBy.split('.');
        qb = qb.orderBy(`${alias}.${col}`, options.sortOrder || 'ASC');
      } else {
        qb = qb.orderBy(`leaveRequest.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('leaveRequest.createdAt', 'DESC');
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

  async findById(id: string): Promise<LeaveRequest | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['employee'],
    });
  }

  async create(createDto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    const leaveData: any = {
      ...createDto,
      employee: { id: createDto.employee },
    };

    const leaveRequest = this.repository.create(leaveData);
    return await this.repository.save(leaveRequest);
  }

  async update(id: string, updateDto: UpdateLeaveRequestDto): Promise<LeaveRequest> {
    const updateData: any = {
      ...updateDto,
      employee: updateDto.employee ? { id: updateDto.employee } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as LeaveRequest;
  }

  async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return await this.repository.find({
      where: { employee: { id: employeeId } },
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return await this.repository.find({
      where: { status: 'Pending' },
      relations: ['employee'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveLeaveRequest(id: string, managerComments?: string): Promise<LeaveRequest> {
    await this.repository.update(id, {
      status: 'Approved',
      managerComments,
    } as any);

    return await this.findById(id) as LeaveRequest;
  }

  async rejectLeaveRequest(id: string, managerComments?: string): Promise<LeaveRequest> {
    await this.repository.update(id, {
      status: 'Rejected',
      managerComments,
    } as any);

    return await this.findById(id) as LeaveRequest;
  }

  async getLeaveReport(startDate: string, endDate: string): Promise<any> {
    const leaveRequests = await this.repository
      .createQueryBuilder('leaveRequest')
      .leftJoinAndSelect('leaveRequest.employee', 'employee')
      .where('leaveRequest.startDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const totalRequests = leaveRequests.length;
    const approvedRequests = leaveRequests.filter(req => req.status === 'Approved').length;
    const rejectedRequests = leaveRequests.filter(req => req.status === 'Rejected').length;
    const pendingRequests = leaveRequests.filter(req => req.status === 'Pending').length;

    return {
      totalRequests,
      approvedRequests,
      rejectedRequests,
      pendingRequests,
      approvalRate: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
      leaveRequests,
    };
  }
}