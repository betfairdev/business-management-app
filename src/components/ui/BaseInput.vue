<template>
  <div class="space-y-1">
    <label
      v-if="label"
      :for="inputId"
      class="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative">
      <div
        v-if="$slots['icon-left']"
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <slot name="icon-left" />
      </div>

      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :step="step"
        :class="inputClasses"
        @input="handleInput"
        @blur="handleBlur"
        @focus="handleFocus"
      />

      <div
        v-if="$slots['icon-right'] || clearable"
        class="absolute inset-y-0 right-0 pr-3 flex items-center"
      >
        <button
          v-if="clearable && modelValue"
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
          @click="clearInput"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <slot name="icon-right" />
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

export interface InputProps {
  modelValue?: string | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  error?: string;
  hint?: string;
  size?: 'sm' | 'md' | 'lg';
  clearable?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  required: false,
  size: 'md',
  clearable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | number];
  blur: [event: FocusEvent];
  focus: [event: FocusEvent];
}>();

const inputId = ref(`input-${Math.random().toString(36).substr(2, 9)}`);

const inputClasses = computed(() => {
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
  ];

  // Size classes
  const sizeClasses = {
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-3', 'py-2', 'text-sm'],
    lg: ['px-4', 'py-3', 'text-base'],
  };

  // State classes
  const stateClasses = props.error
    ? [
        'border-red-300',
        'text-red-900',
        'placeholder-red-300',
        'focus:ring-red-500',
        'focus:border-red-500',
      ]
    : [
        'border-gray-300',
        'text-gray-900',
        'placeholder-gray-400',
        'focus:ring-blue-500',
        'focus:border-blue-500',
      ];

  // Icon padding
  const iconPadding = [];
  if (props.$slots?.['icon-left']) {
    iconPadding.push('pl-10');
  }
  if (props.$slots?.['icon-right'] || props.clearable) {
    iconPadding.push('pr-10');
  }

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...stateClasses,
    ...iconPadding,
  ].join(' ');
});

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = props.type === 'number' ? Number(target.value) : target.value;
  emit('update:modelValue', value);
};

const handleBlur = (event: FocusEvent) => {
  emit('blur', event);
};

const handleFocus = (event: FocusEvent) => {
  emit('focus', event);
};

const clearInput = () => {
  emit('update:modelValue', '');
};
</script>