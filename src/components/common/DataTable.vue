<template>
  <div class="data-table">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center space-x-4">
        <h2 v-if="title" class="text-xl font-semibold text-gray-900">{{ title }}</h2>
        <div class="flex items-center space-x-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search..."
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="handleSearch"
          />
          <button
            @click="showFilters = !showFilters"
            class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <i class="fas fa-filter"></i>
            Filters
          </button>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <button
          v-if="allowExport"
          @click="showExportModal = true"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <i class="fas fa-download mr-2"></i>
          Export
        </button>
        <button
          v-if="allowImport"
          @click="showImportModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <i class="fas fa-upload mr-2"></i>
          Import
        </button>
        <button
          v-if="allowCreate"
          @click="$emit('create')"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <i class="fas fa-plus mr-2"></i>
          Add New
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div v-if="showFilters" class="mb-4 p-4 bg-gray-50 rounded-lg">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="filter in filters" :key="filter.key" class="flex flex-col">
          <label class="text-sm font-medium text-gray-700 mb-1">{{ filter.label }}</label>
          <select
            v-if="filter.type === 'select'"
            v-model="activeFilters[filter.key]"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="applyFilters"
          >
            <option value="">All</option>
            <option v-for="option in filter.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <input
            v-else-if="filter.type === 'date'"
            v-model="activeFilters[filter.key]"
            type="date"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="applyFilters"
          />
          <input
            v-else
            v-model="activeFilters[filter.key]"
            :type="filter.type || 'text'"
            class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="applyFilters"
          />
        </div>
      </div>
      <div class="mt-4 flex justify-end">
        <button
          @click="clearFilters"
          class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Table -->
    <div v-else class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-if="selectable"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              @click="sort(column.key)"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <i
                  v-if="sortBy === column.key"
                  :class="sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down'"
                  class="text-gray-400"
                ></i>
                <i v-else class="fas fa-sort text-gray-300"></i>
              </div>
            </th>
            <th
              v-if="actions.length > 0"
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="(item, index) in paginatedData"
            :key="getItemId(item, index)"
            class="hover:bg-gray-50 transition-colors"
          >
            <td v-if="selectable" class="px-6 py-4 whitespace-nowrap">
              <input
                type="checkbox"
                :checked="selectedItems.includes(getItemId(item, index))"
                @change="toggleSelect(getItemId(item, index))"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </td>
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-6 py-4 whitespace-nowrap"
            >
              <div v-if="column.type === 'currency'" class="text-sm text-gray-900">
                {{ formatCurrency(getNestedValue(item, column.key)) }}
              </div>
              <div v-else-if="column.type === 'date'" class="text-sm text-gray-900">
                {{ formatDate(getNestedValue(item, column.key)) }}
              </div>
              <div v-else-if="column.type === 'status'" class="text-sm">
                <span
                  :class="getStatusClass(getNestedValue(item, column.key))"
                  class="px-2 py-1 rounded-full text-xs font-medium"
                >
                  {{ getNestedValue(item, column.key) }}
                </span>
              </div>
              <div v-else-if="column.type === 'image'" class="text-sm text-gray-900">
                <img
                  :src="getNestedValue(item, column.key)"
                  :alt="column.label"
                  class="h-8 w-8 rounded-full object-cover"
                />
              </div>
              <div v-else class="text-sm text-gray-900">
                {{ getNestedValue(item, column.key) }}
              </div>
            </td>
            <td v-if="actions.length > 0" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div class="flex justify-end space-x-2">
                <button
                  v-for="action in actions"
                  :key="action.key"
                  @click="$emit('action', { action: action.key, item })"
                  :class="action.class || 'text-blue-600 hover:text-blue-900'"
                  class="transition-colors"
                  :title="action.label"
                >
                  <i :class="action.icon"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && totalPages > 1" class="mt-4 flex items-center justify-between">
      <div class="text-sm text-gray-700">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalItems) }} of {{ totalItems }} results
      </div>
      <div class="flex items-center space-x-2">
        <button
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          class="px-3 py-2 rounded-md transition-colors"
        >
          {{ page }}
        </button>
        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>

    <!-- Export Modal -->
    <ExportModal
      v-if="showExportModal"
      :entity="entity"
      :columns="columns"
      :filters="activeFilters"
      @close="showExportModal = false"
      @export="handleExport"
    />

    <!-- Import Modal -->
    <ImportModal
      v-if="showImportModal"
      :entity="entity"
      @close="showImportModal = false"
      @import="handleImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { DateTimeUtil } from '../../utils/dateTime';
