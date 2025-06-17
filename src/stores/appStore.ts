import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { AuthService } from '../services/AuthService';
import { NotificationService } from '../services/NotificationService';
import { StorageUtility } from '../utils/storageUtility';
import type { User } from '../entities/User';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  offline: {
    enabled: boolean;
    syncInterval: number;
  };
}

export const useAppStore = defineStore('app', () => {
  // State
  const isLoading = ref(false);
  const isOnline = ref(navigator.onLine);
  const currentUser = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const settings = ref<AppSettings>({
    theme: 'system',
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    notifications: {
      push: true,
      email: true,
      sms: false,
    },
    offline: {
      enabled: true,
      syncInterval: 300000, // 5 minutes
    },
  });

  // Services
  const authService = AuthService.getInstance();
  const notificationService = NotificationService.getInstance();

  // Computed
  const isDarkMode = computed(() => {
    if (settings.value.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return settings.value.theme === 'dark';
  });

  const userDisplayName = computed(() => {
    if (!currentUser.value) return '';
    return `${currentUser.value.firstName} ${currentUser.value.lastName}`;
  });

  const userInitials = computed(() => {
    if (!currentUser.value) return '';
    return `${currentUser.value.firstName.charAt(0)}${currentUser.value.lastName.charAt(0)}`.toUpperCase();
  });

  // Actions
  const initialize = async () => {
    try {
      setLoading(true);

      // Load settings from storage
      await loadSettings();

      // Initialize services
      await notificationService.initialize();

      // Check authentication
      await checkAuth();

      // Setup network listeners
      setupNetworkListeners();

      // Apply theme
      applyTheme();

    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      if (authService.isAuthenticated()) {
        currentUser.value = authService.getCurrentUser();
        isAuthenticated.value = true;
      } else {
        // Try to refresh token
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          currentUser.value = authService.getCurrentUser();
          isAuthenticated.value = true;
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await logout();
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.login({ email, password });
      
      if (result.success && result.user) {
        currentUser.value = result.user;
        isAuthenticated.value = true;
        return { success: true };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      currentUser.value = null;
      isAuthenticated.value = false;
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      settings.value = { ...settings.value, ...newSettings };
      await saveSettings();
      
      // Apply theme if changed
      if (newSettings.theme) {
        applyTheme();
      }
    } catch (error) {
      console.error('Settings update error:', error);
    }
  };

  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const showNotification = async (title: string, body: string, data?: any) => {
    if (settings.value.notifications.push) {
      await notificationService.showLocalNotification({
        title,
        body,
        data,
      });
    }
  };

  // Private methods
  const loadSettings = async () => {
    try {
      const savedSettings = await StorageUtility.getItem<AppSettings>('app_settings');
      if (savedSettings) {
        settings.value = { ...settings.value, ...savedSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await StorageUtility.setItem('app_settings', settings.value);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const applyTheme = () => {
    const html = document.documentElement;
    
    if (isDarkMode.value) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const setupNetworkListeners = () => {
    window.addEventListener('online', () => {
      isOnline.value = true;
      showNotification('Connection Restored', 'You are back online');
    });

    window.addEventListener('offline', () => {
      isOnline.value = false;
      showNotification('Connection Lost', 'You are now offline');
    });
  };

  // Watch for system theme changes
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings.value.theme === 'system') {
        applyTheme();
      }
    });
  }

  return {
    // State
    isLoading,
    isOnline,
    currentUser,
    isAuthenticated,
    settings,
    
    // Computed
    isDarkMode,
    userDisplayName,
    userInitials,
    
    // Actions
    initialize,
    checkAuth,
    login,
    logout,
    updateSettings,
    setLoading,
    showNotification,
  };
});