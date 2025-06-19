<template>
  <div class="responsive-data-table">
    <!-- Desktop/Tablet View -->
    <div class="hidden md:block">
      <DataTable
        :data="data"
        :columns="columns"
        :loading="loading"
        :selectable="selectable"
        :exportable="exportable"
        :paginated="paginated"
        :page-size="pageSize"
        :empty-message="emptyMessage"
        :row-key="rowKey"
        @selection-change="$emit('selection-change', $event)"
        @row-click="$emit('row-click', $event)"
      >
        <template #actions>
          <slot name="actions" />
        </template>
        
        <template v-for="column in columns" :key="column.key" #[`cell-${column.key}`]="{ item, value, index }">
          <slot :name="`cell-${column.key}`" :item="item" :value="value" :index="index">
            {{ value }}
          </slot>
        </template>
        
        <template #actions="{ item, index }">
          <slot name="row-actions" :item="item" :index="index" />
        </template>
      </DataTable>
    </div>

    <!-- Mobile View -->
    <div class="md:hidden">
      <!-- Search and Actions -->
      <div class="flex flex-col space-y-4 mb-4">
        <div class="flex-1">
          <BaseInput
            v-model="searchQuery"
            placeholder="Search..."
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
        
        <div class="flex justify-between items-center">
          <slot name="actions" />
          
          <BaseButton
            v-if="exportable"
            variant="secondary"
            size="sm"
            @click="showExportModal = true"
          >
            <template #icon-left>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </template>
            Export
          </BaseButton>
        </div>
      </div>

      <!-- Mobile Cards -->
      <div class="space-y-3">
        <div
          v-for="(item, index) in paginatedData"
          :key="getRowKey(item, index)"
          class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4"
          @click="$emit('row-click', item, index)"
        >
          <!-- Selection checkbox -->
          <div v-if="selectable" class="flex items-center mb-3">
            <input
              type="checkbox"
              :checked="selectedItems.includes(getRowKey(item, index))"
              @change="toggleSelectItem(getRowKey(item, index))"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Select</span>
          </div>

          <!-- Card content -->
          <div class="space-y-2">
            <div
              v-for="column in visibleColumns"
              :key="column.key"
              class="flex justify-between items-start"
            >
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-0 flex-shrink-0 mr-3">
                {{ column.title }}:
              </span>
              <span class="text-sm text-gray-900 dark:text-gray-100 text-right min-w-0 flex-1">
                <slot :name="`cell-${column.key}`" :item="item" :value="getNestedValue(item, column.key)" :index="index">
                  {{ formatCellValue(item, column) }}
                </slot>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div v-if="$slots['row-actions']" class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <slot name="row-actions" :item="item" :index="index" />
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="paginatedData.length === 0" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No data</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ emptyMessage || 'No items to display.' }}
        </p>
      </div>

      <!-- Mobile Pagination -->
      <div v-if="paginated && totalPages > 1" class="mt-6">
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-gray-700 dark:text-gray-300">
            {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredData.length }}
          </div>
          <div class="text-sm text-gray-700 dark:text-gray-300">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
        </div>
        
        <div class="flex justify-center space-x-2">
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </BaseButton>
          
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
    </div>

    <!-- Export Modal -->
    <BaseModal v-model="showExportModal" title="Export Data" size="md">
      <div class="space-y-4">
        <BaseSelect
          v-model="exportFormat"
          label="Export Format"
          :options="exportFormats"
        />
        
        <div class="flex items-center space-x-2">
          <input
            id="includeHeaders"
            v-model="includeHeaders"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label for="includeHeaders" class="text-sm text-gray-700 dark:text-gray-300">
            Include headers
          </label>
        </div>
      </div>
      
      <template #footer>
        <BaseButton variant="secondary" @click="showExportModal = false">
          Cancel
        </BaseButton>
        <BaseButton @click="handleExport">
          Export
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DataTable, { type TableColumn, type TableProps } from '../common/DataTable.vue';
import BaseInput from '../ui/BaseInput.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseModal from '../ui/BaseModal.vue';
import BaseSelect from '../ui/BaseSelect.vue';
import { ExportUtility, type ExportFormat } from '../../utils/exportUtility';
import { FormatUtility } from '../../utils/formatUtility';

