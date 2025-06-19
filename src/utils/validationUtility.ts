export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationUtility {
  static validate(value: any, rule: ValidationRule): ValidationResult {
    const errors: string[] = [];

    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push('This field is required');
      return { isValid: false, errors };
    }

    // Skip other validations if value is empty and not required
    if (!value && !rule.required) {
      return { isValid: true, errors: [] };
    }

    const stringValue = String(value);

    // Length validations
    if (rule.minLength && stringValue.length < rule.minLength) {
      errors.push(`Minimum length is ${rule.minLength} characters`);
    }

    if (rule.maxLength && stringValue.length > rule.maxLength) {
      errors.push(`Maximum length is ${rule.maxLength} characters`);
    }

    // Numeric validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`Minimum value is ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`Maximum value is ${rule.max}`);
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(stringValue)) {
      errors.push('Invalid format');
    }

    // Email validation
    if (rule.email && !this.isValidEmail(stringValue)) {
      errors.push('Invalid email address');
    }

    // Phone validation
    if (rule.phone && !this.isValidPhone(stringValue)) {
      errors.push('Invalid phone number');
    }

    // URL validation
    if (rule.url && !this.isValidUrl(stringValue)) {
      errors.push('Invalid URL');
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleaned = phone.replace(/\D/g, '');
    return phoneRegex.test(cleaned) && cleaned.length >= 10;
  }

  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate multiple fields at once
   */
  static validateFields(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): Record<string, ValidationResult> {
    const results: Record<string, ValidationResult> = {};

    for (const [field, rule] of Object.entries(rules)) {
      results[field] = this.validate(data[field], rule);
    }

    return results;
  }

  /**
   * Check if all validations passed
   */
  static isFormValid(results: Record<string, ValidationResult>): boolean {
    return Object.values(results).every(result => result.isValid);
  }
}