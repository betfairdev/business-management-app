<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Purchases</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your purchase orders and supplier transactions
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
        <BaseButton @click="showPurchaseModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          New Purchase
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
          v-model="filters.supplier"
          label="Supplier"
          :options="supplierOptions"
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

    <!-- Purchases Table -->
    <ResponsiveDataTable
      :data="purchases"
      :columns="purchaseColumns"
      :loading="isLoading"
      :exportable="true"
      :mobile-columns="['invoiceNumber', 'supplier.name', 'totalAmount', 'status']"
      @row-click="viewPurchase"
    >
      <template #actions>
        <BaseButton variant="secondary" size="sm" @click="exportPurchases">
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
            {{ item.invoiceNumber || `Purchase #${item.id.slice(-6)}` }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(item.purchaseDate) }}</p>
        </div>
      </template>

      <template #cell-supplier="{ item }">
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ item.supplier?.name || 'Unknown Supplier' }}
          </p>
          <p v-if="item.supplier?.phone" class="text-sm text-gray-500 dark:text-gray-400">
            {{ item.supplier.phone }}
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
          <BaseButton size="sm" variant="secondary" @click="editPurchase(item)">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </template>
            Edit
          </BaseButton>
          <BaseButton size="sm" variant="primary" @click="printPurchaseOrder(item)">
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

    <!-- Purchase Modal -->
    <BaseModal v-model="showPurchaseModal" :title="editingPurchase ? 'Edit Purchase' : 'New Purchase'" size="2xl">
      <FormBuilder
        :fields="purchaseFields"
        :initial-data="editingPurchase"
        :loading="isSubmitting"
        :submit-text="editingPurchase ? 'Update Purchase' : 'Create Purchase'"
        show-cancel
        @submit="handlePurchaseSubmit"
        @cancel="closePurchaseModal"
      />
    </BaseModal>

    <!-- Import Modal -->
    <BaseModal v-model="showImportModal" title="Import Purchases" size="lg">
      <ImportModal
        entity-type="purchases"
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
import { PurchaseService } from '../../services/PurchaseService';
import { SupplierService } from '../../services/SupplierService';
import { ExportUtility } from '../../utils/exportUtility';
import { FormatUtility } from '../../utils/formatUtility';
import type { Purchase } from '../../entities/Purchase';
import type { CreatePurchaseDto } from '../../dtos/CreatePurchaseDto';
import type { TableColumn } from '../../components/common/DataTable.vue';

const router = useRouter();

// Services
const purchaseService = new PurchaseService();
const supplierService = new SupplierService();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);
const purchases = ref<Purchase[]>([]);
const suppliers = ref<any[]>([]);

// Modal state
const showPurchaseModal = ref(false);
const showImportModal = ref(false);
const editingPurchase = ref<Purchase | null>(null);

// Filters
const filters = ref({
  status: '',
  supplier: '',
  dateFrom: '',
  dateTo: '',
});

// Table columns
const purchaseColumns: TableColumn[] = [
  { key: 'invoiceNumber', title: 'Invoice', sortable: true },
  { key: 'supplier', title: 'Supplier', sortable: false },
  { key: 'totalAmount', title: 'Amount', sortable: true, format: 'currency' },
  { key: 'status', title: 'Status', sortable: true },
  { key: 'purchaseDate', title: 'Date', sortable: true, format: 'date' },
];

// Options
const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Partial', value: 'Partial' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Cancelled', value: 'Cancelled' },
];

const supplierOptions = computed(() => [
  { label: 'All Suppliers', value: '' },
  ...suppliers.value.map(supplier => ({ label: supplier.name, value: supplier.id }))
]);

// Form fields
const purchaseFields: FormField[] = [
  {
    name: 'purchaseDate',
    type: 'date',
    label: 'Purchase Date',
    required: true,
    validation: { required: true },
  },
  {
    name: 'supplier',
    type: 'select',
    label: 'Supplier',
    options: supplierOptions.value,
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
    name: 'shippingCharge',
    type: 'number',
    label: 'Shipping Charge',
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
  'purchaseDate', 'supplier', 'invoiceNumber', 'subTotal', 'discount', 'taxAmount', 
  'shippingCharge', 'totalAmount', 'dueAmount', 'status', 'notes'
];

// Methods
const loadPurchases = async () => {
  try {
    isLoading.value = true;
    const result = await purchaseService.findAll({
      page: 1,
      limit: 100,
    });
    
    purchases.value = result.data;
  } catch (error) {
    console.error('Error loading purchases:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadSuppliers = async () => {
  try {
    const result = await supplierService.findAll({ limit: 100 });
    suppliers.value = result.data;
  } catch (error) {
    console.error('Error loading suppliers:', error);
  }
};

const applyFilters = () => {
  loadPurchases();
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

const viewPurchase = (purchase: Purchase) => {
  router.push(`/purchases/${purchase.id}`);
};

const editPurchase = (purchase: Purchase) => {
  editingPurchase.value = purchase;
  showPurchaseModal.value = true;
};

const printPurchaseOrder = (purchase: Purchase) => {
  // Implement print functionality
  console.log('Print purchase order for:', purchase.id);
};

const handlePurchaseSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    
    const purchaseData: CreatePurchaseDto = {
      ...formData,
      subTotal: Number(formData.subTotal),
      discount: formData.discount ? Number(formData.discount) : 0,
      taxAmount: formData.taxAmount ? Number(formData.taxAmount) : 0,
      shippingCharge: formData.shippingCharge ? Number(formData.shippingCharge) : 0,
      totalAmount: Number(formData.totalAmount),
      dueAmount: Number(formData.dueAmount),
    };

    if (editingPurchase.value) {
      await purchaseService.update(editingPurchase.value.id, purchaseData);
    } else {
      await purchaseService.create(purchaseData);
    }

    closePurchaseModal();
    loadPurchases();
  } catch (error) {
    console.error('Error saving purchase:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const closePurchaseModal = () => {
  showPurchaseModal.value = false;
  editingPurchase.value = null;
};

const handleImport = async (data: any[]) => {
  try {
    isSubmitting.value = true;
    
    for (const item of data) {
      const purchaseData: CreatePurchaseDto = {
        purchaseDate: item.purchaseDate,
        supplier: item.supplier,
        invoiceNumber: item.invoiceNumber,
        subTotal: Number(item.subTotal),
        discount: item.discount ? Number(item.discount) : 0,
        taxAmount: item.taxAmount ? Number(item.taxAmount) : 0,
        shippingCharge: item.shippingCharge ? Number(item.shippingCharge) : 0,
        totalAmount: Number(item.totalAmount),
        dueAmount: Number(item.dueAmount),
        status: item.status || 'Pending',
        notes: item.notes,
      };
      
      await purchaseService.create(purchaseData);
    }
    
    showImportModal.value = false;
    loadPurchases();
  } catch (error) {
    console.error('Error importing purchases:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const exportPurchases = async () => {
  try {
    const headers = purchaseColumns.map(col => col.title);
    const data = purchases.value.map(purchase => [
      purchase.invoiceNumber || `Purchase #${purchase.id.slice(-6)}`,
      purchase.supplier?.name || 'Unknown Supplier',
      formatCurrency(purchase.totalAmount),
      purchase.status,
      formatDate(purchase.purchaseDate),
    ]);

    await ExportUtility.export({
      headers,
      data,
      format: 'csv',
      filename: 'purchases',
    });
  } catch (error) {
    console.error('Error exporting purchases:', error);
  }
};

onMounted(() => {
  loadPurchases();
  loadSuppliers();
});
</script>