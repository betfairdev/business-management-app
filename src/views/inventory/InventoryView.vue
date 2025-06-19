<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Track and manage your stock levels across all locations
        </p>
      </div>
      <div class="mt-4 sm:mt-0 flex space-x-3">
        <BaseButton variant="secondary" @click="showAdjustmentModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </template>
          Stock Adjustment
        </BaseButton>
        <BaseButton variant="secondary" @click="showTransferModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </template>
          Transfer Stock
        </BaseButton>
        <BaseButton @click="showStockModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          Add Stock
        </BaseButton>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.totalItems }}</p>
          </div>
        </div>
      </BaseCard>

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
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(stats.totalValue) }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.lowStockItems }}</p>
          </div>
        </div>
      </BaseCard>

      <BaseCard variant="bordered" padding="lg">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Out of Stock</p>
            <p class="text-2xl font-semibold text-gray-900 dark:text-white">{{ stats.outOfStockItems }}</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Filters -->
    <BaseCard variant="bordered" padding="lg">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseSelect
          v-model="filters.store"
          label="Store"
          :options="storeOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.category"
          label="Category"
          :options="categoryOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.stockStatus"
          label="Stock Status"
          :options="stockStatusOptions"
          @change="applyFilters"
        />
        <BaseInput
          v-model="searchQuery"
          placeholder="Search products..."
          clearable
          @input="handleSearch"
        >
          <template #icon-left>
            <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </template>
        </BaseInput>
      </div>
    </BaseCard>

    <!-- Stock Table -->
    <ResponsiveDataTable
      :data="stockItems"
      :columns="stockColumns"
      :loading="isLoading"
      :exportable="true"
      :mobile-columns="['product.name', 'quantity', 'unitCost']"
      @row-click="viewStockDetails"
    >
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="exportStock">
          <template #icon-left>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          Export
        </BaseButton>
      </template>

      <template #cell-product="{ item }">
        <div class="flex items-center">
          <div class="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="font-medium text-gray-900 dark:text-white">{{ item.product.name }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.product.sku || 'No SKU' }}</p>
          </div>
        </div>
      </template>

      <template #cell-quantity="{ item }">
        <div>
          <span :class="getQuantityClass(item.quantity)" class="font-semibold">
            {{ item.quantity }}
          </span>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.product.unitType }}</p>
        </div>
      </template>

      <template #cell-unitCost="{ value }">
        <span class="font-medium text-gray-900 dark:text-white">
          {{ formatCurrency(value) }}
        </span>
      </template>

      <template #cell-totalValue="{ item }">
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ formatCurrency(item.quantity * item.unitCost) }}
        </span>
      </template>

      <template #cell-store="{ item }">
        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {{ item.store?.name || 'Main Store' }}
        </span>
      </template>

      <template #row-actions="{ item }">
        <div class="flex space-x-2">
          <BaseButton size="sm" variant="secondary" @click="adjustStock(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </template>
            Adjust
          </BaseButton>
          <BaseButton size="sm" variant="primary" @click="transferStock(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </template>
            Transfer
          </BaseButton>
        </div>
      </template>
    </ResponsiveDataTable>

    <!-- Stock Modal -->
    <BaseModal v-model="showStockModal" title="Add Stock" size="lg">
      <FormBuilder
        :fields="stockFields"
        :loading="isSubmitting"
        submit-text="Add Stock"
        show-cancel
        @submit="handleStockSubmit"
        @cancel="showStockModal = false"
      />
    </BaseModal>

    <!-- Adjustment Modal -->
    <BaseModal v-model="showAdjustmentModal" title="Stock Adjustment" size="lg">
      <FormBuilder
        :fields="adjustmentFields"
        :loading="isSubmitting"
        submit-text="Apply Adjustment"
        show-cancel
        @submit="handleAdjustmentSubmit"
        @cancel="showAdjustmentModal = false"
      />
    </BaseModal>

    <!-- Transfer Modal -->
    <BaseModal v-model="showTransferModal" title="Stock Transfer" size="lg">
      <FormBuilder
        :fields="transferFields"
        :loading="isSubmitting"
        submit-text="Transfer Stock"
        show-cancel
        @submit="handleTransferSubmit"
        @cancel="showTransferModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseCard from '../../components/ui/BaseCard.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import ResponsiveDataTable from '../../components/layout/ResponsiveDataTable.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import { StockService } from '../../services/StockService';
