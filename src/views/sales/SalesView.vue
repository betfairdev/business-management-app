<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your sales transactions and orders
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
        <BaseButton @click="showSaleModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          New Sale
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard variant="bordered" padding="lg">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseSelect
          v-model="filters.status"
          label="Status"
          :options="statusOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.customer"
          label="Customer"
          :options="customerOptions"
          @change="applyFilters"
        />
        <BaseInput
          v-model="filters.dateFrom"
          type="date"
          label="From Date"
          @change="applyFilters"
        />
        <BaseInput
          v-model="filters.dateTo"
          type="date"
          label="To Date"
          @change="applyFilters"
        />
      </div>
    </BaseCard>

    <!-- Sales Table -->
    <ResponsiveDataTable
      :data="sales"
      :columns="saleColumns"
      :loading="isLoading"
      :exportable="true"
      :mobile-columns="['invoiceNumber', 'customer.name', 'totalAmount', 'status']"
      @row-click="viewSale"
    >
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="exportSales">
          <template #icon-left>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </template>
          Export
        </BaseButton>
      </template>

      <template #cell-invoiceNumber="{ item }">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ item.invoiceNumber || `Sale #${item.id.slice(-6)}` }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(item.saleDate) }}</p>
        </div>
      </template>

      <template #cell-customer="{ item }">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ item.customer?.name || 'Walk-in Customer' }}
          </p>
          <p v-if="item.customer?.phone" class="text-sm text-gray-500 dark:text-gray-400">
            {{ item.customer.phone }}
          </p>
        </div>
      </template>

      <template #cell-totalAmount="{ value }">
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ formatCurrency(value) }}
        </span>
      </template>

      <template #cell-status="{ value }">
        <span
          :class="getStatusClass(value)"
          class="px-2 py-1 text-xs font-medium rounded-full"
        >
          {{ value }}
        </span>
      </template>

      <template #row-actions="{ item }">
        <div class="flex space-x-2">
          <BaseButton size="sm" variant="secondary" @click="editSale(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </template>
            Edit
          </BaseButton>
          <BaseButton size="sm" variant="primary" @click="printInvoice(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </template>
            Print
          </BaseButton>
        </div>
      </template>
    </ResponsiveDataTable>

    <!-- Sale Modal -->
    <BaseModal v-model="showSaleModal" :title="editingSale ? 'Edit Sale' : 'New Sale'" size="2xl">
      <FormBuilder
        :fields="saleFields"
        :initial-data="editingSale"
        :loading="isSubmitting"
        :submit-text="editingSale ? 'Update Sale' : 'Create Sale'"
        show-cancel
        @submit="handleSaleSubmit"
        @cancel="closeSaleModal"
      />
    </BaseModal>

    <!-- Import Modal -->
    <BaseModal v-model="showImportModal" title="Import Sales" size="lg">
      <ImportModal
        entity-type="sales"
        :template-headers="importHeaders"
        @import="handleImport"
        @close="showImportModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '../../components/ui/BaseCard.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseSelect from '../../components/ui/BaseSelect.vue';
import BaseInput from '../../components/ui/BaseInput.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import ResponsiveDataTable from '../../components/layout/ResponsiveDataTable.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import ImportModal from '../../components/common/ImportModal.vue';
import { SaleService } from '../../services/SaleService';
import { CustomerService } from '../../services/CustomerService';
import { ExportUtility } from '../../utils/exportUtility';
import { FormatUtility } from '../../utils/formatUtility';
import type { Sale } from '../../entities/Sale';
import type { CreateSaleDto } from '../../dtos/CreateSaleDto';
import type { TableColumn } from '../../components/common/DataTable.vue';

const router = useRouter();

// Services
const saleService = new SaleService();
const customerService = new CustomerService();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);
const sales = ref<Sale[]>([]);
const customers = ref<any[]>([]);

// Modal state
const showSaleModal = ref(false);
const showImportModal = ref(false);
const editingSale = ref<Sale | null>(null);

// Filters
const filters = ref({
  status: '',
  customer: '',
  dateFrom: '',
  dateTo: '',
});

// Table columns
const saleColumns: TableColumn[] = [
  { key: 'invoiceNumber', title: 'Invoice', sortable: true },
  { key: 'customer', title: 'Customer', sortable: false },
  { key: 'totalAmount', title: 'Amount', sortable: true, format: 'currency' },
  { key: 'status', title: 'Status', sortable: true },
  { key: 'saleDate', title: 'Date', sortable: true, format: 'date' },
];

// Options
const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const customerOptions = computed(() => [
  { label: 'All Customers', value: '' },
  ...customers.value.map(customer => ({ label: customer.name, value: customer.id }))
]);

