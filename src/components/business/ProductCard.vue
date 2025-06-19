<template>
  <BaseCard 
    :variant="variant" 
    :hoverable="hoverable"
    class="product-card"
    @click="handleClick"
  >
    <!-- Product Image -->
    <div class="relative aspect-square mb-4">
      <img
        v-if="product.images && product.images.length > 0"
        :src="product.images[0]"
        :alt="product.name"
        class="w-full h-full object-cover rounded-lg"
        @error="handleImageError"
      />
      <div
        v-else
        class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
      >
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      <!-- Status Badge -->
      <div class="absolute top-2 right-2">
        <span
          :class="statusBadgeClass"
          class="px-2 py-1 text-xs font-medium rounded-full"
        >
          {{ product.status }}
        </span>
      </div>

      <!-- Stock Badge -->
      <div v-if="showStock" class="absolute top-2 left-2">
        <span
          :class="stockBadgeClass"
          class="px-2 py-1 text-xs font-medium rounded-full"
        >
          {{ stockText }}
        </span>
      </div>
    </div>

    <!-- Product Info -->
    <div class="space-y-2">
      <!-- Name and SKU -->
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white truncate" :title="product.name">
          {{ product.name }}
        </h3>
        <p v-if="product.sku" class="text-sm text-gray-500 dark:text-gray-400">
          SKU: {{ product.sku }}
        </p>
      </div>

      <!-- Brand -->
      <p v-if="product.brand?.name" class="text-sm text-gray-600 dark:text-gray-300">
        {{ product.brand.name }}
      </p>

      <!-- Description -->
      <p v-if="showDescription && product.description" class="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
        {{ product.description }}
      </p>

      <!-- Pricing -->
      <div class="space-y-1">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500 dark:text-gray-400">MRP:</span>
          <span class="font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(product.mrpPrice) }}
          </span>
        </div>
        
        <div v-if="showPurchasePrice" class="flex items-center justify-between">
          <span class="text-sm text-gray-500 dark:text-gray-400">Cost:</span>
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ formatCurrency(product.purchasePrice) }}
          </span>
        </div>

        <div v-if="product.wholesalePrice" class="flex items-center justify-between">
          <span class="text-sm text-gray-500 dark:text-gray-400">Wholesale:</span>
          <span class="text-sm text-gray-600 dark:text-gray-300">
            {{ formatCurrency(product.wholesalePrice) }}
          </span>
        </div>
      </div>

      <!-- Category -->
      <div v-if="product.category || product.subCategory" class="flex flex-wrap gap-1">
        <span
          v-if="product.category"
          class="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
        >
          {{ product.category.name }}
        </span>
        <span
          v-if="product.subCategory"
          class="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded"
        >
          {{ product.subCategory.name }}
        </span>
      </div>

      <!-- Actions -->
      <div v-if="showActions" class="flex space-x-2 pt-2">
        <BaseButton
          size="sm"
          variant="primary"
          @click.stop="$emit('edit', product)"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </template>
          Edit
        </BaseButton>
        
        <BaseButton
          size="sm"
          variant="secondary"
          @click.stop="$emit('view-stock', product)"
        >
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </template>
          Stock
        </BaseButton>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import { FormatUtility } from '../../utils/formatUtility';
import type { Product } from '../../entities/Product';

export interface ProductCardProps {
  product: Product & {
    brand?: { name: string };
    category?: { name: string };
    subCategory?: { name: string };
    stockEntries?: Array<{ quantity: number }>;
  };
  variant?: 'default' | 'bordered' | 'elevated' | 'outlined';
  hoverable?: boolean;
  showDescription?: boolean;
  showPurchasePrice?: boolean;
  showStock?: boolean;
  showActions?: boolean;
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  variant: 'bordered',
  hoverable: true,
  showDescription: true,
  showPurchasePrice: false,
  showStock: true,
  showActions: true,
});

const emit = defineEmits<{
  click: [product: Product];
  edit: [product: Product];
  'view-stock': [product: Product];
}>();

const totalStock = computed(() => {
  if (!props.product.stockEntries) return 0;
  return props.product.stockEntries.reduce((total, stock) => total + stock.quantity, 0);
});

const statusBadgeClass = computed(() => {
  return props.product.status === 'Active'
    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
});

const stockBadgeClass = computed(() => {
  const stock = totalStock.value;
  if (stock === 0) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  } else if (stock < 10) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }
});

const stockText = computed(() => {
  const stock = totalStock.value;
  if (stock === 0) return 'Out of Stock';
  if (stock < 10) return 'Low Stock';
  return `${stock} in stock`;
});

const formatCurrency = (amount: number): string => {
  return FormatUtility.currency(amount);
};

const handleClick = () => {
  emit('click', props.product);
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
};
</script>

<style scoped>
.product-card {
  transition: transform 0.2s ease-in-out;
}

.product-card:hover {
  transform: translateY(-2px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>