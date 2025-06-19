<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comprehensive business insights and analytics
        </p>
      </div>
      <div class="mt-4 sm:mt-0">
        <BaseButton @click="refreshReports">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </template>
          Refresh Reports
        </BaseButton>
      </div>
    </div>

    <!-- Date Range Filter -->
    <BaseCard variant="bordered" padding="lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseInput
          v-model="dateRange.startDate"
          type="date"
          label="Start Date"
          @change="updateReports"
        />
        <BaseInput
          v-model="dateRange.endDate"
          type="date"
          label="End Date"
          @change="updateReports"
        />
        <div class="flex items-end">
          <BaseButton @click="updateReports" class="w-full">
            Update Reports
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <!-- Key Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(metrics.totalRevenue) }}</p>
            <p class="text-sm text-green-600">+{{ metrics.revenueGrowth }}% from last period</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ metrics.totalSales }}</p>
            <p class="text-sm text-blue-600">{{ metrics.averageOrderValue }} avg order value</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">New Customers</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ metrics.newCustomers }}</p>
            <p class="text-sm text-purple-600">{{ metrics.customerRetention }}% retention rate</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Inventory Value</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(metrics.inventoryValue) }}</p>
            <p class="text-sm text-yellow-600">{{ metrics.inventoryTurnover }}x turnover rate</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Sales Trend Chart -->
      <BaseCard title="Sales Trend" variant="bordered" padding="lg">
        <BaseChart
          type="line"
          :data="salesTrendData"
          :options="chartOptions"
          :loading="isLoading"
          height="300"
        />
      </BaseCard>

      <!-- Revenue by Category -->
      <BaseCard title="Revenue by Category" variant="bordered" padding="lg">
        <BaseChart
          type="doughnut"
          :data="categoryRevenueData"
          :options="doughnutOptions"
          :loading="isLoading"
          height="300"
        />
      </BaseCard>

      <!-- Top Products -->
      <BaseCard title="Top Selling Products" variant="bordered" padding="lg">
        <BaseChart
          type="bar"
          :data="topProductsData"
          :options="barOptions"
          :loading="isLoading"
          height="300"
        />
      </BaseCard>

      <!-- Monthly Comparison -->
      <BaseCard title="Monthly Comparison" variant="bordered" padding="lg">
        <BaseChart
          type="bar"
          :data="monthlyComparisonData"
          :options="chartOptions"
          :loading="isLoading"
          height="300"
        />
      </BaseCard>
    </div>

    <!-- Detailed Reports -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Customers -->
      <BaseCard title="Top Customers" variant="bordered" padding="lg">
        <div class="space-y-4">
          <div v-for="customer in topCustomers" :key="customer.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ customer.name }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ customer.totalOrders }} orders</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(customer.totalSpent) }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(customer.averageOrder) }} avg</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Low Stock Alert -->
      <BaseCard title="Low Stock Alert" variant="bordered" padding="lg">
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

    <!-- Export Section -->
    <BaseCard title="Export Reports" variant="bordered" padding="lg">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseButton variant="secondary" @click="exportSalesReport">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </template>
          Sales Report
        </BaseButton>
        
        <BaseButton variant="secondary" @click="exportInventoryReport">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </template>
          Inventory Report
        </BaseButton>
        
        <BaseButton variant="secondary" @click="exportCustomerReport">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </template>
          Customer Report
        </BaseButton>
        
        <BaseButton variant="secondary" @click="exportFinancialReport">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </template>
          Financial Report
        </BaseButton>
      </div>
    </BaseCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseCard from '../../components/ui/BaseCard.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseChart from '../../components/ui/BaseChart.vue';
import { SaleService } from '../../services/SaleService';
import { StockService } from '../../services/StockService';
import { CustomerService } from '../../services/CustomerService';
import { ExportUtility } from '../../utils/exportUtility';
import { FormatUtility } from '../../utils/formatUtility';

// Services
const saleService = new SaleService();
const stockService = new StockService();
const customerService = new CustomerService();

// State
const isLoading = ref(false);
const dateRange = ref({
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
});

// Metrics
const metrics = ref({
  totalRevenue: 0,
  revenueGrowth: 12.5,
  totalSales: 0,
  averageOrderValue: '$0',
  newCustomers: 0,
  customerRetention: 85,
  inventoryValue: 0,
  inventoryTurnover: 2.4,
});

// Data
const topCustomers = ref<any[]>([]);
const lowStockItems = ref<any[]>([]);

// Chart data
const salesTrendData = ref({
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Sales',
      data: [12000, 19000, 15000, 25000, 22000, 30000],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
    },
  ],
});

const categoryRevenueData = ref({
  labels: ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'],
  datasets: [
    {
      data: [35, 25, 15, 15, 10],
      backgroundColor: [
        'rgb(59, 130, 246)',
        'rgb(16, 185, 129)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)',
        'rgb(139, 92, 246)',
      ],
    },
  ],
});

