<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="selectId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        :multiple="multiple"
        :class="selectClasses"
        @change="handleChange"
        @blur="handleBlur"
        @focus="handleFocus"
      >
        <option v-if="placeholder && !multiple" value="" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in normalizedOptions"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
        >
          {{ option.label }}
        </option>
      </select>

      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <div v-if="error || hint" class="text-sm">
      <p v-if="error" class="text-red-600 dark:text-red-400">{{ error }}</p>
      <p v-else-if="hint" class="text-gray-500 dark:text-gray-400">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps {
  modelValue?: string | number | string[] | number[];
  options: SelectOption[] | string[] | number[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<SelectProps>(), {
  disabled: false,
  required: false,
  multiple: false,
  size: 'md',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number | string[] | number[]];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const selectId = ref(`select-${Math.random().toString(36).substr(2, 9)}`);

const normalizedOptions = computed(() => {
  return props.options.map(option => {
    if (typeof option === 'object') {
      return option;
    }
    return {
      label: String(option),
      value: option,
      disabled: false,
    };
  });
});

const selectClasses = computed(() => {
  const baseClasses = [
    'block',
    'w-full',
    'border',
    'rounded-md',
    'shadow-sm',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'dark:bg-gray-800',
    'dark:border-gray-600',
    'dark:text-white',
    'appearance-none',
    'pr-10',
  ];

  const sizeClasses = {
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-3', 'py-2', 'text-sm'],
    lg: ['px-4', 'py-3', 'text-base'],
  };

  const stateClasses = props.error
    ? [
        'border-red-300',
        'text-red-900',
        'focus:ring-red-500',
        'focus:border-red-500',
      ]
    : [
        'border-gray-300',
        'text-gray-900',
        'focus:ring-blue-500',
        'focus:border-blue-500',
      ];

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...stateClasses,
  ].join(' ');
});

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  
  if (props.multiple) {
    const values = Array.from(target.selectedOptions).map(option => {
      const originalOption = normalizedOptions.value.find(opt => String(opt.value) === option.value);
      return originalOption?.value || option.value;
    });
    emit('update:modelValue', values);
  } else {
    const selectedOption = normalizedOptions.value.find(opt => String(opt.value) === target.value);
    emit('update:modelValue', selectedOption?.value || target.value);
  }
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};
</script>