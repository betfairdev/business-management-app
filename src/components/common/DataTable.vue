<template>
  <div class="space-y-4">
    <!-- Header with search and actions -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex-1 max-w-md">
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
      
      <div class="flex items-center gap-2">
        <slot name="actions" />
        
        <!-- Export button -->
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

    <!-- Table -->
    <div class="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              v-if="selectable"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              <input
                type="checkbox"
                :checked="isAllSelected"
                :indeterminate="isIndeterminate"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="getHeaderClass(column)"
              @click="handleSort(column)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.title }}</span>
                <div v-if="column.sortable" class="flex flex-col">
                  <svg
                    :class="getSortIconClass(column, 'asc')"
                    class="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </th>
            <th
              v-if="$slots.actions"
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="(item, index) in paginatedData"
            :key="getRowKey(item, index)"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td v-if="selectable" class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="selectedItems.includes(getRowKey(item, index))"
                @change="toggleSelectItem(getRowKey(item, index))"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              :class="getCellClass(column)"
            >
              <slot
                :name="`cell-${column.key}`"
                :item="item"
                :value="getNestedValue(item, column.key)"
                :index="index"
              >
                {{ formatCellValue(item, column) }}
              </slot>
            </td>
            <td v-if="$slots.actions" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <slot name="actions" :item="item" :index="index" />
            </td>
          </tr>
        </tbody>
      </table>

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
    </div>

    <!-- Pagination -->
    <div v-if="paginated && totalPages > 1" class="flex items-center justify-between">
      <div class="text-sm text-gray-700 dark:text-gray-300">
        Showing {{ startIndex + 1 }} to {{ endIndex }} of {{ filteredData.length }} results
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
import { computed, ref, watch } from 'vue';
import BaseInput from '../ui/BaseInput.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseModal from '../ui/BaseModal.vue';
import BaseSelect from '../ui/BaseSelect.vue';
import { ExportUtility, type ExportFormat } from '../../utils/exportUtility';
import { FormatUtility } from '../../utils/formatUtility';

export interface TableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  format?: 'currency' | 'date' | 'datetime' | 'number' | 'percentage';
  formatOptions?: any;
}

export interface TableProps {
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  rowKey?: string;
}

const props = withDefaults(defineProps<TableProps>(), {
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

// Search and filtering
const searchQuery = ref('');
const sortColumn = ref<string>('');
const sortDirection = ref<'asc' | 'desc'>('asc');

// Pagination
const currentPage = ref(1);

// Selection
const selectedItems = ref<string[]>([]);

// Export
const showExportModal = ref(false);
const exportFormat = ref<ExportFormat>('csv');
const includeHeaders = ref(true);

const exportFormats = [
  { label: 'CSV', value: 'csv' },
  { label: 'Excel', value: 'xlsx' },
  { label: 'JSON', value: 'json' },
  { label: 'PDF', value: 'pdf' },
];

// Computed properties
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

const sortedData = computed(() => {
  if (!sortColumn.value) return filteredData.value;
  
  return [...filteredData.value].sort((a, b) => {
    const aValue = getNestedValue(a, sortColumn.value);
    const bValue = getNestedValue(b, sortColumn.value);
    
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    
    return sortDirection.value === 'desc' ? -comparison : comparison;
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
  if (!props.paginated) return sortedData.value;
  return sortedData.value.slice(startIndex.value, endIndex.value);
});

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

const isAllSelected = computed(() => {
  return paginatedData.value.length > 0 && 
         paginatedData.value.every(item => 
           selectedItems.value.includes(getRowKey(item, 0))
         );
});

const isIndeterminate = computed(() => {
  const selectedCount = paginatedData.value.filter(item => 
    selectedItems.value.includes(getRowKey(item, 0))
  ).length;
  return selectedCount > 0 && selectedCount < paginatedData.value.length;
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

const handleSort = (column: TableColumn) => {
  if (!column.sortable) return;
  
  if (sortColumn.value === column.key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn.value = column.key;
    sortDirection.value = 'asc';
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // Deselect all visible items
    const visibleKeys = paginatedData.value.map((item, index) => getRowKey(item, index));
    selectedItems.value = selectedItems.value.filter(key => !visibleKeys.includes(key));
  } else {
    // Select all visible items
    const visibleKeys = paginatedData.value.map((item, index) => getRowKey(item, index));
    selectedItems.value = [...new Set([...selectedItems.value, ...visibleKeys])];
  }
};

const toggleSelectItem = (key: string) => {
  const index = selectedItems.value.indexOf(key);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(key);
  }
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

// CSS classes
const getHeaderClass = (column: TableColumn) => {
  const baseClass = 'px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider';
  const alignClass = column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left';
  const sortableClass = column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : '';
  
  return `${baseClass} ${alignClass} ${sortableClass}`;
};

const getCellClass = (column: TableColumn) => {
  const baseClass = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100';
  const alignClass = column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left';
  
  return `${baseClass} ${alignClass}`;
};

const getSortIconClass = (column: TableColumn, direction: 'asc' | 'desc') => {
  const isActive = sortColumn.value === column.key && sortDirection.value === direction;
  return isActive ? 'text-blue-600' : 'text-gray-400';
};

const getPageButtonClass = (page: number) => {
  const baseClass = 'px-3 py-1 text-sm border rounded';
  const activeClass = page === currentPage.value 
    ? 'bg-blue-600 text-white border-blue-600' 
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';
  
  return `${baseClass} ${activeClass}`;
};

// Watch for selection changes
watch(selectedItems, (newSelection) => {
  emit('selection-change', newSelection);
}, { deep: true });
</script>