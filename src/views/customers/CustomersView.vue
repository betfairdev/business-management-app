<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your customer database and relationships
        </p>
      </div>
      <div class="mt-4 sm:mt-0 flex space-x-3">
        <BaseButton variant="secondary" @click="showImportModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </template>
          Import
        </BaseButton>
        <BaseButton @click="showCustomerModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          Add Customer
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard variant="bordered" padding="lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseSelect
          v-model="filters.customerType"
          label="Customer Type"
          :options="customerTypeOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.status"
          label="Status"
          :options="statusOptions"
          @change="applyFilters"
        />
        <BaseInput
          v-model="searchQuery"
          placeholder="Search customers..."
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

    <!-- Customers Table -->
    <ResponsiveDataTable
      :data="customers"
      :columns="customerColumns"
      :loading="isLoading"
      :exportable="true"
      :mobile-columns="['name', 'phone', 'customerType']"
      @row-click="viewCustomer"
    >
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="exportCustomers">
          <template #icon-left>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          Export
        </BaseButton>
      </template>

      <template #cell-name="{ item }">
        <div class="flex items-center">
          <div class="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span class="text-blue-600 dark:text-blue-400 font-medium text-sm">
              {{ getInitials(item.name) }}
            </span>
          </div>
          <div class="ml-3">
            <p class="font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
            <p v-if="item.email" class="text-sm text-gray-500 dark:text-gray-400">{{ item.email }}</p>
          </div>
        </div>
      </template>

      <template #cell-contact="{ item }">
        <div>
          <p v-if="item.phone" class="text-sm text-gray-900 dark:text-white">{{ item.phone }}</p>
          <p v-if="item.whatsapp" class="text-sm text-gray-500 dark:text-gray-400">WhatsApp: {{ item.whatsapp }}</p>
        </div>
      </template>

      <template #cell-customerType="{ value }">
        <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {{ value }}
        </span>
      </template>

      <template #cell-status="{ value }">
        <span
          :class="value === 'Active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'"
          class="px-2 py-1 text-xs font-medium rounded-full"
        >
          {{ value }}
        </span>
      </template>

      <template #row-actions="{ item }">
        <div class="flex space-x-2">
          <BaseButton size="sm" variant="secondary" @click="editCustomer(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </template>
            Edit
          </BaseButton>
          <BaseButton size="sm" variant="primary" @click="viewSalesHistory(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </template>
            Sales
          </BaseButton>
        </div>
      </template>
    </ResponsiveDataTable>

    <!-- Customer Modal -->
    <BaseModal v-model="showCustomerModal" :title="editingCustomer ? 'Edit Customer' : 'Add Customer'" size="lg">
      <FormBuilder
        :fields="customerFields"
        :initial-data="editingCustomer"
        :loading="isSubmitting"
        :submit-text="editingCustomer ? 'Update Customer' : 'Create Customer'"
        show-cancel
        @submit="handleCustomerSubmit"
        @cancel="closeCustomerModal"
      />
    </BaseModal>

    <!-- Import Modal -->
    <BaseModal v-model="showImportModal" title="Import Customers" size="lg">
      <ImportModal
        entity-type="customers"
        :template-headers="importHeaders"
        @import="handleImport"
        @close="showImportModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '../../components/ui/BaseCard.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import ResponsiveDataTable from '../../components/layout/ResponsiveDataTable.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import ImportModal from '../../components/common/ImportModal.vue';
import { CustomerService } from '../../services/CustomerService';
import { ExportUtility } from '../../utils/exportUtility';
import type { Customer } from '../../entities/Customer';
import type { CreateCustomerDto } from '../../dtos/CreateCustomerDto';
import type { TableColumn } from '../../components/common/DataTable.vue';

const router = useRouter();

// Services
const customerService = new CustomerService();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);
const customers = ref<Customer[]>([]);
const searchQuery = ref('');

// Modal state
const showCustomerModal = ref(false);
const showImportModal = ref(false);
const editingCustomer = ref<Customer | null>(null);

