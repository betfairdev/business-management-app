<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-lg">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">Import Data</h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div v-if="step === 1">
        <!-- File Upload -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Select File</label>
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              @change="handleFileSelect"
              class="hidden"
            />
            <div v-if="!selectedFile">
              <i class="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
              <p class="text-gray-600 mb-2">Drag and drop your file here, or</p>
              <button
                type="button"
                @click="$refs.fileInput.click()"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Browse Files
              </button>
              <p class="text-xs text-gray-500 mt-2">Supported formats: CSV, Excel</p>
            </div>
            <div v-else class="text-green-600">
              <i class="fas fa-file-check text-3xl mb-2"></i>
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p class="text-sm">{{ formatFileSize(selectedFile.size) }}</p>
              <button
                type="button"
                @click="selectedFile = null"
                class="mt-2 text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Import Options -->
        <div class="mb-4">
          <div class="flex items-center mb-2">
            <input
              type="checkbox"
              v-model="importOptions.skipFirstRow"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <label class="text-sm text-gray-700">Skip first row (headers)</label>
          </div>
        </div>

        <!-- Date Format -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <select
            v-model="importOptions.dateFormat"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MMM dd, yyyy">MMM DD, YYYY</option>
          </select>
        </div>

        <!-- Actions -->
        <div class="flex justify-between">
          <button
            type="button"
            @click="downloadTemplate"
            class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            <i class="fas fa-download mr-2"></i>
            Download Template
          </button>
          <div class="space-x-3">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="validateFile"
              :disabled="!selectedFile"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Validate
            </button>
          </div>
        </div>
      </div>

      <div v-else-if="step === 2">
        <!-- Validation Results -->
        <div class="mb-4">
          <h4 class="text-md font-medium text-gray-900 mb-2">Validation Results</h4>
          
          <div v-if="validationResult" class="space-y-3">
            <!-- Summary -->
            <div class="bg-gray-50 p-3 rounded-md">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="font-medium">Total Rows:</span>
                  {{ validationResult.totalRows }}
                </div>
                <div>
                  <span class="font-medium">Valid Rows:</span>
                  <span class="text-green-600">{{ validationResult.successfulRows }}</span>
                </div>
                <div>
                  <span class="font-medium">Invalid Rows:</span>
                  <span class="text-red-600">{{ validationResult.failedRows }}</span>
                </div>
                <div>
                  <span class="font-medium">Warnings:</span>
                  <span class="text-yellow-600">{{ validationResult.warnings.length }}</span>
                </div>
              </div>
            </div>

            <!-- Errors -->
            <div v-if="validationResult.errors.length > 0" class="max-h-40 overflow-y-auto">
              <h5 class="text-sm font-medium text-red-600 mb-2">Errors:</h5>
              <div class="space-y-1">
                <div
                  v-for="error in validationResult.errors.slice(0, 10)"
                  :key="`error-${error.row}-${error.field}`"
                  class="text-xs bg-red-50 p-2 rounded border-l-2 border-red-400"
                >
                  <span class="font-medium">Row {{ error.row }}, {{ error.field }}:</span>
                  {{ error.message }}
                </div>
                <div v-if="validationResult.errors.length > 10" class="text-xs text-gray-500">
                  ... and {{ validationResult.errors.length - 10 }} more errors
                </div>
              </div>
            </div>

            <!-- Warnings -->
            <div v-if="validationResult.warnings.length > 0" class="max-h-40 overflow-y-auto">
              <h5 class="text-sm font-medium text-yellow-600 mb-2">Warnings:</h5>
              <div class="space-y-1">
                <div
                  v-for="warning in validationResult.warnings.slice(0, 5)"
                  :key="`warning-${warning.row}-${warning.field}`"
                  class="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400"
                >
                  <span class="font-medium">Row {{ warning.row }}, {{ warning.field }}:</span>
                  {{ warning.message }}
                </div>
                <div v-if="validationResult.warnings.length > 5" class="text-xs text-gray-500">
                  ... and {{ validationResult.warnings.length - 5 }} more warnings
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="step = 1"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            @click="handleImport"
            :disabled="validationResult?.failedRows > 0"
            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import Data
          </button>
        </div>
      </div>

      <div v-else-if="step === 3">
        <!-- Import Progress -->
        <div class="mb-4">
          <h4 class="text-md font-medium text-gray-900 mb-2">Importing Data...</h4>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-blue-600 h-2 rounded-full transition-all duration-300"
              :style="{ width: `${importProgress}%` }"
            ></div>
          </div>
          <p class="text-sm text-gray-600 mt-2">{{ importProgress }}% complete</p>
        </div>
      </div>

      <div v-else-if="step === 4">
        <!-- Import Complete -->
        <div class="text-center">
          <div v-if="importResult?.success" class="text-green-600">
            <i class="fas fa-check-circle text-4xl mb-4"></i>
            <h4 class="text-lg font-medium mb-2">Import Successful!</h4>
            <p class="text-sm text-gray-600">
              {{ importResult.successfulRows }} of {{ importResult.totalRows }} rows imported successfully.
            </p>
          </div>
          <div v-else class="text-red-600">
            <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
            <h4 class="text-lg font-medium mb-2">Import Failed</h4>
            <p class="text-sm text-gray-600">
              {{ importResult?.error || 'An error occurred during import.' }}
            </p>
          </div>
          
          <button
            type="button"
            @click="$emit('close')"
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportImportService } from '../../services/exportImportService';

const props = defineProps<{
  entity?: string;
}>();

const emit = defineEmits<{
  close: [];
  import: [data: any];
}>();

const step = ref(1);
const selectedFile = ref<File | null>(null);
const importOptions = ref({
  skipFirstRow: true,
  dateFormat: 'yyyy-MM-dd',
  validateOnly: false,
});
const validationResult = ref<any>(null);
const importProgress = ref(0);
const importResult = ref<any>(null);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0];
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    selectedFile.value = event.dataTransfer.files[0];
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const downloadTemplate = async () => {
  if (!props.entity) return;
  
  try {
    const blob = await exportImportService.getImportTemplate(props.entity, 'csv');
    exportImportService.downloadBlob(blob, `${props.entity}_template.csv`);
  } catch (error) {
    console.error('Failed to download template:', error);
  }
};

const validateFile = async () => {
  if (!selectedFile.value || !props.entity) return;
  
  try {
    const result = await exportImportService.validateImportFile(
      props.entity,
      selectedFile.value,
      importOptions.value
    );
    
    if (result.success && result.data) {
      validationResult.value = result.data;
      step.value = 2;
    } else {
      alert(result.error || 'Validation failed');
    }
  } catch (error) {
    console.error('Validation failed:', error);
    alert('Validation failed');
  }
};

const handleImport = async () => {
  if (!selectedFile.value || !props.entity) return;
  
  step.value = 3;
  importProgress.value = 0;
  
  try {
    const result = await exportImportService.importData(
      props.entity,
      selectedFile.value,
      importOptions.value,
      (progress) => {
        importProgress.value = progress;
      }
    );
    
    importResult.value = result.data || result;
    step.value = 4;
    
    if (result.success) {
      emit('import', result.data);
    }
  } catch (error) {
    console.error('Import failed:', error);
    importResult.value = { success: false, error: 'Import failed' };
    step.value = 4;
  }
};
</script>