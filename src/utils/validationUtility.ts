export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  numeric?: boolean;
  integer?: boolean;
  positive?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationUtility {
  static validate(value: any, rules: ValidationRule): ValidationResult {
    const errors: string[] = [];

    // Required validation
    if (rules.required && this.isEmpty(value)) {
      errors.push('This field is required');
      return { isValid: false, errors };
    }

    // Skip other validations if value is empty and not required
    if (this.isEmpty(value)) {
      return { isValid: true, errors: [] };
    }

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Minimum length is ${rules.minLength} characters`);
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Maximum length is ${rules.maxLength} characters`);
      }
    }

    // Numeric validations
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      const numValue = Number(value);
      
      if (rules.min !== undefined && numValue < rules.min) {
        errors.push(`Minimum value is ${rules.min}`);
      }
      if (rules.max !== undefined && numValue > rules.max) {
        errors.push(`Maximum value is ${rules.max}`);
      }
      if (rules.positive && numValue <= 0) {
        errors.push('Value must be positive');
      }
      if (rules.integer && !Number.isInteger(numValue)) {
        errors.push('Value must be an integer');
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push('Invalid format');
    }

    // Email validation
    if (rules.email && !this.isValidEmail(value)) {
      errors.push('Invalid email address');
    }

    // Phone validation
    if (rules.phone && !this.isValidPhone(value)) {
      errors.push('Invalid phone number');
    }

    // URL validation
    if (rules.url && !this.isValidUrl(value)) {
      errors.push('Invalid URL');
    }

    // Numeric validation
    if (rules.numeric && isNaN(Number(value))) {
      errors.push('Value must be numeric');
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateForm(data: Record<string, any>, rules: Record<string, ValidationRule>): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      results[field] = this.validate(data[field], fieldRules);
    }

    return results;
  }

  static isFormValid(validationResults: Record<string, ValidationResult>): boolean {
    return Object.values(validationResults).every(result => result.isValid);
  }

  static getFormErrors(validationResults: Record<string, ValidationResult>): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const [field, result] of Object.entries(validationResults)) {
      if (!result.isValid) {
        errors[field] = result.errors;
      }
    }

    return errors;
  }

  private static isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Basic phone validation - can be customized based on requirements
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Common validation rule presets
  static rules = {
    required: { required: true },
    email: { email: true },
    phone: { phone: true },
    url: { url: true },
    positive: { positive: true, numeric: true },
    integer: { integer: true, numeric: true },
    password: { minLength: 8, pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ },
    name: { minLength: 2, maxLength: 50, pattern: /^[a-zA-Z\s]+$/ },
    username: { minLength: 3, maxLength: 20, pattern: /^[a-zA-Z0-9_]+$/ },
  };
}