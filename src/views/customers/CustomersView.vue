<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your customer database
        </p>
      </div>
      
      <div class="mt-4 sm:mt-0">
        <BaseButton
          v-if="authStore.hasPermission('customers', 'create')"
          @click="showCreateModal = true"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Add Customer
        </BaseButton>
      </div>
    </div>

    <!-- Customers Table -->
    <ResponsiveDataTable
      :data="customers"
      :columns="tableColumns"
      :loading="isLoading"
      :selectable="authStore.hasPermission('customers', 'delete')"
      :exportable="authStore.hasPermission('customers', 'export')"
      :mobile-columns="['name', 'phone', 'status']"
      @row-click="handleCustomerClick"
      @selection-change="handleSelectionChange"
    >
      <template #actions>
        <BaseButton
          v-if="selectedCustomers.length > 0 && authStore.hasPermission('customers', 'delete')"
          variant="danger"
          size="sm"
          @click="handleBulkDelete"
        >
          Delete Selected ({{ selectedCustomers.length }})
        </BaseButton>
      </template>

      <template #cell-status="{ value }">
        <span
          :class="[
            'px-2 py-1 text-xs font-medium rounded-full',
            value === 'Active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          ]"
        >
          {{ value }}
        </span>
      </template>

      <template #cell-customerType="{ value }">
        <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
          {{ value }}
        </span>
      </template>

      <template #row-actions="{ item }">
        <div class="flex space-x-2">
          <BaseButton
            v-if="authStore.hasPermission('customers', 'update')"
            size="sm"
            variant="secondary"
            @click="handleEditCustomer(item)"
          >
            Edit
          </BaseButton>
          <BaseButton
            size="sm"
            variant="info"
            @click="handleViewSales(item)"
          >
            Sales
          </BaseButton>
        </div>
      </template>
    </ResponsiveDataTable>

    <!-- Create/Edit Modal -->
    <BaseModal
      v-model="showCreateModal"
      :title="editingCustomer ? 'Edit Customer' : 'Create Customer'"
      size="lg"
    >
      <FormBuilder
        :fields="customerFields"
        :initial-data="editingCustomer"
        :loading="isSubmitting"
        :submit-text="editingCustomer ? 'Update Customer' : 'Create Customer'"
        show-cancel
        @submit="handleSubmitCustomer"
        @cancel="handleCancelEdit"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import ResponsiveDataTable from '../../components/layout/ResponsiveDataTable.vue';
import { BaseService } from '../../services/BaseService';
import { Customer } from '../../entities/Customer';
import { CreateCustomerDto } from '../../dtos/CreateCustomerDto';
import { UpdateCustomerDto } from '../../dtos/UpdateCustomerDto';
import type { TableColumn } from '../../components/common/DataTable.vue';

const authStore = useAuthStore();

// State
const customers = ref<Customer[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const showCreateModal = ref(false);
const editingCustomer = ref<Customer | null>(null);
const selectedCustomers = ref<string[]>([]);

// Services
const customerService = new BaseService(Customer, CreateCustomerDto, UpdateCustomerDto, ['name', 'phone', 'email', 'address']);

// Table columns
const tableColumns: TableColumn[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'phone', title: 'Phone', sortable: true },
  { key: 'customerType', title: 'Type', sortable: true },
  { key: 'address', title: 'Address', sortable: false },
  { key: 'status', title: 'Status', sortable: true },
  { key: 'createdAt', title: 'Created', format: 'date', sortable: true },
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
    type: 'text',
    label: 'Phone',
    validation: { phone: true },
  },
  {
    name: 'whatsapp',
    type: 'text',
    label: 'WhatsApp',
    hint: 'WhatsApp number (optional)',
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
    options: [
      { label: 'Retailer', value: 'Retailer' },
      { label: 'Dealer', value: 'Dealer' },
      { label: 'Wholesaler', value: 'Wholesaler' },
    ],
  },
  {
    name: 'taxId',
    type: 'text',
    label: 'Tax ID',
    hint: 'Tax identification number (optional)',
  },
  {
    name: 'status',
    type: 'select',
    label: 'Status',
    options: [
      { label: 'Active', value: 'Active' },
      { label: 'Inactive', value: 'Inactive' },
    ],
  },
];

// Methods
const loadCustomers = async () => {
  isLoading.value = true;
  try {
    const result = await customerService.findAll({
      limit: 100,
    });
    customers.value = result.data;
  } catch (error) {
    console.error('Failed to load customers:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleCustomerClick = (customer: Customer) => {
  console.log('Customer clicked:', customer);
};

const handleEditCustomer = (customer: Customer) => {
  editingCustomer.value = customer;
  showCreateModal.value = true;
};

const handleViewSales = (customer: Customer) => {
  console.log('View sales for:', customer);
};

const handleSubmitCustomer = async (formData: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    if (editingCustomer.value) {
      await customerService.update(editingCustomer.value.id, formData);
    } else {
      await customerService.create(formData);
    }
    
    showCreateModal.value = false;
    editingCustomer.value = null;
    await loadCustomers();
  } catch (error) {
    console.error('Failed to save customer:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancelEdit = () => {
  showCreateModal.value = false;
  editingCustomer.value = null;
};

const handleSelectionChange = (selected: string[]) => {
  selectedCustomers.value = selected;
};

const handleBulkDelete = async () => {
  if (confirm(`Are you sure you want to delete ${selectedCustomers.value.length} customers?`)) {
    try {
      await customerService.bulkDelete(selectedCustomers.value);
      selectedCustomers.value = [];
      await loadCustomers();
    } catch (error) {
      console.error('Failed to delete customers:', error);
    }
  }
};

// Initialize
onMounted(() => {
  loadCustomers();
});
</script>