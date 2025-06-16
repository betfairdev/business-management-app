<template>
  <div class="crm-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Customer Relationship Management</h1>
      <p class="text-gray-600">Manage your customers and track their interactions</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-full">
            <i class="fas fa-users text-blue-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Customers</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.totalCustomers }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-full">
            <i class="fas fa-user-check text-green-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Active Customers</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.activeCustomers }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="p-3 bg-purple-100 rounded-full">
            <i class="fas fa-user-plus text-purple-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">New This Month</p>
            <p class="text-2xl font-bold text-gray-900">{{ stats.newThisMonth }}</p>
          </div>
        </div>
      </div>
      
      <div class="bg-white p-6 rounded-lg shadow">
        <div class="flex items-center">
          <div class="p-3 bg-yellow-100 rounded-full">
            <i class="fas fa-dollar-sign text-yellow-600 text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Sales</p>
            <p class="text-2xl font-bold text-gray-900">${{ formatCurrency(stats.totalSales) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Table -->
    <div class="bg-white rounded-lg shadow">
      <DataTable
        title="Customers"
        :data="customers"
        :columns="customerColumns"
        :filters="customerFilters"
        :actions="customerActions"
        :loading="loading"
        :pagination="true"
        :page-size="20"
        :selectable="true"
        :allow-export="true"
        :allow-import="true"
        :allow-create="true"
        entity="customers"
        @search="handleSearch"
        @filter="handleFilter"
        @sort="handleSort"
        @page="handlePage"
        @action="handleAction"
        @create="showCreateModal = true"
        @export="handleExport"
        @import="handleImport"
      />
    </div>

    <!-- Customer Modal -->
    <CustomerModal
      v-if="showCreateModal || showEditModal"
      :customer="selectedCustomer"
      :is-edit="showEditModal"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Customer Detail Modal -->
    <CustomerDetailModal
      v-if="showDetailModal"
      :customer="selectedCustomer"
      @close="showDetailModal = false"
      @edit="editCustomer"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { crmService } from '../services/crmService';
import { exportImportService } from '../services/exportImportService';
import DataTable from '../components/common/DataTable.vue';
import CustomerModal from '../components/crm/CustomerModal.vue';
import CustomerDetailModal from '../components/crm/CustomerDetailModal.vue';

// Reactive data
const customers = ref([]);
const stats = ref({
  totalCustomers: 0,
  activeCustomers: 0,
  newThisMonth: 0,
  totalSales: 0,
  averageOrderValue: 0,
  topCustomers: [],
});
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);
const selectedCustomer = ref(null);

// Table configuration
const customerColumns = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'customerType', label: 'Type', type: 'status' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'createdAt', label: 'Created', type: 'date' },
];

const customerFilters = [
  {
    key: 'customerType',
    label: 'Customer Type',
    type: 'select',
    options: [
      { value: 'Retailer', label: 'Retailer' },
      { value: 'Dealer', label: 'Dealer' },
      { value: 'Wholesaler', label: 'Wholesaler' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'Active', label: 'Active' },
      { value: 'Inactive', label: 'Inactive' },
    ],
  },
  {
    key: 'createdAt',
    label: 'Created Date',
    type: 'date',
  },
];

const customerActions = [
  { key: 'view', label: 'View', icon: 'fas fa-eye', class: 'text-blue-600 hover:text-blue-900' },
  { key: 'edit', label: 'Edit', icon: 'fas fa-edit', class: 'text-green-600 hover:text-green-900' },
  { key: 'delete', label: 'Delete', icon: 'fas fa-trash', class: 'text-red-600 hover:text-red-900' },
];

// Methods
const loadCustomers = async (params = {}) => {
  loading.value = true;
  try {
    const response = await crmService.getCustomers(params);
    if (response.success) {
      customers.value = response.data || [];
    }
  } catch (error) {
    console.error('Failed to load customers:', error);
  } finally {
    loading.value = false;
  }
};

const loadStats = async () => {
  try {
    const response = await crmService.getCustomerStats();
    if (response.success) {
      stats.value = response.data || stats.value;
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
};

const handleSearch = (query: string) => {
  loadCustomers({ search: query });
};

const handleFilter = (filters: Record<string, any>) => {
  loadCustomers({ filters });
};

const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
  loadCustomers({ sortBy, sortOrder });
};

const handlePage = (page: number) => {
  loadCustomers({ page });
};

const handleAction = ({ action, item }: { action: string; item: any }) => {
  selectedCustomer.value = item;
  
  switch (action) {
    case 'view':
      showDetailModal.value = true;
      break;
    case 'edit':
      showEditModal.value = true;
      break;
    case 'delete':
      deleteCustomer(item);
      break;
  }
};

const editCustomer = (customer: any) => {
  selectedCustomer.value = customer;
  showDetailModal.value = false;
  showEditModal.value = true;
};

const deleteCustomer = async (customer: any) => {
  if (confirm(`Are you sure you want to delete ${customer.name}?`)) {
    try {
      const response = await crmService.deleteCustomer(customer.id);
      if (response.success) {
        await loadCustomers();
        await loadStats();
      } else {
        alert(response.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  selectedCustomer.value = null;
};

const handleSave = async (customerData: any) => {
  try {
    let response;
    if (showEditModal.value && selectedCustomer.value) {
      response = await crmService.updateCustomer(selectedCustomer.value.id, customerData);
    } else {
      response = await crmService.createCustomer(customerData);
    }
    
    if (response.success) {
      closeModal();
      await loadCustomers();
      await loadStats();
    } else {
      alert(response.error || 'Failed to save customer');
    }
  } catch (error) {
    console.error('Failed to save customer:', error);
    alert('Failed to save customer');
  }
};

const handleExport = async (exportOptions: any) => {
  try {
    const blob = await exportImportService.exportData('customers', exportOptions);
    const filename = exportImportService.generateFilename('customers', exportOptions.format);
    exportImportService.downloadBlob(blob, filename);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed');
  }
};

const handleImport = async (importData: any) => {
  // Refresh data after import
  await loadCustomers();
  await loadStats();
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Initialize
onMounted(() => {
  loadCustomers();
  loadStats();
});
</script>