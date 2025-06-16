<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Export Data</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleExport">
        <!-- Format Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
          <select
            v-model="exportOptions.format"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="csv">CSV</option>
            <option value="excel">Excel</option>
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <!-- Column Selection -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Columns to Export</label>
          <div class="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
            <div class="flex items-center mb-2">
              <input
                type="checkbox"
                :checked="allColumnsSelected"
                @change="toggleAllColumns"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <label class="text-sm font-medium text-gray-700">Select All</label>
            </div>
            <div v-for="column in columns" :key="column.key" class="flex items-center mb-1">
              <input
                type="checkbox"
                :value="column.key"
                v-model="exportOptions.columns"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              <label class="text-sm text-gray-700">{{ column.label }}</label>
            </div>
          </div>
        </div>

        <!-- Options -->
        <div class="mb-4">
          <div class="flex items-center mb-2">
            <input
              type="checkbox"
              v-model="exportOptions.includeHeaders"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <label class="text-sm text-gray-700">Include Headers</label>
          </div>
        </div>

        <!-- Date Format -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <select
            v-model="exportOptions.dateFormat"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MMM dd, yyyy">MMM DD, YYYY</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="exportOptions.columns.length === 0"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

interface Column {
  key: string;
  label: string;
}

const props = defineProps<{
  entity?: string;
  columns: Column[];
  filters?: Record<string, any>;
}>();

const emit = defineEmits<{
  close: [];
  export: [data: any];
}>();

const exportOptions = ref({
  format: 'csv',
  columns: [] as string[],
  includeHeaders: true,
  dateFormat: 'yyyy-MM-dd',
  filters: props.filters || {},
});

const allColumnsSelected = computed(() => {
  return exportOptions.value.columns.length === props.columns.length;
});

const toggleAllColumns = () => {
  if (allColumnsSelected.value) {
    exportOptions.value.columns = [];
  } else {
    exportOptions.value.columns = props.columns.map(col => col.key);
  }
};

const handleExport = () => {
  emit('export', exportOptions.value);
};

onMounted(() => {
  // Select all columns by default
  exportOptions.value.columns = props.columns.map(col => col.key);
});
</script>