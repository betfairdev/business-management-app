<template>
  <div class="space-y-6">
    <!-- Welcome Section -->
    <div class="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
      <h1 class="text-2xl font-bold">
        Welcome back, {{ appStore.userDisplayName }}!
      </h1>
      <p class="mt-2 text-blue-100">
        Here's what's happening with your business today.
      </p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard
        v-for="stat in stats"
        :key="stat.title"
        padding="lg"
        hoverable
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div :class="[
              'h-12 w-12 rounded-lg flex items-center justify-center',
              stat.bgColor
            ]">
              <component :is="stat.icon" :class="['h-6 w-6', stat.iconColor]" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {{ stat.title }}
            </p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">
              {{ stat.value }}
            </p>
            <p :class="[
              'text-sm',
              stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            ]">
              {{ stat.change }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sales Chart -->
      <BaseCard title="Sales Overview" padding="lg">
        <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>Sales chart will be displayed here</p>
          </div>
        </div>
      </BaseCard>

      <!-- Top Products -->
      <BaseCard title="Top Products" padding="lg">
        <div class="space-y-4">
          <div
            v-for="product in topProducts"
            :key="product.id"
            class="flex items-center justify-between"
          >
            <div class="flex items-center">
              <div class="h-10 w-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {{ product.name.charAt(0) }}
                </span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ product.name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ product.sales }} sales
                </p>
              </div>
            </div>
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ FormatUtility.currency(product.revenue) }}
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Recent Activity -->
    <BaseCard title="Recent Activity" padding="lg">
      <div class="space-y-4">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="flex items-start space-x-3"
        >
          <div :class="[
            'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
            activity.bgColor
          ]">
            <component :is="activity.icon" :class="['h-4 w-4', activity.iconColor]" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-gray-900 dark:text-white">
              {{ activity.description }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ FormatUtility.relativeTime(activity.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAppStore } from '../stores/appStore';
import BaseCard from '../components/ui/BaseCard.vue';
import { FormatUtility } from '../utils/formatUtility';

const appStore = useAppStore();

const stats = ref([
  {
    title: 'Total Sales',
    value: '$12,426',
    change: '+12% from last month',
    changeType: 'increase',
    icon: 'CurrencyDollarIcon',
    bgColor: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-300',
  },
  {
    title: 'Orders',
    value: '1,234',
    change: '+8% from last month',
    changeType: 'increase',
    icon: 'ShoppingCartIcon',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-300',
  },
  {
    title: 'Customers',
    value: '456',
    change: '+3% from last month',
    changeType: 'increase',
    icon: 'UsersIcon',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-300',
  },
  {
    title: 'Products',
    value: '89',
    change: '-2% from last month',
    changeType: 'decrease',
    icon: 'CubeIcon',
    bgColor: 'bg-orange-100 dark:bg-orange-900',
    iconColor: 'text-orange-600 dark:text-orange-300',
  },
]);

const topProducts = ref([
  { id: 1, name: 'Product A', sales: 45, revenue: 2250 },
  { id: 2, name: 'Product B', sales: 38, revenue: 1900 },
  { id: 3, name: 'Product C', sales: 32, revenue: 1600 },
  { id: 4, name: 'Product D', sales: 28, revenue: 1400 },
  { id: 5, name: 'Product E', sales: 24, revenue: 1200 },
]);

const recentActivity = ref([
  {
    id: 1,
    description: 'New order #1234 received from John Doe',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    icon: 'ShoppingCartIcon',
    bgColor: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-300',
  },
  {
    id: 2,
    description: 'Product "Widget A" stock is running low',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    icon: 'ExclamationTriangleIcon',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-600 dark:text-yellow-300',
  },
  {
    id: 3,
    description: 'New customer "Jane Smith" registered',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    icon: 'UserPlusIcon',
    bgColor: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-300',
  },
  {
    id: 4,
    description: 'Payment received for order #1230',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    icon: 'CurrencyDollarIcon',
    bgColor: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-300',
  },
]);

onMounted(() => {
  // Load dashboard data
  console.log('Dashboard mounted');
});
</script>