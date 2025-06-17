<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div
      v-for="field in fields"
      :key="field.name"
      :class="getFieldWrapperClass(field)"
    >
      <!-- Text Input -->
      <BaseInput
        v-if="field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number'"
        v-model="formData[field.name]"
        :type="field.type"
        :label="field.label"
        :placeholder="field.placeholder"
        :required="field.required"
        :disabled="field.disabled"
        :error="getFieldError(field.name)"
        :hint="field.hint"
        @blur="validateField(field.name)"
      />

      <!-- Select -->
      <BaseSelect
        v-else-if="field.type === 'select'"
        v-model="formData[field.name]"
        :label="field.label"
        :placeholder="field.placeholder"
        :options="field.options || []"
        :required="field.required"
        :disabled="field.disabled"
        :multiple="field.multiple"
        :error="getFieldError(field.name)"
        :hint="field.hint"
        @blur="validateField(field.name)"
      />

      <!-- Textarea -->
      <div v-else-if="field.type === 'textarea'" class="space-y-1">
        <label
          :for="field.name"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
        <textarea
          :id="field.name"
          v-model="formData[field.name]"
          :placeholder="field.placeholder"
          :required="field.required"
          :disabled="field.disabled"
          :rows="field.rows || 3"
          :class="getTextareaClass(field.name)"
          @blur="validateField(field.name)"
        ></textarea>
        <div v-if="getFieldError(field.name) || field.hint" class="text-sm">
          <p v-if="getFieldError(field.name)" class="text-red-600 dark:text-red-400">
            {{ getFieldError(field.name) }}
          </p>
          <p v-else-if="field.hint" class="text-gray-500 dark:text-gray-400">
            {{ field.hint }}
          </p>
        </div>
      </div>

      <!-- Checkbox -->
      <div v-else-if="field.type === 'checkbox'" class="flex items-center space-x-2">
        <input
          :id="field.name"
          v-model="formData[field.name]"
          type="checkbox"
          :required="field.required"
          :disabled="field.disabled"
          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label
          :for="field.name"
          class="text-sm text-gray-700 dark:text-gray-300"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
      </div>

      <!-- Radio Group -->
      <div v-else-if="field.type === 'radio'" class="space-y-1">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
        <div class="space-y-2">
          <div
            v-for="option in field.options"
            :key="option.value"
            class="flex items-center space-x-2"
          >
            <input
              :id="`${field.name}-${option.value}`"
              v-model="formData[field.name]"
              type="radio"
              :value="option.value"
              :required="field.required"
              :disabled="field.disabled"
              class="border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              :for="`${field.name}-${option.value}`"
              class="text-sm text-gray-700 dark:text-gray-300"
            >
              {{ option.label }}
            </label>
          </div>
        </div>
        <div v-if="getFieldError(field.name) || field.hint" class="text-sm">
          <p v-if="getFieldError(field.name)" class="text-red-600 dark:text-red-400">
            {{ getFieldError(field.name) }}
          </p>
          <p v-else-if="field.hint" class="text-gray-500 dark:text-gray-400">
            {{ field.hint }}
          </p>
        </div>
      </div>

      <!-- File Upload -->
      <div v-else-if="field.type === 'file'" class="space-y-1">
        <label
          :for="field.name"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>
        <input
          :id="field.name"
          type="file"
          :accept="field.accept"
          :multiple="field.multiple"
          :required="field.required"
          :disabled="field.disabled"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          @change="handleFileChange(field.name, $event)"
        />
        <div v-if="getFieldError(field.name) || field.hint" class="text-sm">
          <p v-if="getFieldError(field.name)" class="text-red-600 dark:text-red-400">
            {{ getFieldError(field.name) }}
          </p>
          <p v-else-if="field.hint" class="text-gray-500 dark:text-gray-400">
            {{ field.hint }}
          </p>
        </div>
      </div>

      <!-- Date -->
      <BaseInput
        v-else-if="field.type === 'date' || field.type === 'datetime-local' || field.type === 'time'"
        v-model="formData[field.name]"
        :type="field.type"
        :label="field.label"
        :required="field.required"
        :disabled="field.disabled"
        :error="getFieldError(field.name)"
        :hint="field.hint"
        @blur="validateField(field.name)"
      />

      <!-- Custom Field Slot -->
      <slot
        v-else
        :name="`field-${field.name}`"
        :field="field"
        :value="formData[field.name]"
        :error="getFieldError(field.name)"
        :update-value="(value: any) => updateFieldValue(field.name, value)"
      />
    </div>

    <!-- Form Actions -->
    <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
      <slot name="actions" :is-valid="isFormValid" :is-loading="loading">
        <BaseButton
          v-if="showCancel"
          type="button"
          variant="secondary"
          @click="handleCancel"
        >
          Cancel
        </BaseButton>
        <BaseButton
          type="submit"
          :loading="loading"
          :disabled="!isFormValid"
        >
          {{ submitText }}
        </BaseButton>
      </slot>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import BaseInput from '../ui/BaseInput.vue';
