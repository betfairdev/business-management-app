import { format, formatDistanceToNow, parseISO, isValid, addDays, addWeeks, addMonths, addYears, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays, differenceInHours, differenceInMinutes, isBefore, isAfter, isSameDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime, format as formatTz } from 'date-fns-tz';

export interface DateTimeConfig {
  defaultTimezone?: string;
  defaultLocale?: string;
  defaultFormat?: string;
  use24Hour?: boolean;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export class DateTimeUtil {
  private static config: DateTimeConfig = {
    defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    defaultLocale: 'en-US',
    defaultFormat: 'yyyy-MM-dd HH:mm:ss',
    use24Hour: true
  };

  static configure(config: Partial<DateTimeConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static getConfig(): DateTimeConfig {
    return { ...this.config };
  }

  // Current date/time utilities
  static now(timezone?: string): Date {
    const tz = timezone || this.config.defaultTimezone!;
    return utcToZonedTime(new Date(), tz);
  }

  static utcNow(): Date {
    return new Date();
  }

  static today(timezone?: string): Date {
    return startOfDay(this.now(timezone));
  }

  static tomorrow(timezone?: string): Date {
    return addDays(this.today(timezone), 1);
  }

  static yesterday(timezone?: string): Date {
    return addDays(this.today(timezone), -1);
  }

  // Formatting utilities
  static format(date: Date | string, formatStr?: string, timezone?: string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }

    const fmt = formatStr || this.config.defaultFormat!;
    const tz = timezone || this.config.defaultTimezone!;

    if (timezone) {
      return formatTz(utcToZonedTime(dateObj, tz), fmt, { timeZone: tz });
    }

    return format(dateObj, fmt);
  }

  static formatRelative(date: Date | string, baseDate?: Date): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }

