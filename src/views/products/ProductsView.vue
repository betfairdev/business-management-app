<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your product inventory and catalog
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
        <BaseButton @click="showProductModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          Add Product
        </BaseButton>
      </div>
    </div>

    <!-- Filters -->
    <BaseCard variant="bordered" padding="lg">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BaseSelect
          v-model="filters.category"
          label="Category"
          :options="categoryOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.brand"
          label="Brand"
          :options="brandOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.status"
          label="Status"
          :options="statusOptions"
          @change="applyFilters"
        />
        <BaseSelect
          v-model="filters.stockStatus"
          label="Stock Status"
          :options="stockStatusOptions"
          @change="applyFilters"
        />
      </div>
    </BaseCard>

    <!-- Products Grid/Table -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        @click="viewProduct"
        @edit="editProduct"
        @view-stock="viewProductStock"
      />
    </div>

    <!-- Empty State -->
    <div v-if="products.length === 0 && !isLoading" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No products</h3>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new product.</p>
      <div class="mt-6">
        <BaseButton @click="showProductModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          Add Product
        </BaseButton>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ totalItems }} results
      </div>
      
      <div class="flex items-center space-x-2">
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          Previous
        </BaseButton>
        
        <div class="flex space-x-1">
          <button
            v-for="page in visiblePages"
            :key="page"
            :class="getPageButtonClass(page)"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          Next
        </BaseButton>
      </div>
    </div>

    <!-- Product Modal -->
    <BaseModal v-model="showProductModal" :title="editingProduct ? 'Edit Product' : 'Add Product'" size="2xl">
      <FormBuilder
        :fields="productFields"
        :initial-data="editingProduct"
        :loading="isSubmitting"
        :submit-text="editingProduct ? 'Update Product' : 'Create Product'"
        show-cancel
        @submit="handleProductSubmit"
        @cancel="closeProductModal"
      />
    </BaseModal>

    <!-- Import Modal -->
    <BaseModal v-model="showImportModal" title="Import Products" size="lg">
      <ImportModal
        entity-type="products"
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
import BaseModal from '../../components/ui/BaseModal.vue';
import ProductCard from '../../components/business/ProductCard.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import ImportModal from '../../components/common/ImportModal.vue';
import { ProductService } from '../../services/ProductService';
import { BrandService } from '../../services/BrandService';
import { CategoryService } from '../../services/CategoryService';
import type { Product } from '../../entities/Product';
import type { CreateProductDto } from '../../dtos/CreateProductDto';

const router = useRouter();

// Services
const productService = new ProductService();
const brandService = new BrandService();
const categoryService = new CategoryService();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);
const products = ref<Product[]>([]);
const brands = ref<any[]>([]);
const categories = ref<any[]>([]);

// Modal state
const showProductModal = ref(false);
const showImportModal = ref(false);
const editingProduct = ref<Product | null>(null);

// Pagination
const currentPage = ref(1);
const pageSize = ref(12);
const totalItems = ref(0);
const totalPages = ref(0);

// Filters
const filters = ref({
  category: '',
  brand: '',
  status: '',
  stockStatus: '',
});

// Computed
const startIndex = computed(() => (currentPage.value - 1) * pageSize.value);
const endIndex = computed(() => Math.min(startIndex.value + pageSize.value, totalItems.value));

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

// Options
const categoryOptions = computed(() => [
  { label: 'All Categories', value: '' },
  ...categories.value.map(cat => ({ label: cat.name, value: cat.id }))
]);

const brandOptions = computed(() => [
  { label: 'All Brands', value: '' },
  ...brands.value.map(brand => ({ label: brand.name, value: brand.id }))
]);

const statusOptions = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const stockStatusOptions = [
  { label: 'All Stock', value: '' },
  { label: 'In Stock', value: 'in-stock' },
  { label: 'Low Stock', value: 'low-stock' },
  { label: 'Out of Stock', value: 'out-of-stock' },
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
    name: 'brand',
    type: 'select',
    label: 'Brand',
    options: brandOptions.value,
  },
  {
    name: 'category',
    type: 'select',
    label: 'Category',
    options: categoryOptions.value,
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
  },
  {
    name: 'dealerPrice',
    type: 'number',
    label: 'Dealer Price',
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
  },
];

const importHeaders = [
  'name', 'sku', 'barcode', 'description', 'purchasePrice', 'mrpPrice', 
  'wholesalePrice', 'dealerPrice', 'unitType', 'brand', 'category'
];

// Methods
const loadProducts = async () => {
  try {
    isLoading.value = true;
    const result = await productService.findAll({
      page: currentPage.value,
      limit: pageSize.value,
    });
    
    products.value = result.data;
    totalItems.value = result.total;
    totalPages.value = result.totalPages;
  } catch (error) {
    console.error('Error loading products:', error);
  } finally {
    isLoading.value = false;
  }
};

const loadBrands = async () => {
  try {
    const result = await brandService.findAll({ limit: 100 });
    brands.value = result.data;
  } catch (error) {
    console.error('Error loading brands:', error);
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

const applyFilters = () => {
  currentPage.value = 1;
  loadProducts();
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    loadProducts();
  }
};

const getPageButtonClass = (page: number) => {
  const baseClass = 'px-3 py-1 text-sm border rounded';
  const activeClass = page === currentPage.value 
    ? 'bg-blue-600 text-white border-blue-600' 
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700';
  
  return `${baseClass} ${activeClass}`;
};

const viewProduct = (product: Product) => {
  router.push(`/products/${product.id}`);
};

const editProduct = (product: Product) => {
  editingProduct.value = product;
  showProductModal.value = true;
};

const viewProductStock = (product: Product) => {
  router.push(`/inventory?product=${product.id}`);
};

const handleProductSubmit = async (formData: any) => {
  try {
    isSubmitting.value = true;
    
    const productData: CreateProductDto = {
      ...formData,
      purchasePrice: Number(formData.purchasePrice),
      mrpPrice: Number(formData.mrpPrice),
      wholesalePrice: formData.wholesalePrice ? Number(formData.wholesalePrice) : undefined,
      dealerPrice: formData.dealerPrice ? Number(formData.dealerPrice) : undefined,
    };

    if (editingProduct.value) {
      await productService.update(editingProduct.value.id, productData);
    } else {
      await productService.create(productData);
    }

    closeProductModal();
    loadProducts();
  } catch (error) {
    console.error('Error saving product:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const closeProductModal = () => {
  showProductModal.value = false;
  editingProduct.value = null;
};

const handleImport = async (data: any[]) => {
  try {
    isSubmitting.value = true;
    
    for (const item of data) {
      const productData: CreateProductDto = {
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        description: item.description,
        purchasePrice: Number(item.purchasePrice),
        mrpPrice: Number(item.mrpPrice),
        wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice) : undefined,
        dealerPrice: item.dealerPrice ? Number(item.dealerPrice) : undefined,
        unitType: item.unitType || 'Piece',
      };
      
      await productService.create(productData);
    }
    
    showImportModal.value = false;
    loadProducts();
  } catch (error) {
    console.error('Error importing products:', error);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadProducts();
  loadBrands();
  loadCategories();
});
</script>