import { StockAdjustmentService } from '../../services/StockAdjustmentService';
import { StockTransferService } from '../../services/StockTransferService';
import { ProductService } from '../../services/ProductService';
import { StoreService } from '../../services/StoreService';
import { CategoryService } from '../../services/CategoryService';
import { ExportUtility } from '../../utils/exportUtility';
import { FormatUtility } from '../../utils/formatUtility';
import type { Stock } from '../../entities/Stock';
import type { TableColumn } from '../../components/common/DataTable.vue';

// Services
const stockService = new StockService();
const adjustmentService = new StockAdjustmentService();
const transferService = new StockTransferService();
const productService = new ProductService();
const storeService = new StoreService();
const categoryService = new CategoryService();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);
const stockItems = ref<Stock[]>([]);
const products = ref<any[]>([]);
const stores = ref<any[]>([]);
const categories = ref<any[]>([]);
const searchQuery = ref('');

// Modal state
const showStockModal = ref(false);
const showAdjustmentModal = ref(false);
const showTransferModal = ref(false);

// Stats
const stats = ref({
  totalItems: 0,
  totalValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
});

// Filters
const filters = ref({
  store: '',
  category: '',
  stockStatus: '',
});

// Table columns
const stockColumns: TableColumn[] = [
  { key: 'product', title: 'Product', sortable: false },
  { key: 'quantity', title: 'Quantity', sortable: true },
  { key: 'unitCost', title: 'Unit Cost', sortable: true, format: 'currency' },
  { key: 'totalValue', title: 'Total Value', sortable: false },
  { key: 'store', title: 'Store', sortable: false },
];

// Options
const storeOptions = computed(() => [
  { label: 'All Stores', value: '' },
  ...stores.value.map(store => ({ label: store.name, value: store.id }))
]);

const categoryOptions = computed(() => [
  { label: 'All Categories', value: '' },
  ...categories.value.map(cat => ({ label: cat.name, value: cat.id }))
]);

const productOptions = computed(() => 
  products.value.map(product => ({ label: product.name, value: product.id }))
);

const stockStatusOptions = [
  { label: 'All Stock', value: '' },
  { label: 'In Stock', value: 'in-stock' },
  { label: 'Low Stock', value: 'low-stock' },
  { label: 'Out of Stock', value: 'out-of-stock' },
];

// Form fields
const stockFields: FormField[] = [
  {
    name: 'product',
    type: 'select',
    label: 'Product',
    required: true,
    options: productOptions.value,
    validation: { required: true },
  },
  {
    name: 'quantity',
    type: 'number',
    label: 'Quantity',
    required: true,
    validation: { required: true, min: 1 },
  },
  {
    name: 'unitCost',
    type: 'number',
    label: 'Unit Cost',
    required: true,
    validation: { required: true, min: 0 },
  },
  {
    name: 'warehouse',
    type: 'text',
    label: 'Warehouse Location',
  },
  {
    name: 'notes',
    type: 'textarea',
    label: 'Notes',
    rows: 3,
  },
];

const adjustmentFields: FormField[] = [
  {
    name: 'product',
    type: 'select',
    label: 'Product',
    required: true,
    options: productOptions.value,
    validation: { required: true },
  },
  {
    name: 'adjustmentType',
    type: 'select',
    label: 'Adjustment Type',
    required: true,
    options: [
      { label: 'Increase', value: 'Increase' },
      { label: 'Decrease', value: 'Decrease' },
    ],
    validation: { required: true },
  },
  {
    name: 'quantityChange',
    type: 'number',
    label: 'Quantity Change',
    required: true,
    validation: { required: true, min: 1 },
  },
  {
    name: 'reason',
    type: 'text',
    label: 'Reason',
    required: true,
    validation: { required: true },
  },
  {
    name: 'notes',
    type: 'textarea',
    label: 'Notes',
    rows: 3,
  },
];

