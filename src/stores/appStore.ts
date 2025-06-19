import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: boolean;
}

export const useAppStore = defineStore('app', () => {
  // State
  const isLoading = ref(false);
  const isSidebarOpen = ref(false);
  const settings = ref<AppSettings>({
    theme: 'system',
    language: 'en',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    notifications: true,
  });

  // Actions
  const setLoading = (loading: boolean) => {
    isLoading.value = loading;
  };

  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value;
  };

  const setSidebarOpen = (open: boolean) => {
    isSidebarOpen.value = open;
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
    localStorage.setItem('appSettings', JSON.stringify(settings.value));
  };

  const initializeSettings = () => {
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        settings.value = { ...settings.value, ...parsed };
      } catch (err) {
        console.error('Failed to parse stored settings:', err);
      }
    }

    // Apply theme
    applyTheme();
  };

  const applyTheme = () => {
    const { theme } = settings.value;
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  return {
    // State
    isLoading,
    isSidebarOpen,
    settings,

    // Actions
    setLoading,
    toggleSidebar,
    setSidebarOpen,
    updateSettings,
    initializeSettings,
    applyTheme,
  };
});