import ExportModal from './ExportModal.vue';
import ImportModal from './ImportModal.vue';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'currency' | 'date' | 'status' | 'image';
  sortable?: boolean;
}

interface Filter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'number';
  options?: Array<{ value: string; label: string }>;
}

interface Action {
  key: string;
  label: string;
  icon: string;
  class?: string;
}

const props = defineProps<{
  title?: string;
  data: any[];
  columns: Column[];
  filters?: Filter[];
  actions?: Action[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  selectable?: boolean;
  allowExport?: boolean;
  allowImport?: boolean;
  allowCreate?: boolean;
  entity?: string;
}>();

const emit = defineEmits<{
  search: [query: string];
  filter: [filters: Record<string, any>];
  sort: [sortBy: string, sortOrder: 'asc' | 'desc'];
  page: [page: number];
  action: [data: { action: string; item: any }];
  create: [];
  export: [data: any];
  import: [data: any];
}>();

// Reactive data
const searchQuery = ref('');
const showFilters = ref(false);
const activeFilters = ref<Record<string, any>>({});
const sortBy = ref('');
const sortOrder = ref<'asc' | 'desc'>('asc');
const currentPage = ref(1);
const selectedItems = ref<string[]>([]);
const showExportModal = ref(false);
const showImportModal = ref(false);

// Computed properties
const filteredData = computed(() => {
  let result = [...props.data];

  // Apply search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item =>
      props.columns.some(column =>
        String(getNestedValue(item, column.key)).toLowerCase().includes(query)
      )
    );
  }

  // Apply filters
  Object.entries(activeFilters.value).forEach(([key, value]) => {
    if (value) {
      result = result.filter(item => {
        const itemValue = getNestedValue(item, key);
        return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
      });
    }
  });

  // Apply sorting
  if (sortBy.value) {
    result.sort((a, b) => {
      const aValue = getNestedValue(a, sortBy.value);
      const bValue = getNestedValue(b, sortBy.value);
      
      if (aValue < bValue) return sortOrder.value === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder.value === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return result;
});

const totalItems = computed(() => filteredData.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / (props.pageSize || 10)));

const paginatedData = computed(() => {
  if (!props.pagination) return filteredData.value;
  
  const start = (currentPage.value - 1) * (props.pageSize || 10);
  const end = start + (props.pageSize || 10);
  return filteredData.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisible = 5;
  const start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
  const end = Math.min(totalPages.value, start + maxVisible - 1);
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  return pages;
});

const allSelected = computed(() => {
  return paginatedData.value.length > 0 && 
    paginatedData.value.every((item, index) => 
      selectedItems.value.includes(getItemId(item, index))
    );
});

// Methods
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const getItemId = (item: any, index: number) => {
  return item.id || item._id || index.toString();
};

const handleSearch = () => {
  emit('search', searchQuery.value);
  currentPage.value = 1;
};

const applyFilters = () => {
  emit('filter', activeFilters.value);
  currentPage.value = 1;
};

const clearFilters = () => {
  activeFilters.value = {};
  applyFilters();
};

const sort = (column: string) => {
  if (sortBy.value === column) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortBy.value = column;
    sortOrder.value = 'asc';
  }
  emit('sort', sortBy.value, sortOrder.value);
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
    emit('page', page);
  }
};

const toggleSelect = (id: string) => {
  const index = selectedItems.value.indexOf(id);
  if (index > -1) {
    selectedItems.value.splice(index, 1);
  } else {
    selectedItems.value.push(id);
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedItems.value = [];
  } else {
    selectedItems.value = paginatedData.value.map((item, index) => getItemId(item, index));
  }
};

const formatCurrency = (value: any) => {
  if (value == null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(Number(value));
};

const formatDate = (value: any) => {
  if (!value) return '';
  return DateTimeUtil.format(value, 'MMM dd, yyyy');
};

const getStatusClass = (status: string) => {
  const statusClasses: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };
  return statusClasses[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

const handleExport = (exportData: any) => {
  emit('export', exportData);
  showExportModal.value = false;
};

const handleImport = (importData: any) => {
  emit('import', importData);
  showImportModal.value = false;
};

// Initialize filters
onMounted(() => {
  if (props.filters) {
    props.filters.forEach(filter => {
      activeFilters.value[filter.key] = '';
    });
  }
});
</script>