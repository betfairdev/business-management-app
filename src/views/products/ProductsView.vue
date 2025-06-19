<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your product inventory
        </p>
      </div>
      
      <div class="mt-4 sm:mt-0 flex space-x-3">
        <BaseButton
          v-if="authStore.hasPermission('products', 'import')"
          variant="secondary"
          @click="showImportModal = true"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </template>
          Import
        </BaseButton>
        
        <BaseButton
          v-if="authStore.hasPermission('products', 'create')"
          @click="showCreateModal = true"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </template>
          Add Product
        </BaseButton>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="flex items-center space-x-4">
      <div class="flex rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          :class="[
            'px-3 py-2 text-sm font-medium rounded-l-lg',
            viewMode === 'grid'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="viewMode = 'grid'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </button>
        <button
          :class="[
            'px-3 py-2 text-sm font-medium rounded-r-lg',
            viewMode === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          ]"
          @click="viewMode = 'table'"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Grid View -->
    <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        :show-purchase-price="authStore.hasPermission('products', 'view-cost')"
        @click="handleProductClick"
        @edit="handleEditProduct"
        @view-stock="handleViewStock"
      />
    </div>

    <!-- Table View -->
    <ResponsiveDataTable
      v-else
      :data="products"
      :columns="tableColumns"
      :loading="isLoading"
      :selectable="authStore.hasPermission('products', 'delete')"
      :exportable="authStore.hasPermission('products', 'export')"
      :mobile-columns="['name', 'mrpPrice', 'status']"
      @row-click="handleProductClick"
      @selection-change="handleSelectionChange"
    >
      <template #actions>
        <BaseButton
          v-if="selectedProducts.length > 0 && authStore.hasPermission('products', 'delete')"
          variant="danger"
          size="sm"
          @click="handleBulkDelete"
        >
          Delete Selected ({{ selectedProducts.length }})
        </BaseButton>
      </template>

      <template #cell-images="{ value }">
        <div class="flex -space-x-2">
          <img
            v-for="(image, index) in (value || []).slice(0, 3)"
            :key="index"
            :src="image"
            :alt="`Product image ${index + 1}`"
            class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover"
          />
          <div
            v-if="(value || []).length > 3"
            class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300"
          >
            +{{ (value || []).length - 3 }}
          </div>
        </div>
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

      <template #row-actions="{ item }">
        <div class="flex space-x-2">
          <BaseButton
            v-if="authStore.hasPermission('products', 'update')"
            size="sm"
            variant="secondary"
            @click="handleEditProduct(item)"
          >
            Edit
          </BaseButton>
          <BaseButton
            size="sm"
            variant="info"
            @click="handleViewStock(item)"
          >
            Stock
          </BaseButton>
        </div>
      </template>
    </ResponsiveDataTable>

    <!-- Create/Edit Modal -->
    <BaseModal
      v-model="showCreateModal"
      :title="editingProduct ? 'Edit Product' : 'Create Product'"
      size="xl"
    >
      <FormBuilder
        :fields="productFields"
        :initial-data="editingProduct"
        :loading="isSubmitting"
        :submit-text="editingProduct ? 'Update Product' : 'Create Product'"
        show-cancel
        @submit="handleSubmitProduct"
        @cancel="handleCancelEdit"
      />
    </BaseModal>

    <!-- Import Modal -->
    <BaseModal v-model="showImportModal" title="Import Products" size="lg">
      <div class="space-y-4">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <p>Upload a CSV or Excel file with product data.</p>
          <p class="mt-2">Required columns: name, purchasePrice, mrpPrice</p>
        </div>
        
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          @change="handleFileUpload"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <template #footer>
        <BaseButton variant="secondary" @click="showImportModal = false">
          Cancel
        </BaseButton>
        <BaseButton :loading="isImporting" @click="handleImport">
          Import
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import ProductCard from '../../components/business/ProductCard.vue';
import ResponsiveDataTable from '../../components/layout/ResponsiveDataTable.vue';
import { BaseService } from '../../services/BaseService';
import { Product } from '../../entities/Product';
import { CreateProductDto } from '../../dtos/CreateProductDto';
import { UpdateProductDto } from '../../dtos/UpdateProductDto';
import type { TableColumn } from '../../components/common/DataTable.vue';

const authStore = useAuthStore();