    return formatDistanceToNow(dateObj, { 
      addSuffix: true,
      includeSeconds: true
    });
  }

  static formatTime(date: Date | string, timezone?: string): string {
    const timeFormat = this.config.use24Hour ? 'HH:mm' : 'h:mm a';
    return this.format(date, timeFormat, timezone);
  }

  static formatDate(date: Date | string, timezone?: string): string {
    return this.format(date, 'yyyy-MM-dd', timezone);
  }

  static formatDateTime(date: Date | string, timezone?: string): string {
    const timeFormat = this.config.use24Hour ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd h:mm a';
    return this.format(date, timeFormat, timezone);
  }

  static formatLong(date: Date | string, timezone?: string): string {
    const timeFormat = this.config.use24Hour ? 'EEEE, MMMM do, yyyy \'at\' HH:mm' : 'EEEE, MMMM do, yyyy \'at\' h:mm a';
    return this.format(date, timeFormat, timezone);
  }

  // Parsing utilities
  static parse(dateString: string, formatStr?: string): Date {
    if (!formatStr) {
      const parsed = parseISO(dateString);
      if (isValid(parsed)) {
        return parsed;
      }
      // Try common formats
      const commonFormats = [
        'yyyy-MM-dd',
        'yyyy-MM-dd HH:mm',
        'yyyy-MM-dd HH:mm:ss',
        'MM/dd/yyyy',
        'dd/MM/yyyy',
        'yyyy/MM/dd'
      ];
      
      for (const fmt of commonFormats) {
        try {
          // Note: date-fns parse requires a reference date
          const parsed = new Date(dateString);
          if (isValid(parsed)) {
            return parsed;
          }
        } catch {
          continue;
        }
      }
      throw new Error(`Unable to parse date: ${dateString}`);
    }
    
    const parsed = new Date(dateString);
    if (!isValid(parsed)) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    return parsed;
  }

  static isValidDate(date: any): boolean {
    if (typeof date === 'string') {
      try {
        return isValid(parseISO(date));
      } catch {
        return false;
      }
    }
    return isValid(date);
  }

  // Timezone utilities
  static convertTimezone(date: Date | string, fromTz: string, toTz: string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }

    // Convert to UTC first, then to target timezone
    const utcDate = zonedTimeToUtc(dateObj, fromTz);
    return utcToZonedTime(utcDate, toTz);
  }

  static toUTC(date: Date | string, timezone?: string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const tz = timezone || this.config.defaultTimezone!;
    return zonedTimeToUtc(dateObj, tz);
  }

  static fromUTC(date: Date | string, timezone?: string): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const tz = timezone || this.config.defaultTimezone!;
    return utcToZonedTime(dateObj, tz);
  }

  static getTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static getTimezoneOffset(timezone?: string): number {
    const tz = timezone || this.config.defaultTimezone!;
    const now = new Date();
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    return (utcDate.getTime() - tzDate.getTime()) / (1000 * 60);
  }

  // Date arithmetic
  static addTime(date: Date | string, amount: number, unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds'): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date provided');
    }

    switch (unit) {
      case 'years':
        return addYears(dateObj, amount);
      case 'months':
        return addMonths(dateObj, amount);
      case 'weeks':
        return addWeeks(dateObj, amount);
      case 'days':
        return addDays(dateObj, amount);
      case 'hours':
        return new Date(dateObj.getTime() + amount * 60 * 60 * 1000);
      case 'minutes':
        return new Date(dateObj.getTime() + amount * 60 * 1000);
      case 'seconds':
        return new Date(dateObj.getTime() + amount * 1000);
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  static subtractTime(date: Date | string, amount: number, unit: 'years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds'): Date {
    return this.addTime(date, -amount, unit);
  }

  // Date ranges
  static getDateRange(period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear', timezone?: string): DateRange {
    const now = this.now(timezone);
    
    switch (period) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'yesterday':
        const yesterday = addDays(now, -1);
        return {
          start: startOfDay(yesterday),
          end: endOfDay(yesterday)
        };
      case 'thisWeek':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        };
      case 'lastWeek':
        const lastWeek = addWeeks(now, -1);
        return {
          start: startOfWeek(lastWeek),
          end: endOfWeek(lastWeek)
        };
      case 'thisMonth':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'lastMonth':
        const lastMonth = addMonths(now, -1);
        return {
          start: startOfMonth(lastMonth),
          end: endOfMonth(lastMonth)
        };
      case 'thisYear':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
        };
      case 'lastYear':
        const lastYear = now.getFullYear() - 1;
        return {
          start: new Date(lastYear, 0, 1),
          end: new Date(lastYear, 11, 31, 23, 59, 59, 999)
        };
      default:
        throw new Error(`Unsupported period: ${period}`);
    }
  }

  // Comparison utilities
  static isBefore(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isBefore(d1, d2);
  }

  static isAfter(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isAfter(d1, d2);
  }

  static isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameDay(d1, d2);
  }

  static getDifference(date1: Date | string, date2: Date | string, unit: 'days' | 'hours' | 'minutes'): number {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;

    switch (unit) {
      case 'days':
        return differenceInDays(d1, d2);
      case 'hours':
        return differenceInHours(d1, d2);
      case 'minutes':
        return differenceInMinutes(d1, d2);
      default:
        throw new Error(`Unsupported unit: ${unit}`);
    }
  }

  // Utility methods
  static getAge(birthDate: Date | string): number {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  static getWeekNumber(date: Date | string): number {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  static getQuarter(date: Date | string): number {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return Math.floor((d.getMonth() + 3) / 3);
  }

  // Business day utilities
  static isWeekend(date: Date | string): boolean {
    const d = typeof date === 'string' ? parseISO(date) : date;
    const day = d.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  static isWeekday(date: Date | string): boolean {
    return !this.isWeekend(date);
  }

  static getNextWeekday(date: Date | string): Date {
    let d = typeof date === 'string' ? parseISO(date) : new Date(date);
    do {
      d = addDays(d, 1);
    } while (this.isWeekend(d));
    return d;
  }

  static getPreviousWeekday(date: Date | string): Date {
    let d = typeof date === 'string' ? parseISO(date) : new Date(date);
    do {
      d = addDays(d, -1);
    } while (this.isWeekend(d));
    return d;
  }

  static countWeekdays(startDate: Date | string, endDate: Date | string): number {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    let count = 0;
    let current = new Date(start);
    
    while (current <= end) {
      if (this.isWeekday(current)) {
        count++;
      }
      current = addDays(current, 1);
    }
    
    return count;
  }
}