import BaseSelect from '../ui/BaseSelect.vue';
import BaseButton from '../ui/BaseButton.vue';
import { ValidationUtility, type ValidationRule } from '../../utils/validationUtility';

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'date' | 'datetime-local' | 'time';
  label: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  validation?: ValidationRule;
  options?: Array<{ label: string; value: any; disabled?: boolean }>;
  multiple?: boolean;
  accept?: string;
  rows?: number;
  width?: 'full' | 'half' | 'third' | 'quarter';
}

export interface FormBuilderProps {
  fields: FormField[];
  initialData?: Record<string, any>;
  loading?: boolean;
  submitText?: string;
  showCancel?: boolean;
  validateOnChange?: boolean;
}

const props = withDefaults(defineProps<FormBuilderProps>(), {
  loading: false,
  submitText: 'Submit',
  showCancel: false,
  validateOnChange: false,
});

const emit = defineEmits<{
  submit: [data: Record<string, any>];
  cancel: [];
  change: [field: string, value: any];
}>();

// Form state
const formData = reactive<Record<string, any>>({});
const errors = ref<Record<string, string[]>>({});
const touched = ref<Record<string, boolean>>({});

// Initialize form data
const initializeFormData = () => {
  props.fields.forEach(field => {
    if (props.initialData && field.name in props.initialData) {
      formData[field.name] = props.initialData[field.name];
    } else {
      // Set default values based on field type
      switch (field.type) {
        case 'checkbox':
          formData[field.name] = false;
          break;
        case 'select':
          formData[field.name] = field.multiple ? [] : '';
          break;
        case 'file':
          formData[field.name] = field.multiple ? [] : null;
          break;
        default:
          formData[field.name] = '';
      }
    }
  });
};

// Initialize on mount
initializeFormData();

// Watch for initialData changes
watch(() => props.initialData, () => {
  initializeFormData();
}, { deep: true });

// Computed properties
const isFormValid = computed(() => {
  return props.fields.every(field => {
    if (!field.validation) return true;
    const result = ValidationUtility.validate(formData[field.name], field.validation);
    return result.isValid;
  });
});

// Methods
const validateField = (fieldName: string) => {
  const field = props.fields.find(f => f.name === fieldName);
  if (!field?.validation) {
    errors.value[fieldName] = [];
    return;
  }

  const result = ValidationUtility.validate(formData[fieldName], field.validation);
  errors.value[fieldName] = result.errors;
  touched.value[fieldName] = true;
};

const validateAllFields = () => {
  props.fields.forEach(field => {
    if (field.validation) {
      validateField(field.name);
    }
  });
};

const getFieldError = (fieldName: string): string | undefined => {
  const fieldErrors = errors.value[fieldName];
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
};

const getFieldWrapperClass = (field: FormField): string => {
  const widthClasses = {
    full: 'col-span-full',
    half: 'col-span-6',
    third: 'col-span-4',
    quarter: 'col-span-3',
  };

  return widthClasses[field.width || 'full'];
};

const getTextareaClass = (fieldName: string): string => {
  const baseClass = 'block w-full border rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-white px-3 py-2 text-sm';
  
  const hasError = getFieldError(fieldName);
  const stateClass = hasError
    ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500';

  return `${baseClass} ${stateClass}`;
};

const updateFieldValue = (fieldName: string, value: any) => {
  formData[fieldName] = value;
  emit('change', fieldName, value);
  
  if (props.validateOnChange) {
    validateField(fieldName);
  }
};

const handleFileChange = (fieldName: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  
  if (!files) return;
  
  const field = props.fields.find(f => f.name === fieldName);
  if (field?.multiple) {
    formData[fieldName] = Array.from(files);
  } else {
    formData[fieldName] = files[0] || null;
  }
  
  emit('change', fieldName, formData[fieldName]);
  
  if (props.validateOnChange) {
    validateField(fieldName);
  }
};

const handleSubmit = () => {
  validateAllFields();
  
  if (isFormValid.value) {
    emit('submit', { ...formData });
  }
};

const handleCancel = () => {
  emit('cancel');
};

// Watch for form data changes
watch(formData, (newData) => {
  Object.keys(newData).forEach(fieldName => {
    if (props.validateOnChange && touched.value[fieldName]) {
      validateField(fieldName);
    }
  });
}, { deep: true });
</script>