interface ResponsiveTableProps extends TableProps {
  mobileColumns?: string[]; // Column keys to show on mobile
}

const props = withDefaults(defineProps<ResponsiveTableProps>(), {
  loading: false,
  selectable: false,
  exportable: false,
  paginated: true,
  pageSize: 10,
  rowKey: 'id',
});

const emit = defineEmits<{
  'selection-change': [selectedItems: string[]];
  'row-click': [item: any, index: number];
}>();

// Mobile-specific state
const searchQuery = ref('');
const selectedItems = ref<string[]>([]);
const currentPage = ref(1);

// Export state
const showExportModal = ref(false);
const exportFormat = ref<ExportFormat>('csv');
const includeHeaders = ref(true);

const exportFormats = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'xlsx' },
  { label: 'JSON', value: 'json' },
  { label: 'PDF', value: 'pdf' },
];

// Computed properties for mobile view
const visibleColumns = computed(() => {
  if (props.mobileColumns) {
    return props.columns.filter(col => props.mobileColumns!.includes(col.key));
  }
  // Show first 4 columns by default on mobile
  return props.columns.slice(0, 4);
});

const filteredData = computed(() => {
  if (!searchQuery.value) return props.data;
  
  const query = searchQuery.value.toLowerCase();
  return props.data.filter(item => {
    return props.columns.some(column => {
      const value = getNestedValue(item, column.key);
      return String(value).toLowerCase().includes(query);
    });
  });
});

const totalPages = computed(() => {
  if (!props.paginated) return 1;
  return Math.ceil(filteredData.value.length / props.pageSize);
});

const startIndex = computed(() => {
  if (!props.paginated) return 0;
  return (currentPage.value - 1) * props.pageSize;
});

const endIndex = computed(() => {
  if (!props.paginated) return filteredData.value.length;
  return Math.min(startIndex.value + props.pageSize, filteredData.value.length);
});

const paginatedData = computed(() => {
  if (!props.paginated) return filteredData.value;
  return filteredData.value.slice(startIndex.value, endIndex.value);
});

// Methods
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const getRowKey = (item: any, index: number): string => {
  return getNestedValue(item, props.rowKey) || index.toString();
};

const formatCellValue = (item: any, column: TableColumn): string => {
  const value = getNestedValue(item, column.key);
  
  if (value == null) return '';
  
  switch (column.format) {
    case 'currency':
      return FormatUtility.currency(Number(value), column.formatOptions?.currency);
    case 'date':
      return FormatUtility.date(value, column.formatOptions?.format);
    case 'datetime':
      return FormatUtility.dateTime(value, column.formatOptions);
    case 'number':
      return FormatUtility.number(Number(value), column.formatOptions);
    case 'percentage':
      return FormatUtility.percentage(Number(value), column.formatOptions?.decimals);
    default:
      return String(value);
  }
};

const handleSearch = () => {
  currentPage.value = 1;
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const toggleSelectItem = (key: string) => {
  const index = selectedItems.value.indexOf(key);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(key);
  }
  emit('selection-change', selectedItems.value);
};

const handleExport = async () => {
  const headers = includeHeaders.value ? props.columns.map(col => col.title) : undefined;
  const data = filteredData.value.map(item => 
    props.columns.map(column => formatCellValue(item, column))
  );
  
  await ExportUtility.export({
    headers,
    data,
    format: exportFormat.value,
    filename: 'table-export',
  });
  
  showExportModal.value = false;
};
</script>

<style scoped>
.responsive-data-table {
  @apply w-full;
}

@media (max-width: 768px) {
  .responsive-data-table {
    @apply space-y-4;
  }
}
</style>