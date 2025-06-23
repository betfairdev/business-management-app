import { BaseService, type PaginationOptions, type PaginatedResult, type SearchOptions } from './BaseService';
import { Attendance } from '../entities/Attendance';
import { CreateAttendanceDto } from '../dtos/CreateAttendanceDto';
import { UpdateAttendanceDto } from '../dtos/UpdateAttendanceDto';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

  interface AttendanceReport {
    totalAttendances: number;
    lateAttendances: number;
    onTimeAttendances: number;
    latePercentage: number;
    attendances: Attendance[];
  }

export class AttendanceService extends BaseService<Attendance, CreateAttendanceDto, UpdateAttendanceDto> {
  constructor() {
    super(Attendance, CreateAttendanceDto, UpdateAttendanceDto, ['employee.name']);
  }

  async findAll(
    options?: PaginationOptions & SearchOptions & { date?: string; startDate?: string; endDate?: string; employeeId?: string },
  ): Promise<PaginatedResult<Attendance>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    let qb = this.repository.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee');

    // Search
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

    // Date filter (today or any specific date)
    if (options?.date) {
      qb = qb.andWhere('attendance.date = :date', { date: options.date });
    }
    // Date range filter
    if (options?.startDate && options?.endDate) {
      qb = qb.andWhere('attendance.date BETWEEN :startDate AND :endDate', { startDate: options.startDate, endDate: options.endDate });
    }
    // Employee filter
    if (options?.employeeId) {
      qb = qb.andWhere('employee.id = :employeeId', { employeeId: options.employeeId });
    }

    // Sorting
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
      where: { id: id },
      relations: ['employee'],
    });
  }

  async create(createDto: CreateAttendanceDto): Promise<Attendance> {
    const attendanceData = {
      ...createDto,
      employee: { id: createDto.employee },
    };

    const attendance = this.repository.create(attendanceData);
    return await this.repository.save(attendance as Attendance);
  }
  // No additional code needed here for basic CRUD.
  async update(id: string, updateDto: UpdateAttendanceDto): Promise<Attendance> {
    // build a deep-partial that matches Attendance, with employee as a nested partial
    const updateData: QueryDeepPartialEntity<Attendance> = {
      ...updateDto,
      employee: { id: updateDto.employee },
    };

    await this.repository.update(id, updateData);
    return await this.findById(id) as Attendance;
  }

  async getAttendanceByEmployee(employeeId: string, startDate: string, endDate: string): Promise<Attendance[]> {
    return await this.repository.createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('employee.id = :employeeId', { employeeId })
      .andWhere('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('attendance.date', 'DESC')
      .getMany();
  }

  async getAttendanceReport(startDate: string, endDate: string, employeeId?: string): Promise<AttendanceReport> {
    let qb = this.repository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (employeeId) {
      qb = qb.andWhere('employee.id = :employeeId', { employeeId });
    }

    const attendances = await qb.getMany();

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
