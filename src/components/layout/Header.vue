<template>
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Left side - Logo and Navigation -->
        <div class="flex items-center">
          <!-- Mobile menu button -->
          <button
            type="button"
            class="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            @click="appStore.toggleSidebar()"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Logo -->
          <div class="flex-shrink-0 flex items-center ml-4 md:ml-0">
            <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
              </svg>
            </div>
            <span class="ml-2 text-xl font-semibold text-gray-900 dark:text-white">Business Manager</span>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:ml-8 md:flex md:space-x-8">
            <RouterLink
              v-for="item in navigation"
              :key="item.name"
              :to="item.href"
              :class="[
                $route.path === item.href
                  ? 'border-blue-500 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300',
                'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium'
              ]"
            >
              {{ item.name }}
            </RouterLink>
          </nav>
        </div>

        <!-- Right side - Search, Theme toggle, Notifications, Profile -->
        <div class="flex items-center space-x-4">
          <!-- Search -->
          <div class="hidden md:block">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search..."
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>

          <!-- Theme Toggle -->
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            @click="toggleTheme"
          >
            <svg v-if="isDarkMode" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- Notifications -->
          <button
            type="button"
            class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md relative"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.97 4.97a.235.235 0 0 0-.02 0L9 7h6l-1.95-2.03a.235.235 0 0 0-.02 0L12 4l-1.03.97zM18 8h-5l1.95-2.03a.235.235 0 0 0 .02 0L16 5l1.03.97a.235.235 0 0 0 .02 0L18 8zM6 8l1.03-.97a.235.235 0 0 0 .02 0L8 5l1.03.97a.235.235 0 0 0 .02 0L11 8H6zM4 10h16v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z" />
            </svg>
            <!-- Notification badge -->
            <span class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-800"></span>
          </button>

          <!-- Profile dropdown -->
          <div class="relative">
            <button
              type="button"
              class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="showProfileMenu = !showProfileMenu"
            >
              <div class="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span class="text-blue-600 dark:text-blue-400 font-medium text-sm">
                  {{ userInitials }}
                </span>
              </div>
            </button>

            <!-- Profile dropdown menu -->
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showProfileMenu"
                class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
                @click.away="showProfileMenu = false"
              >
                <div class="py-1">
                  <div class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <p class="font-medium">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</p>
                    <p class="text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>
                  </div>
                  
                  <RouterLink
                    to="/profile"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="showProfileMenu = false"
                  >
                    Your Profile
                  </RouterLink>
                  
                  <RouterLink
                    to="/settings"
                    class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="showProfileMenu = false"
                  >
                    Settings
                  </RouterLink>
                  
                  <button
                    type="button"
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="handleLogout"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Navigation Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div v-if="appStore.isSidebarOpen" class="md:hidden">
        <div class="pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <RouterLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              $route.path === item.href
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-200'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300',
              'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
            ]"
            @click="appStore.setSidebarOpen(false)"
          >
            {{ item.name }}
          </RouterLink>
        </div>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import { useAppStore } from '../../stores/appStore';

const router = useRouter();
const authStore = useAuthStore();
const appStore = useAppStore();

// State
const searchQuery = ref('');
const showProfileMenu = ref(false);

// Navigation items
const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Products', href: '/products' },
  { name: 'Customers', href: '/customers' },
  { name: 'Sales', href: '/sales' },
  { name: 'Purchases', href: '/purchases' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Reports', href: '/reports' },
];

// Computed
const userInitials = computed(() => {
  const user = authStore.user;
  if (!user) return 'U';
  return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
});

const isDarkMode = computed(() => {
  return appStore.settings.theme === 'dark' || 
    (appStore.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
});

// Methods
const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push(`/search?q=${encodeURIComponent(searchQuery.value)}`);
  }
};

const toggleTheme = () => {
  const currentTheme = appStore.settings.theme;
  let newTheme: 'light' | 'dark' | 'system';
  
  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'system';
  } else {
    newTheme = 'light';
  }
  
  appStore.updateSettings({ theme: newTheme });
  appStore.applyTheme();
};

const handleLogout = () => {
  showProfileMenu.value = false;
  authStore.logout();
  router.push('/login');
};
</script>