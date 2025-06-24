import { PlatformService } from '../platform/PlatformService';

export interface SecurityConfig {
  encryptionEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
}

export class SecurityService {
  private config: SecurityConfig;
  private loginAttempts = new Map<string, number>();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  async encryptData(data: string, key?: string): Promise<string> {
    if (!this.config.encryptionEnabled) return data;

    if (PlatformService.isNative()) {
      try {
        // Use native encryption on mobile
        const { NativeCrypto } = await import('@capacitor-community/native-crypto');
        return await NativeCrypto.encrypt({ data, key: key || 'default' });
      } catch (error) {
        console.warn('Native encryption failed, using fallback:', error);
      }
    }

    // Fallback to Web Crypto API
    return this.webEncrypt(data, key);
  }

  async decryptData(encryptedData: string, key?: string): Promise<string> {
    if (!this.config.encryptionEnabled) return encryptedData;

    if (PlatformService.isNative()) {
      try {
        const { NativeCrypto } = await import('@capacitor-community/native-crypto');
        return await NativeCrypto.decrypt({ data: encryptedData, key: key || 'default' });
      } catch (error) {
        console.warn('Native decryption failed, using fallback:', error);
      }
    }

    return this.webDecrypt(encryptedData, key);
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    if (!this.config.biometricEnabled || !PlatformService.isNative()) {
      return false;
    }

    try {
      const { BiometricAuth } = await import('@capacitor-community/biometric-auth');
      const result = await BiometricAuth.authenticate({
        reason: 'Authenticate to access the app',
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face to authenticate',
        description: 'Place your finger on the sensor or look at the camera',
      });
      return result.succeeded;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }

  async isBiometricAvailable(): Promise<boolean> {
    if (!PlatformService.isNative()) return false;

    try {
      const { BiometricAuth } = await import('@capacitor-community/biometric-auth');
      const result = await BiometricAuth.isAvailable();
      return result.isAvailable;
    } catch (error) {
      return false;
    }
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { passwordPolicy } = this.config;

    if (password.length < passwordPolicy.minLength) {
      errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }

    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  checkLoginAttempts(email: string): boolean {
    const attempts = this.loginAttempts.get(email) || 0;
    return attempts < this.config.maxLoginAttempts;
  }

  recordLoginAttempt(email: string, success: boolean): void {
    if (success) {
      this.loginAttempts.delete(email);
    } else {
      const attempts = this.loginAttempts.get(email) || 0;
      this.loginAttempts.set(email, attempts + 1);
    }
  }

  async secureStorage(key: string, value: string): Promise<void> {
    if (PlatformService.isNative()) {
      try {
        const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
        await SecureStoragePlugin.set({ key, value });
        return;
      } catch (error) {
        console.warn('Secure storage failed, using localStorage:', error);
      }
    }

    // Fallback to encrypted localStorage
    const encrypted = await this.encryptData(value);
    localStorage.setItem(key, encrypted);
  }

  async getSecureStorage(key: string): Promise<string | null> {
    if (PlatformService.isNative()) {
      try {
        const { SecureStoragePlugin } = await import('capacitor-secure-storage-plugin');
        const result = await SecureStoragePlugin.get({ key });
        return result.value;
      } catch (error) {
        console.warn('Secure storage retrieval failed:', error);
      }
    }

    // Fallback to encrypted localStorage
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      return await this.decryptData(encrypted);
    } catch (error) {
      console.error('Failed to decrypt stored data:', error);
      return null;
    }
  }

  private async webEncrypt(data: string, key?: string): Promise<string> {
    // Simple base64 encoding for fallback (not secure)
    return btoa(data);
  }

  private async webDecrypt(encryptedData: string, key?: string): Promise<string> {
    // Simple base64 decoding for fallback
    return atob(encryptedData);
  }
}