import { Device } from '@capacitor/device';

export interface FormatOptions {
  /** Intl.DateTimeFormat options */
  dateStyle?: Intl.DateTimeFormatOptions['dateStyle'];
  timeStyle?: Intl.DateTimeFormatOptions['timeStyle'];
  /** Override full option set */
  custom?: Intl.DateTimeFormatOptions;
  /** Locale string, e.g. 'en-US' */
  locale?: string;
}

export class TimezoneUtil {
  /**
   * Fetch the device's current timezone identifier (e.g. 'Asia/Dhaka').
   */
  static async getDeviceTimezone(): Promise<string> {
    const info = await Device.getInfo() as { timezone?: string };
    // Use 'timezone' (all lowercase) as per DeviceInfo typings, fallback to Intl API
    return info.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Format a date into a human-readable string in device timezone.
   * @param date Input as Date | ISO string | timestamp
   * @param opts Formatting options
   * @example
   * format('2025-05-02T13:09:00Z'); // "02 May 2025, 01:09 PM"
   */
  static format(
    date: Date | string | number,
    opts: FormatOptions = {}
  ): string {
    const dt = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;

    // build options
    const base: Intl.DateTimeFormatOptions = opts.custom ?? {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const locale = opts.locale ?? Intl.DateTimeFormat().resolvedOptions().locale;
    return new Intl.DateTimeFormat(locale, base).format(dt);
  }

  /**
   * Compute human-relative "time ago" string, e.g. "5 minutes ago".
   * @param date Input date
   */
  static timeAgo(
    date: Date | string | number,
    locale?: string
  ): string {
    const dt = typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : date;
    const now = new Date();
    const diffMs = now.getTime() - dt.getTime();
    const rtf = new Intl.RelativeTimeFormat(locale ?? undefined, { numeric: 'auto' });

    const seconds = Math.round(diffMs / 1000);
    if (Math.abs(seconds) < 60) {
      return rtf.format(-seconds, 'second');
    }
    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) {
      return rtf.format(-minutes, 'minute');
    }
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return rtf.format(-hours, 'hour');
    }
    const days = Math.round(hours / 24);
    if (Math.abs(days) < 30) {
      return rtf.format(-days, 'day');
    }
    const months = Math.round(days / 30);
    if (Math.abs(months) < 12) {
      return rtf.format(-months, 'month');
    }
    const years = Math.round(months / 12);
    return rtf.format(-years, 'year');
  }

  /**
   * Parse a timestamp string (e.g. '2025-05-02 13:09') into a Date in device tz.
   * Assumes local-like format, not UTC.
   */
  static parseLocal(
    input: string,
    formatRegex: RegExp = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/
  ): Date | null {
    const m = input.match(formatRegex);
    if (!m) return null;
    const [, y, mo, d, h, mi] = m.map(Number);
    // Note: months are 0-based in JS Date
    return new Date(y, mo - 1, d, h, mi);
  }
}
