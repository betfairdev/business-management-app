<template>
  <div class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
    <div class="grid grid-cols-5 h-16">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.name"
        :to="item.href"
        :class="[
          $route.path === item.href
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400',
          'flex flex-col items-center justify-center space-y-1 transition-colors duration-200'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-xs font-medium">{{ item.name }}</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';

const navigationItems = [
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
    name: 'Customers',
    href: '/customers',
    icon: 'UsersIcon',
  },
  {
    name: 'More',
    href: '/settings',
    icon: 'EllipsisHorizontalIcon',
  },
];
</script>