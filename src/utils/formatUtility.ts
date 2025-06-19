export class FormatUtility {
  /**
   * Format currency with locale support
   */
  static currency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date with various options
   */
  static date(
    date: string | Date,
    format: string = 'short',
    locale: string = 'en-US'
  ): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString(locale);
      case 'long':
        return d.toLocaleDateString(locale, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'medium':
        return d.toLocaleDateString(locale, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return d.toLocaleDateString(locale);
    }
  }

  /**
   * Format date and time
   */
  static dateTime(
    date: string | Date,
    options?: { 
      dateStyle?: 'short' | 'medium' | 'long';
      timeStyle?: 'short' | 'medium' | 'long';
      locale?: string;
    }
  ): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const locale = options?.locale || 'en-US';
    
    return d.toLocaleString(locale, {
      dateStyle: options?.dateStyle || 'medium',
      timeStyle: options?.timeStyle || 'short',
    });
  }

  /**
   * Format numbers with locale support
   */
  static number(
    num: number,
    options?: {
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
      locale?: string;
    }
  ): string {
    const locale = options?.locale || 'en-US';
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    }).format(num);
  }

  /**
   * Format percentage
   */
  static percentage(
    value: number,
    decimals: number = 2,
    locale: string = 'en-US'
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  }

  /**
   * Format file size
   */
  static fileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format phone number
   */
  static phone(phone: string, format: 'international' | 'national' = 'national'): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (format === 'international') {
      return `+${cleaned}`;
    }
    
    // Simple US format
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(text: string, length: number = 50): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  }

  /**
   * Format address
   */
  static address(address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }): string {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zip,
      address.country,
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}