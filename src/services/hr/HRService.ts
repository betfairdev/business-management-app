import { getDataSource } from '../../config/database';
import { Employee } from '../../entities/Employee';
import { Attendance } from '../../entities/Attendance';
import { LeaveRequest, LeaveStatus } from '../../entities/LeaveRequest';
import { Department } from '../../entities/Department';
import { Position } from '../../entities/Position';

export interface EmployeePerformance {
  employee: Employee;
  attendanceRate: number;
  lateCount: number;
  leavesTaken: number;
  performanceScore: number;
}

export interface PayrollData {
  employee: Employee;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
}

export interface HRReport {
  totalEmployees: number;
  departmentWiseCount: Array<{ department: string; count: number }>;
  averageAttendance: number;
  pendingLeaves: number;
  newHires: number;
  resignations: number;
}

export class HRService {
  private dataSource = getDataSource();

  async getEmployeePerformance(employeeId: string, startDate: string, endDate: string): Promise<EmployeePerformance> {
    const employeeRepo = this.dataSource.getRepository(Employee);
    const attendanceRepo = this.dataSource.getRepository(Attendance);
    const leaveRepo = this.dataSource.getRepository(LeaveRequest);

    const employee = await employeeRepo.findOne({
      where: { id: employeeId },
      relations: ['department', 'position'],
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get attendance data
    const attendances = await attendanceRepo.find({
      where: {
        employee: { id: employeeId },
      },
      relations: ['employee'],
    });

    const periodAttendances = attendances.filter(a => 
      a.date >= startDate && a.date <= endDate
    );

    const totalWorkingDays = this.getWorkingDaysBetween(startDate, endDate);
    const presentDays = periodAttendances.length;
    const lateCount = periodAttendances.filter(a => a.isLate).length;
    const attendanceRate = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

    // Get leave data
    const leaves = await leaveRepo.find({
      where: {
        employee: { id: employeeId },
        status: LeaveStatus.APPROVED,
      },
    });

    const leavesTaken = leaves.filter(l => 
      l.startDate >= startDate && l.endDate <= endDate
    ).length;

    // Calculate performance score (simplified)
    const performanceScore = Math.max(0, 100 - (lateCount * 2) - (leavesTaken * 1));

    return {
      employee,
      attendanceRate,
      lateCount,
      leavesTaken,
      performanceScore,
    };
  }

  async generatePayroll(employeeId: string, month: string, year: string): Promise<PayrollData> {
    const employeeRepo = this.dataSource.getRepository(Employee);
    const attendanceRepo = this.dataSource.getRepository(Attendance);

    const employee = await employeeRepo.findOne({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    const attendances = await attendanceRepo.find({
      where: {
        employee: { id: employeeId },
      },
    });

    const monthAttendances = attendances.filter(a => 
      a.date >= startDate && a.date <= endDate
    );

    const workingDays = this.getWorkingDaysBetween(startDate, endDate);
    const presentDays = monthAttendances.length;
    const basicSalary = employee.salary || 0;
    const dailySalary = basicSalary / workingDays;
    const earnedSalary = dailySalary * presentDays;

    // Calculate allowances and deductions (simplified)
    const allowances = earnedSalary * 0.1; // 10% allowances
    const deductions = earnedSalary * 0.05; // 5% deductions
    const netSalary = earnedSalary + allowances - deductions;

    return {
      employee,
      basicSalary,
      allowances,
      deductions,
      netSalary,
      workingDays,
      presentDays,
    };
  }

  async getHRReport(startDate: string, endDate: string): Promise<HRReport> {
    const employeeRepo = this.dataSource.getRepository(Employee);
    const departmentRepo = this.dataSource.getRepository(Department);
    const attendanceRepo = this.dataSource.getRepository(Attendance);
    const leaveRepo = this.dataSource.getRepository(LeaveRequest);

    const totalEmployees = await employeeRepo.count();

    // Department-wise count
    const departments = await departmentRepo.find({ relations: ['employees'] });
    const departmentWiseCount = departments.map(dept => ({
      department: dept.name,
      count: dept.employees?.length || 0,
    }));

    // Average attendance
    const attendances = await attendanceRepo.find({
      relations: ['employee'],
    });

    const periodAttendances = attendances.filter(a => 
      a.date >= startDate && a.date <= endDate
    );

    const workingDays = this.getWorkingDaysBetween(startDate, endDate);
    const averageAttendance = totalEmployees > 0 && workingDays > 0 
      ? (periodAttendances.length / (totalEmployees * workingDays)) * 100 
      : 0;

    // Pending leaves
    const pendingLeaves = await leaveRepo.count({
      where: { status: LeaveStatus.PENDING },
    });

    // New hires and resignations (simplified - based on creation date)
    const newHires = await employeeRepo.count({
      where: {
        // createdAt: Between(new Date(startDate), new Date(endDate))
      },
    });

    return {
      totalEmployees,
      departmentWiseCount,
      averageAttendance,
      pendingLeaves,
      newHires,
      resignations: 0, // Would need resignation tracking
    };
  }

  async approveLeaveRequest(leaveId: string, managerId: string, comments?: string): Promise<LeaveRequest> {
    const leaveRepo = this.dataSource.getRepository(LeaveRequest);

    await leaveRepo.update(leaveId, {
      status: LeaveStatus.APPROVED,
      managerComments: comments,
    } as any);

    return await leaveRepo.findOne({
      where: { id: leaveId },
      relations: ['employee'],
    }) as LeaveRequest;
  }

  async rejectLeaveRequest(leaveId: string, managerId: string, comments?: string): Promise<LeaveRequest> {
    const leaveRepo = this.dataSource.getRepository(LeaveRequest);

    await leaveRepo.update(leaveId, {
      status: LeaveStatus.REJECTED,
      managerComments: comments,
    } as any);

    return await leaveRepo.findOne({
      where: { id: leaveId },
      relations: ['employee'],
    }) as LeaveRequest;
  }

  async markAttendance(employeeId: string, checkIn: string, checkOut?: string): Promise<Attendance> {
    const attendanceRepo = this.dataSource.getRepository(Attendance);
    const today = new Date().toISOString().split('T')[0];

    // Check if attendance already exists
    const existing = await attendanceRepo.findOne({
      where: {
        employee: { id: employeeId },
        date: today,
      },
    });

    if (existing) {
      if (checkOut) {
        existing.checkOut = checkOut;
        return await attendanceRepo.save(existing);
      }
      throw new Error('Attendance already marked for today');
    }

    const attendance = attendanceRepo.create({
      employee: { id: employeeId },
      date: today,
      checkIn,
      checkOut: checkOut || '',
      isLate: this.isLateCheckIn(checkIn),
      lateByMinutes: this.calculateLateMinutes(checkIn),
    } as any);

    return await attendanceRepo.save(attendance);
  }

  private getWorkingDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let workingDays = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
        workingDays++;
      }
    }

    return workingDays;
  }

  private isLateCheckIn(checkIn: string): boolean {
    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const standardTime = new Date(`1970-01-01T09:00:00`);
    return checkInTime > standardTime;
  }

  private calculateLateMinutes(checkIn: string): number {
    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const standardTime = new Date(`1970-01-01T09:00:00`);

    if (checkInTime <= standardTime) return 0;

    return Math.floor((checkInTime.getTime() - standardTime.getTime()) / (1000 * 60));
  }
}