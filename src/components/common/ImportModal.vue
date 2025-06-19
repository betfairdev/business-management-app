<template>
  <div class="space-y-6">
    <!-- Upload Section -->
    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
      <div class="text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <div class="mt-4">
          <label for="file-upload" class="cursor-pointer">
            <span class="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
              Drop files here or click to upload
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              class="sr-only"
              @change="handleFileUpload"
            />
          </label>
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            CSV, XLSX files up to 10MB
          </p>
        </div>
      </div>
    </div>

    <!-- Template Download -->
    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">
            Need a template?
          </h3>
          <div class="mt-2 text-sm text-blue-700 dark:text-blue-300">
            <p>Download our template to ensure your data is formatted correctly.</p>
          </div>
          <div class="mt-4">
            <BaseButton size="sm" variant="secondary" @click="downloadTemplate">
              <template #icon-left>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </template>
              Download Template
            </BaseButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Section -->
    <div v-if="previewData.length > 0" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Preview Data ({{ previewData.length }} rows)
        </h3>
        <BaseButton size="sm" variant="secondary" @click="clearPreview">
          Clear
        </BaseButton>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                v-for="header in headers"
                :key="header"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(row, index) in previewData.slice(0, 5)" :key="index">
              <td
                v-for="(cell, cellIndex) in row"
                :key="cellIndex"
                class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="previewData.length > 5" class="text-sm text-gray-500 dark:text-gray-400 text-center">
        ... and {{ previewData.length - 5 }} more rows
      </div>
    </div>

    <!-- Progress -->
    <div v-if="isProcessing" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-700 dark:text-gray-300">Processing...</span>
        <span class="text-gray-500 dark:text-gray-400">{{ progress }}%</span>
      </div>
      <BaseProgress :value="progress" variant="primary" />
    </div>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
            Validation Errors
          </h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-300">
            <ul class="list-disc list-inside space-y-1">
              <li v-for="error in validationErrors.slice(0, 10)" :key="error">
                {{ error }}
              </li>
            </ul>
            <p v-if="validationErrors.length > 10" class="mt-2 text-xs">
              ... and {{ validationErrors.length - 10 }} more errors
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <BaseButton variant="secondary" @click="$emit('close')">
        Cancel
      </BaseButton>
      <BaseButton
        :disabled="previewData.length === 0 || validationErrors.length > 0 || isProcessing"
        :loading="isProcessing"
        @click="handleImport"
      >
        Import {{ previewData.length }} Records
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseProgress from '../ui/BaseProgress.vue';
import { ExportUtility } from '../../utils/exportUtility';
import * as XLSX from 'xlsx';

export interface ImportModalProps {
  entityType: string;
  templateHeaders: string[];
}

const props = defineProps<ImportModalProps>();

const emit = defineEmits<{
  import: [data: any[]];
  close: [];
}>();

// State
const previewData = ref<any[][]>([]);
const headers = ref<string[]>([]);
const validationErrors = ref<string[]>([]);
const isProcessing = ref(false);
const progress = ref(0);

// Methods
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;

  try {
    isProcessing.value = true;
    progress.value = 0;

    const data = await readFile(file);
    parseData(data);
    validateData();
  } catch (error) {
    console.error('Error reading file:', error);
    validationErrors.value = ['Error reading file. Please check the file format.'];
  } finally {
    isProcessing.value = false;
    progress.value = 100;
  }
};

const readFile = (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let parsedData: any[][] = [];

        if (file.name.endsWith('.csv')) {
          // Parse CSV
          const text = data as string;
          const lines = text.split('\n');
          parsedData = lines.map(line => line.split(',').map(cell => cell.trim()));
        } else {
          // Parse Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        }

        resolve(parsedData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
};

const parseData = (data: any[][]) => {
  if (data.length === 0) {
    validationErrors.value = ['File is empty'];
    return;
  }

  headers.value = data[0].map(header => String(header).trim());
  previewData.value = data.slice(1).filter(row => row.some(cell => cell !== ''));
};

const validateData = () => {
  validationErrors.value = [];

  // Check if headers match template
  const missingHeaders = props.templateHeaders.filter(
    header => !headers.value.includes(header)
  );

  if (missingHeaders.length > 0) {
    validationErrors.value.push(
      `Missing required headers: ${missingHeaders.join(', ')}`
    );
  }

  // Validate each row
  previewData.value.forEach((row, index) => {
    if (row.length !== headers.value.length) {
      validationErrors.value.push(
        `Row ${index + 2}: Column count mismatch`
      );
    }

    // Check for required fields (assuming first column is always required)
    if (!row[0] || String(row[0]).trim() === '') {
      validationErrors.value.push(
        `Row ${index + 2}: Missing required field in first column`
      );
    }
  });
};

const downloadTemplate = async () => {
  const headers = props.templateHeaders;
  const sampleData = [
    headers.map(header => `Sample ${header}`),
  ];

  await ExportUtility.export({
    headers,
    data: sampleData,
    format: 'csv',
    filename: `${props.entityType}-template`,
  });
};

const clearPreview = () => {
  previewData.value = [];
  headers.value = [];
  validationErrors.value = [];
  progress.value = 0;
};

const handleImport = async () => {
  if (previewData.value.length === 0 || validationErrors.value.length > 0) {
    return;
  }

  try {
    isProcessing.value = true;
    progress.value = 0;

    // Convert array data to objects
    const importData = previewData.value.map(row => {
      const obj: any = {};
      headers.value.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      progress.value = i;
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    emit('import', importData);
  } catch (error) {
    console.error('Error importing data:', error);
    validationErrors.value = ['Error importing data. Please try again.'];
  } finally {
    isProcessing.value = false;
  }
};
</script>