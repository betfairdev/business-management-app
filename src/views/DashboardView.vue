<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back, {{ authStore.user?.firstName }}! Here's what's happening with your business.
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <BaseButton @click="refreshData">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          Refresh
        </BaseButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard v-for="stat in stats" :key="stat.title" variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div :class="stat.iconBg" class="p-3 rounded-lg">
              <component :is="stat.icon" :class="stat.iconColor" class="w-6 h-6" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.title }}</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stat.value }}</p>
            <p :class="stat.changeColor" class="text-sm">
              {{ stat.change }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sales Chart -->
      <BaseCard title="Sales Overview" variant="bordered" padding="lg">
        <BaseChart
          type="line"
          :data="salesChartData"
          :options="chartOptions"
          :loading="isLoading"
          height="300"
        />
      </BaseCard>

      <!-- Revenue Chart -->
      <BaseCard title="Revenue by Category" variant="bordered" padding="lg">
        <BaseChart
          type="doughnut"
          :data="revenueChartData"
          :options="doughnutOptions"
          :loading="isLoading"
          height="300"
        />
      </BaseCard>
    </div>

    <!-- Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Sales -->
      <BaseCard title="Recent Sales" variant="bordered" padding="lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Sales</h3>
            <RouterLink to="/sales" class="text-sm text-blue-600 hover:text-blue-500">
              View all
            </RouterLink>
          </div>
        </template>
        
        <div class="space-y-4">
          <div v-for="sale in recentSales" :key="sale.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ sale.invoiceNumber || `Sale #${sale.id.slice(-6)}` }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ sale.customer?.name || 'Walk-in Customer' }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(sale.totalAmount) }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(sale.saleDate) }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Low Stock Items -->
      <BaseCard title="Low Stock Alert" variant="bordered" padding="lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</h3>
            <RouterLink to="/inventory" class="text-sm text-blue-600 hover:text-blue-500">
              View all
            </RouterLink>
          </div>
        </template>
        
        <div class="space-y-4">
          <div v-for="item in lowStockItems" :key="item.id" class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ item.product.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.product.sku }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-red-600 dark:text-red-400">{{ item.quantity }} left</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.warehouse || 'Main' }}</p>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterLink } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import BaseCard from '../components/ui/BaseCard.vue';
import BaseButton from '../components/ui/BaseButton.vue';
import BaseChart from '../components/ui/BaseChart.vue';
import { SaleService } from '../services/SaleService';
import { StockService } from '../services/StockService';
import { ProductService } from '../services/ProductService';
import { CustomerService } from '../services/CustomerService';
import { FormatUtility } from '../utils/formatUtility';

const authStore = useAuthStore();
const isLoading = ref(true);

// Services
const saleService = new SaleService();
const stockService = new StockService();
const productService = new ProductService();
const customerService = new CustomerService();

// Data
const recentSales = ref<any[]>([]);
const lowStockItems = ref<any[]>([]);
const dashboardStats = ref({
  totalSales: 0,
  totalRevenue: 0,
  totalProducts: 0,
  totalCustomers: 0,
});

// Stats configuration
const stats = computed(() => [
  {
    title: 'Total Sales',
    value: dashboardStats.value.totalSales.toString(),
    change: '+12% from last month',
    changeColor: 'text-green-600',
    icon: 'TrendingUpIcon',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    title: 'Revenue',
    value: formatCurrency(dashboardStats.value.totalRevenue),
    change: '+8% from last month',
    changeColor: 'text-green-600',
    icon: 'CurrencyDollarIcon',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    title: 'Products',
    value: dashboardStats.value.totalProducts.toString(),
    change: '+3 new this week',
    changeColor: 'text-green-600',
    icon: 'CubeIcon',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Customers',
    value: dashboardStats.value.totalCustomers.toString(),
    change: '+5 new this week',
    changeColor: 'text-green-600',
    icon: 'UsersIcon',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
]);

// Chart data
const salesChartData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Sales',
      data: [12, 19, 3, 5, 2, 3],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    },
  ],
});

const revenueChartData = ref({
  labels: ['Electronics', 'Clothing', 'Books', 'Home & Garden'],
  datasets: [
    {
      data: [300, 50, 100, 80],
      backgroundColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
      ],
    },
  ],
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
    },
  },
};

// Methods
const formatCurrency = (amount: number): string => {
  return FormatUtility.currency(amount);
};

const formatDate = (date: string): string => {
  return FormatUtility.date(date);
};

const loadDashboardData = async () => {
  try {
    isLoading.value = true;

    // Load recent sales
    const salesResult = await saleService.findAll({ page: 1, limit: 5 });
    recentSales.value = salesResult.data;

    // Load low stock items
    const lowStock = await stockService.getLowStockItems(10);
    lowStockItems.value = lowStock.slice(0, 5);

    // Load dashboard stats
    const productsResult = await productService.findAll({ page: 1, limit: 1 });
    const customersResult = await customerService.findAll({ page: 1, limit: 1 });

    dashboardStats.value = {
      totalSales: salesResult.total,
      totalRevenue: salesResult.data.reduce((sum, sale) => sum + sale.totalAmount, 0),
      totalProducts: productsResult.total,
      totalCustomers: customersResult.total,
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

const refreshData = () => {
  loadDashboardData();
};

onMounted(() => {
  loadDashboardData();
});
</script>