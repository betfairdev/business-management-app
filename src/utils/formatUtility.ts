export class FormatUtility {
  // Currency formatting
  static currency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Number formatting
  static number(
    value: number,
    options: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      locale?: string;
    } = {}
  ): string {
    const { locale = 'en-US', ...formatOptions } = options;
    return new Intl.NumberFormat(locale, formatOptions).format(value);
  }

  // Percentage formatting
  static percentage(value: number, decimals: number = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
  }

  // Date formatting
  static date(
    date: Date | string,
    format: 'short' | 'medium' | 'long' | 'full' = 'medium',
    locale: string = 'en-US'
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, { dateStyle: format }).format(dateObj);
  }

  // Time formatting
  static time(
    date: Date | string,
    format: 'short' | 'medium' | 'long' = 'short',
    locale: string = 'en-US'
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, { timeStyle: format }).format(dateObj);
  }

  // DateTime formatting
  static dateTime(
    date: Date | string,
    options: {
      dateStyle?: 'short' | 'medium' | 'long' | 'full';
      timeStyle?: 'short' | 'medium' | 'long';
      locale?: string;
    } = {}
  ): string {
    const { locale = 'en-US', dateStyle = 'medium', timeStyle = 'short' } = options;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat(locale, { dateStyle, timeStyle }).format(dateObj);
  }

  // Relative time formatting
  static relativeTime(
    date: Date | string,
    locale: string = 'en-US'
  ): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (Math.abs(diffInSeconds) < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (Math.abs(diffInSeconds) < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }

  // File size formatting
  static fileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Phone number formatting
  static phone(phoneNumber: string, format: 'international' | 'national' = 'national'): string {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    if (format === 'international') {
      // Format as +1 (555) 123-4567
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
    }

    // Format as (555) 123-4567
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    return phoneNumber; // Return original if can't format
  }

  // Text truncation
  static truncate(text: string, length: number, suffix: string = '...'): string {
    if (text.length <= length) return text;
    return text.slice(0, length - suffix.length) + suffix;
  }

  // Capitalize first letter
  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Title case
  static titleCase(text: string): string {
    return text.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  // Camel case to title case
  static camelToTitle(text: string): string {
    return text
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  // Snake case to title case
  static snakeToTitle(text: string): string {
    return text
      .split('_')
      .map(word => this.capitalize(word))
      .join(' ');
  }

  // Format address
  static address(address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  }): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Format name
  static name(firstName: string, lastName: string, format: 'first-last' | 'last-first' | 'initials' = 'first-last'): string {
    switch (format) {
      case 'last-first':
        return `${lastName}, ${firstName}`;
      case 'initials':
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
      default:
        return `${firstName} ${lastName}`;
    }
  }

  // Format credit card number
  static creditCard(cardNumber: string, mask: boolean = true): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    
    if (mask && cleaned.length >= 4) {
      const lastFour = cleaned.slice(-4);
      const masked = '*'.repeat(cleaned.length - 4);
      return `${masked}${lastFour}`.replace(/(.{4})/g, '$1 ').trim();
    }

    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  }

  // Format duration (seconds to human readable)
  static duration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }
}