const topProductsData = ref({
  labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
  datasets: [
    {
      label: 'Sales',
      data: [120, 95, 80, 65, 45],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
    },
  ],
});

const monthlyComparisonData = ref({
  labels: ['This Month', 'Last Month'],
  datasets: [
    {
      label: 'Revenue',
      data: [45000, 38000],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(156, 163, 175, 0.8)'],
    },
  ],
});

// Chart options
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

const barOptions = {
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

// Methods
const formatCurrency = (amount: number): string => {
  return FormatUtility.currency(amount);
};

const loadReportsData = async () => {
  try {
    isLoading.value = true;

    // Load sales data
    const salesResult = await saleService.findAll({ page: 1, limit: 100 });
    const sales = salesResult.data;

    // Calculate metrics
    metrics.value.totalSales = sales.length;
    metrics.value.totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    metrics.value.averageOrderValue = formatCurrency(
      metrics.value.totalSales > 0 ? metrics.value.totalRevenue / metrics.value.totalSales : 0
    );

    // Load customers
    const customersResult = await customerService.findAll({ page: 1, limit: 100 });
    metrics.value.newCustomers = customersResult.data.length;

    // Load stock data
    const stockResult = await stockService.findAll({ page: 1, limit: 100 });
    const stockItems = stockResult.data;
    metrics.value.inventoryValue = stockItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    // Get low stock items
    lowStockItems.value = stockItems.filter(item => item.quantity <= 10).slice(0, 5);

    // Mock top customers data
    topCustomers.value = [
      { id: 1, name: 'John Doe', totalOrders: 15, totalSpent: 5400, averageOrder: 360 },
      { id: 2, name: 'Jane Smith', totalOrders: 12, totalSpent: 4200, averageOrder: 350 },
      { id: 3, name: 'Bob Johnson', totalOrders: 10, totalSpent: 3800, averageOrder: 380 },
      { id: 4, name: 'Alice Brown', totalOrders: 8, totalSpent: 2900, averageOrder: 362 },
      { id: 5, name: 'Charlie Wilson', totalOrders: 7, totalSpent: 2500, averageOrder: 357 },
    ];

  } catch (error) {
    console.error('Error loading reports data:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateReports = () => {
  loadReportsData();
};

const refreshReports = () => {
  loadReportsData();
};

const exportSalesReport = async () => {
  try {
    const headers = ['Date', 'Invoice', 'Customer', 'Amount', 'Status'];
    const data = [
      ['2024-01-15', 'INV-001', 'John Doe', '$1,200', 'Paid'],
      ['2024-01-14', 'INV-002', 'Jane Smith', '$850', 'Pending'],
      ['2024-01-13', 'INV-003', 'Bob Johnson', '$2,100', 'Paid'],
    ];

    await ExportUtility.export({
      headers,
      data,
      format: 'xlsx',
      filename: 'sales-report',
    });
  } catch (error) {
    console.error('Error exporting sales report:', error);
  }
};

const exportInventoryReport = async () => {
  try {
    const headers = ['Product', 'SKU', 'Quantity', 'Unit Cost', 'Total Value'];
    const data = lowStockItems.value.map(item => [
      item.product.name,
      item.product.sku || 'N/A',
      item.quantity.toString(),
      formatCurrency(item.unitCost),
      formatCurrency(item.quantity * item.unitCost),
    ]);

    await ExportUtility.export({
      headers,
      data,
      format: 'xlsx',
      filename: 'inventory-report',
    });
  } catch (error) {
    console.error('Error exporting inventory report:', error);
  }
};

const exportCustomerReport = async () => {
  try {
    const headers = ['Customer', 'Total Orders', 'Total Spent', 'Average Order'];
    const data = topCustomers.value.map(customer => [
      customer.name,
      customer.totalOrders.toString(),
      formatCurrency(customer.totalSpent),
      formatCurrency(customer.averageOrder),
    ]);

    await ExportUtility.export({
      headers,
      data,
      format: 'xlsx',
      filename: 'customer-report',
    });
  } catch (error) {
    console.error('Error exporting customer report:', error);
  }
};

const exportFinancialReport = async () => {
  try {
    const headers = ['Metric', 'Value'];
    const data = [
      ['Total Revenue', formatCurrency(metrics.value.totalRevenue)],
      ['Total Sales', metrics.value.totalSales.toString()],
      ['Average Order Value', metrics.value.averageOrderValue],
      ['Inventory Value', formatCurrency(metrics.value.inventoryValue)],
      ['New Customers', metrics.value.newCustomers.toString()],
    ];

    await ExportUtility.export({
      headers,
      data,
      format: 'xlsx',
      filename: 'financial-report',
    });
  } catch (error) {
    console.error('Error exporting financial report:', error);
  }
};

onMounted(() => {
  loadReportsData();
});
</script>