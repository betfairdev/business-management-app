import { ApiService } from './ApiService';
import { User } from '../entities/User';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  private static instance: AuthService;
  private apiService: ApiService;
  private currentUser: User | null = null;

  private constructor() {
    this.apiService = ApiService.getInstance();
    this.loadUserFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/login', credentials);
      
      if (response.success && response.data?.token) {
        this.setAuthData(response.data.token, response.data.user!);
        return response.data;
      }

      return {
        success: false,
        error: response.error || 'Login failed'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error during login'
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/register', userData);
      
      if (response.success && response.data?.token) {
        this.setAuthData(response.data.token, response.data.user!);
        return response.data;
      }

      return {
        success: false,
        error: response.error || 'Registration failed'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Network error during registration'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiService.post('/auth/logout', {});
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await this.apiService.post<AuthResponse>('/auth/refresh', {});
      
      if (response.success && response.data?.token) {
        this.setAuthData(response.data.token, response.data.user!);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    this.clearAuthData();
    return false;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser && !!localStorage.getItem('auth_token');
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUser = user;
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUser = null;
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearAuthData();
      }
    }
  }
}