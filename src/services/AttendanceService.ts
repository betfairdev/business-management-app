import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Attendance } from '../entities/Attendance';
import { CreateAttendanceDto } from '../dtos/CreateAttendanceDto';
import { UpdateAttendanceDto } from '../dtos/UpdateAttendanceDto';
import { type FindManyOptions } from 'typeorm';

export class AttendanceService extends BaseService<Attendance, CreateAttendanceDto, UpdateAttendanceDto> {
  constructor() {
    super(Attendance, CreateAttendanceDto, UpdateAttendanceDto, ['employee.name']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions,
    findOptions?: FindManyOptions<Attendance>
  ): Promise<PaginatedResult<Attendance>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee');

    if (options?.query && this.searchableFields.length > 0) {
      const searchFields = options.fields || this.searchableFields;
      const conditions: string[] = [];
      searchFields.forEach(field => {
        if (field.includes('.')) {
          const [alias, col] = field.split('.');
          conditions.push(`${alias}.${col} ILIKE :query`);
        } else {
          conditions.push(`attendance.${field} ILIKE :query`);
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
        qb = qb.orderBy(`attendance.${options.sortBy}`, options.sortOrder || 'ASC');
      }
    } else {
      qb = qb.orderBy('attendance.date', 'DESC');
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

  async findById(id: string): Promise<Attendance | null> {
    return await this.repository.findOne({
      where: { id } as any,
      relations: ['employee'],
    });
  }

  async create(createDto: CreateAttendanceDto): Promise<Attendance> {
    const attendanceData: any = {
      ...createDto,
      employee: { id: createDto.employee },
    };

    const attendance = this.repository.create(attendanceData);
    return await this.repository.save(attendance);
  }

  async update(id: string, updateDto: UpdateAttendanceDto): Promise<Attendance> {
    const updateData: any = {
      ...updateDto,
      employee: updateDto.employee ? { id: updateDto.employee } : undefined,
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as Attendance;
  }

  async getAttendanceByEmployee(employeeId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    return await this.repository.find({
      where: {
        employee: { id: employeeId },
        date: startDate, // Note: This would need proper date range query
      },
      relations: ['employee'],
      order: { date: 'DESC' },
    });
  }

  async getAttendanceReport(startDate: string, endDate: string): Promise<any> {
    const attendances = await this.repository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const totalAttendances = attendances.length;
    const lateAttendances = attendances.filter(att => att.isLate).length;
    const onTimeAttendances = totalAttendances - lateAttendances;

    return {
      totalAttendances,
      lateAttendances,
      onTimeAttendances,
      latePercentage: totalAttendances > 0 ? (lateAttendances / totalAttendances) * 100 : 0,
      attendances,
    };
  }

  async markAttendance(employeeId: string, checkIn: string, checkOut?: string): Promise<Attendance> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if attendance already exists for today
    const existingAttendance = await this.repository.findOne({
      where: {
        employee: { id: employeeId },
        date: today,
      },
    });

    if (existingAttendance) {
      if (checkOut) {
        existingAttendance.checkOut = checkOut;
        return await this.repository.save(existingAttendance);
      }
      throw new Error('Attendance already marked for today');
    }

    // Create new attendance
    const attendanceData: CreateAttendanceDto = {
      employee: employeeId,
      date: today,
      checkIn,
      checkOut: checkOut || '',
      isLate: this.isLateCheckIn(checkIn),
      lateByMinutes: this.calculateLateMinutes(checkIn),
    };

    return await this.create(attendanceData);
  }

  private isLateCheckIn(checkIn: string): boolean {
    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const standardTime = new Date(`1970-01-01T09:00:00`); // 9 AM standard
    return checkInTime > standardTime;
  }

  private calculateLateMinutes(checkIn: string): number {
    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const standardTime = new Date(`1970-01-01T09:00:00`); // 9 AM standard
    
    if (checkInTime <= standardTime) return 0;
    
    return Math.floor((checkInTime.getTime() - standardTime.getTime()) / (1000 * 60));
  }
}