// State
const products = ref<Product[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const isImporting = ref(false);
const viewMode = ref<'grid' | 'table'>('grid');
const showCreateModal = ref(false);
const showImportModal = ref(false);
const editingProduct = ref<Product | null>(null);
const selectedProducts = ref<string[]>([]);

// Services
const productService = new BaseService(Product, CreateProductDto, UpdateProductDto, ['name', 'sku', 'barcode', 'description']);

// Table columns
const tableColumns: TableColumn[] = [
  { key: 'images', title: 'Image', sortable: false },
  { key: 'name', title: 'Name', sortable: true },
  { key: 'sku', title: 'SKU', sortable: true },
  { key: 'brand.name', title: 'Brand', sortable: true },
  { key: 'category.name', title: 'Category', sortable: true },
  { key: 'purchasePrice', title: 'Cost', format: 'currency', sortable: true },
  { key: 'mrpPrice', title: 'MRP', format: 'currency', sortable: true },
  { key: 'status', title: 'Status', sortable: true },
];

// Form fields
const productFields: FormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Product Name',
    required: true,
    validation: { required: true, minLength: 2 },
  },
  {
    name: 'sku',
    type: 'text',
    label: 'SKU',
    hint: 'Stock Keeping Unit (optional)',
  },
  {
    name: 'barcode',
    type: 'text',
    label: 'Barcode',
    hint: 'Product barcode (optional)',
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    rows: 3,
  },
  {
    name: 'purchasePrice',
    type: 'number',
    label: 'Purchase Price',
    required: true,
    validation: { required: true, min: 0 },
  },
  {
    name: 'mrpPrice',
    type: 'number',
    label: 'MRP Price',
    required: true,
    validation: { required: true, min: 0 },
  },
  {
    name: 'wholesalePrice',
    type: 'number',
    label: 'Wholesale Price',
    validation: { min: 0 },
  },
  {
    name: 'dealerPrice',
    type: 'number',
    label: 'Dealer Price',
    validation: { min: 0 },
  },
  {
    name: 'unitType',
    type: 'select',
    label: 'Unit Type',
    required: true,
    options: [
      { label: 'Piece', value: 'Piece' },
      { label: 'Kg', value: 'Kg' },
      { label: 'Liter', value: 'Liter' },
      { label: 'Metre', value: 'Metre' },
    ],
    validation: { required: true },
  },
];

// Methods
const loadProducts = async () => {
  isLoading.value = true;
  try {
    const result = await productService.findAll({
      limit: 100,
    }, {
      relations: ['brand', 'category', 'subCategory', 'stockEntries'],
    });
    products.value = result.data;
  } catch (error) {
    console.error('Failed to load products:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleProductClick = (product: Product) => {
  // Navigate to product detail or open modal
  console.log('Product clicked:', product);
};

const handleEditProduct = (product: Product) => {
  editingProduct.value = product;
  showCreateModal.value = true;
};

const handleViewStock = (product: Product) => {
  // Navigate to stock view or open modal
  console.log('View stock for:', product);
};

const handleSubmitProduct = async (formData: Record<string, any>) => {
  isSubmitting.value = true;
  try {
    if (editingProduct.value) {
      await productService.update(editingProduct.value.id, formData);
    } else {
      await productService.create(formData);
    }
    
    showCreateModal.value = false;
    editingProduct.value = null;
    await loadProducts();
  } catch (error) {
    console.error('Failed to save product:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancelEdit = () => {
  showCreateModal.value = false;
  editingProduct.value = null;
};

const handleSelectionChange = (selected: string[]) => {
  selectedProducts.value = selected;
};

const handleBulkDelete = async () => {
  if (confirm(`Are you sure you want to delete ${selectedProducts.value.length} products?`)) {
    try {
      await productService.bulkDelete(selectedProducts.value);
      selectedProducts.value = [];
      await loadProducts();
    } catch (error) {
      console.error('Failed to delete products:', error);
    }
  }
};

const handleFileUpload = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    console.log('File selected:', file);
  }
};

const handleImport = async () => {
  isImporting.value = true;
  try {
    // Implement import logic here
    showImportModal.value = false;
    await loadProducts();
  } catch (error) {
    console.error('Failed to import products:', error);
  } finally {
    isImporting.value = false;
  }
};

// Initialize
onMounted(() => {
  loadProducts();
});
</script>