// Filters
const filters = ref({
  customerType: '',
  status: '',
});

// Table columns
const customerColumns: TableColumn[] = [
  { key: 'name', title: 'Customer', sortable: true },
  { key: 'contact', title: 'Contact', sortable: false },
  { key: 'customerType', title: 'Type', sortable: true },
  { key: 'address', title: 'Address', sortable: false },
  { key: 'status', title: 'Status', sortable: true },
];

// Options
const customerTypeOptions = [
  { label: 'All Types', value: '' },
  { label: 'Retailer', value: 'Retailer' },
  { label: 'Dealer', value: 'Dealer' },
  { label: 'Wholesaler', value: 'Wholesaler' },
];

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

// Form fields
const customerFields: FormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Customer Name',
    required: true,
    validation: { required: true, minLength: 2 },
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    validation: { email: true },
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone',
    validation: { phone: true },
  },
  {
    name: 'whatsapp',
    type: 'tel',
    label: 'WhatsApp',
    validation: { phone: true },
  },
  {
    name: 'address',
    type: 'textarea',
    label: 'Address',
    rows: 3,
  },
  {
    name: 'companyName',
    type: 'text',
    label: 'Company Name',
  },
  {
    name: 'customerType',
    type: 'select',
    label: 'Customer Type',
    options: customerTypeOptions.slice(1), // Remove "All Types" option
  },
  {
    name: 'taxId',
    type: 'text',
    label: 'Tax ID',
  },
  {
    name: 'status',
    type: 'select',
    label: 'Status',
    options: statusOptions.slice(1), // Remove "All Status" option
  },
];

const importHeaders = [
  'name', 'email', 'phone', 'whatsapp', 'address', 'companyName', 'customerType', 'taxId', 'status'
];

// Methods
const loadCustomers = async () => {
  try {
    isLoading.value = true;
    const result = await customerService.findAll({
      query: searchQuery.value,
    });
    
    customers.value = result.data;
  } catch (error) {
    console.error('Error loading customers:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleSearch = () => {
  loadCustomers();
};

const applyFilters = () => {
  loadCustomers();
};

const getInitials = (name: string): string => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
};

const viewCustomer = (customer: Customer) => {
  router.push(`/customers/${customer.id}`);
};

const editCustomer = (customer: Customer) => {
  editingCustomer.value = customer;
  showCustomerModal.value = true;
};

const viewSalesHistory = (customer: Customer) => {
  router.push(`/sales?customer=${customer.id}`);
};

const handleCustomerSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    
    const customerData: CreateCustomerDto = {
      ...formData,
    };

    if (editingCustomer.value) {
      await customerService.update(editingCustomer.value.id, customerData);
    } else {
      await customerService.create(customerData);
    }

    closeCustomerModal();
    loadCustomers();
  } catch (error) {
    console.error('Error saving customer:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const closeCustomerModal = () => {
  showCustomerModal.value = false;
  editingCustomer.value = null;
};

const handleImport = async (data: any[]) => {
  try {
    isSubmitting.value = true;
    
    for (const item of data) {
      const customerData: CreateCustomerDto = {
        name: item.name,
        email: item.email,
        phone: item.phone,
        whatsapp: item.whatsapp,
        address: item.address,
        companyName: item.companyName,
        customerType: item.customerType || 'Retailer',
        taxId: item.taxId,
        status: item.status || 'Active',
      };
      
      await customerService.create(customerData);
    }
    
    showImportModal.value = false;
    loadCustomers();
  } catch (error) {
    console.error('Error importing customers:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const exportCustomers = async () => {
  try {
    const headers = customerColumns.map(col => col.title);
    const data = customers.value.map(customer => [
      customer.name,
      `${customer.phone || ''} ${customer.email || ''}`.trim(),
      customer.customerType,
      customer.address || '',
      customer.status,
    ]);

    await ExportUtility.export({
      headers,
      data,
      format: 'csv',
      filename: 'customers',
    });
  } catch (error) {
    console.error('Error exporting customers:', error);
  }
};

onMounted(() => {
  loadCustomers();
});
</script>