const transferFields: FormField[] = [
  {
    name: 'product',
    type: 'select',
    label: 'Product',
    required: true,
    options: productOptions.value,
    validation: { required: true },
  },
  {
    name: 'quantity',
    type: 'number',
    label: 'Quantity',
    required: true,
    validation: { required: true, min: 1 },
  },
  {
    name: 'fromStore',
    type: 'select',
    label: 'From Store',
    required: true,
    options: storeOptions.value.slice(1),
    validation: { required: true },
  },
  {
    name: 'toStore',
    type: 'select',
    label: 'To Store',
    required: true,
    options: storeOptions.value.slice(1),
    validation: { required: true },
  },
  {
    name: 'notes',
    type: 'textarea',
    label: 'Notes',
    rows: 3,
  },
];

// Methods
const loadStockItems = async () => {
  try {
    isLoading.value = true;
    const result = await stockService.findAll({
      query: searchQuery.value,
    });
    
    stockItems.value = result.data;
    calculateStats();
  } catch (error) {
    console.error('Error loading stock items:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadProducts = async () => {
  try {
    const result = await productService.findAll({ limit: 1000 });
    products.value = result.data;
  } catch (error) {
    console.error('Error loading products:', error);
  }
};

const loadStores = async () => {
  try {
    const result = await storeService.findAll({ limit: 100 });
    stores.value = result.data;
  } catch (error) {
    console.error('Error loading stores:', error);
  }
};

const loadCategories = async () => {
  try {
    const result = await categoryService.findAll({ limit: 100 });
    categories.value = result.data;
  } catch (error) {
    console.error('Error loading categories:', error);
  }
};

const calculateStats = () => {
  stats.value.totalItems = stockItems.value.length;
  stats.value.totalValue = stockItems.value.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  stats.value.lowStockItems = stockItems.value.filter(item => item.quantity > 0 && item.quantity <= 10).length;
  stats.value.outOfStockItems = stockItems.value.filter(item => item.quantity === 0).length;
};

const handleSearch = () => {
  loadStockItems();
};

const applyFilters = () => {
  loadStockItems();
};

const formatCurrency = (amount: number): string => {
  return FormatUtility.currency(amount);
};

const getQuantityClass = (quantity: number): string => {
  if (quantity === 0) return 'text-red-600 dark:text-red-400';
  if (quantity <= 10) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
};

const viewStockDetails = (stock: Stock) => {
  console.log('View stock details:', stock);
};

const adjustStock = (stock: Stock) => {
  showAdjustmentModal.value = true;
};

const transferStock = (stock: Stock) => {
  showTransferModal.value = true;
};

const handleStockSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await stockService.create(formData);
    showStockModal.value = false;
    loadStockItems();
  } catch (error) {
    console.error('Error adding stock:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleAdjustmentSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await adjustmentService.create({
      ...formData,
      status: 'Done',
    });
    showAdjustmentModal.value = false;
    loadStockItems();
  } catch (error) {
    console.error('Error adjusting stock:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleTransferSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await transferService.create({
      ...formData,
      status: 'Completed',
    });
    showTransferModal.value = false;
    loadStockItems();
  } catch (error) {
    console.error('Error transferring stock:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const exportStock = async () => {
  try {
    const headers = stockColumns.map(col => col.title);
    const data = stockItems.value.map(item => [
      item.product.name,
      item.quantity.toString(),
      formatCurrency(item.unitCost),
      formatCurrency(item.quantity * item.unitCost),
      item.store?.name || 'Main Store',
    ]);

    await ExportUtility.export({
      headers,
      data,
      format: 'csv',
      filename: 'inventory',
    });
  } catch (error) {
    console.error('Error exporting stock:', error);
  }
};

onMounted(() => {
  loadStockItems();
  loadProducts();
  loadStores();
  loadCategories();
});
</script>