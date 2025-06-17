<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile sidebar backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 lg:hidden"
      @click="sidebarOpen = false"
    >
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
    </div>

    <!-- Sidebar -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Sidebar header -->
      <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
          Business Manager
        </h1>
        <button
          class="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="sidebarOpen = false"
        >
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="mt-6 px-3">
        <div class="space-y-1">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
              $route.path === item.href
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <component
              :is="item.icon"
              class="mr-3 h-5 w-5 flex-shrink-0"
              :class="[
                $route.path === item.href
                  ? 'text-blue-500 dark:text-blue-300'
                  : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
              ]"
            />
            {{ item.name }}
          </router-link>
        </div>
      </nav>

      <!-- User menu -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span class="text-sm font-medium text-white">
                {{ appStore.userInitials }}
              </span>
            </div>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ appStore.userDisplayName }}
            </p>
            <button
              class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="handleLogout"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top bar -->
      <div class="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between h-16 px-4 sm:px-6">
          <!-- Mobile menu button -->
          <button
            class="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            @click="sidebarOpen = true"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <!-- Page title -->
          <div class="flex-1 lg:flex-none">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ pageTitle }}
            </h2>
          </div>

          <!-- Top bar actions -->
          <div class="flex items-center space-x-4">
            <!-- Network status -->
            <div class="flex items-center">
              <div
                :class="[
                  'h-2 w-2 rounded-full',
                  appStore.isOnline ? 'bg-green-500' : 'bg-red-500'
                ]"
              ></div>
              <span class="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {{ appStore.isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>

            <!-- Theme toggle -->
            <button
              class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              @click="toggleTheme"
            >
              <svg v-if="appStore.isDarkMode" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>

            <!-- Notifications -->
            <button class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM10.5 3.75a6 6 0 0 1 6 6v2.25a3 3 0 0 0 3 3v.75H4.5v-.75a3 3 0 0 0 3-3V9.75a6 6 0 0 1 6-6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Page content -->
      <main class="p-4 sm:p-6">
        <router-view />
      </main>
    </div>

    <!-- Loading overlay -->
    <div
      v-if="appStore.isLoading"
      class="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
        <svg class="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-gray-900 dark:text-white">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '../../stores/appStore';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const sidebarOpen = ref(false);

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: 'HomeIcon',
  },
  {
    name: 'Products',
    href: '/products',
    icon: 'CubeIcon',
  },
  {
    name: 'Sales',
    href: '/sales',
    icon: 'ShoppingCartIcon',
  },
  {
    name: 'Purchases',
    href: '/purchases',
    icon: 'ShoppingBagIcon',
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: 'UsersIcon',
  },
  {
    name: 'Suppliers',
    href: '/suppliers',
    icon: 'TruckIcon',
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: 'ArchiveIcon',
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: 'ChartBarIcon',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'CogIcon',
  },
];

const pageTitle = computed(() => {
  const currentNav = navigation.find(item => item.href === route.path);
  return currentNav?.name || 'Dashboard';
});

const toggleTheme = async () => {
  const newTheme = appStore.isDarkMode ? 'light' : 'dark';
  await appStore.updateSettings({ theme: newTheme });
};

const handleLogout = async () => {
  await appStore.logout();
  router.push('/login');
};
</script>