// Form fields
const saleFields: FormField[] = [
  {
    name: 'saleDate',
    type: 'date',
    label: 'Sale Date',
    required: true,
    validation: { required: true },
  },
  {
    name: 'customer',
    type: 'select',
    label: 'Customer',
    options: customerOptions.value,
  },
  {
    name: 'invoiceNumber',
    type: 'text',
    label: 'Invoice Number',
  },
  {
    name: 'subTotal',
    type: 'number',
    label: 'Sub Total',
    required: true,
    validation: { required: true, min: 0 },
  },
  {
    name: 'discount',
    type: 'number',
    label: 'Discount',
  },
  {
    name: 'taxAmount',
    type: 'number',
    label: 'Tax Amount',
  },
  {
    name: 'deliveryCharge',
    type: 'number',
    label: 'Delivery Charge',
  },
  {
    name: 'totalAmount',
    type: 'number',
    label: 'Total Amount',
    required: true,
    validation: { required: true, min: 0 },
  },
  {
    name: 'dueAmount',
    type: 'number',
    label: 'Due Amount',
    required: true,
    validation: { required: true, min: 0 },
  },
  {
    name: 'status',
    type: 'select',
    label: 'Status',
    required: true,
    options: statusOptions.slice(1), // Remove "All Status" option
  },
  {
    name: 'notes',
    type: 'textarea',
    label: 'Notes',
    rows: 3,
  },
];

const importHeaders = [
  'saleDate', 'customer', 'invoiceNumber', 'subTotal', 'discount', 'taxAmount', 
  'deliveryCharge', 'totalAmount', 'dueAmount', 'status', 'notes'
];

// Methods
const loadSales = async () => {
  try {
    isLoading.value = true;
    const result = await saleService.findAll({
      page: 1,
      limit: 100,
    });
    
    sales.value = result.data;
  } catch (error) {
    console.error('Error loading sales:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadCustomers = async () => {
  try {
    const result = await customerService.findAll({ limit: 100 });
    customers.value = result.data;
  } catch (error) {
    console.error('Error loading customers:', error);
  }
};

const applyFilters = () => {
  loadSales();
};

const formatCurrency = (amount: number): string => {
  return FormatUtility.currency(amount);
};

const formatDate = (date: string): string => {
  return FormatUtility.date(date);
};

const getStatusClass = (status: string): string => {
  const classes = {
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Partial': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Paid': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

const viewSale = (sale: Sale) => {
  router.push(`/sales/${sale.id}`);
};

const editSale = (sale: Sale) => {
  editingSale.value = sale;
  showSaleModal.value = true;
};

const printInvoice = (sale: Sale) => {
  // Implement print functionality
  console.log('Print invoice for sale:', sale.id);
};

const handleSaleSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    
    const saleData: CreateSaleDto = {
      ...formData,
      subTotal: Number(formData.subTotal),
      discount: formData.discount ? Number(formData.discount) : 0,
      taxAmount: formData.taxAmount ? Number(formData.taxAmount) : 0,
      deliveryCharge: formData.deliveryCharge ? Number(formData.deliveryCharge) : 0,
      totalAmount: Number(formData.totalAmount),
      dueAmount: Number(formData.dueAmount),
    };

    if (editingSale.value) {
      await saleService.update(editingSale.value.id, saleData);
    } else {
      await saleService.create(saleData);
    }

    closeSaleModal();
    loadSales();
  } catch (error) {
    console.error('Error saving sale:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const closeSaleModal = () => {
  showSaleModal.value = false;
  editingSale.value = null;
};

const handleImport = async (data: any[]) => {
  try {
    isSubmitting.value = true;
    
    for (const item of data) {
      const saleData: CreateSaleDto = {
        saleDate: item.saleDate,
        customer: item.customer,
        invoiceNumber: item.invoiceNumber,
        subTotal: Number(item.subTotal),
        discount: item.discount ? Number(item.discount) : 0,
        taxAmount: item.taxAmount ? Number(item.taxAmount) : 0,
        deliveryCharge: item.deliveryCharge ? Number(item.deliveryCharge) : 0,
        totalAmount: Number(item.totalAmount),
        dueAmount: Number(item.dueAmount),
        status: item.status || 'Pending',
        notes: item.notes,
      };
      
      await saleService.create(saleData);
    }
    
    showImportModal.value = false;
    loadSales();
  } catch (error) {
    console.error('Error importing sales:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const exportSales = async () => {
  try {
    const headers = saleColumns.map(col => col.title);
    const data = sales.value.map(sale => [
      sale.invoiceNumber || `Sale #${sale.id.slice(-6)}`,
      sale.customer?.name || 'Walk-in Customer',
      formatCurrency(sale.totalAmount),
      sale.status,
      formatDate(sale.saleDate),
    ]);

    await ExportUtility.export({
      headers,
      data,
      format: 'csv',
      filename: 'sales',
    });
  } catch (error) {
    console.error('Error exporting sales:', error);
  }
};

onMounted(() => {
  loadSales();
  loadCustomers();
});
</script>