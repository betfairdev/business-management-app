<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <div v-if="loading" class="flex items-center">
      <svg
        class="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {{ loadingText || 'Loading...' }}
    </div>
    <div v-else class="flex items-center justify-center">
      <slot name="icon-left" />
      <span v-if="$slots.default" :class="{ 'ml-2': $slots['icon-left'], 'mr-2': $slots['icon-right'] }">
        <slot />
      </span>
      <slot name="icon-right" />
    </div>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  outline?: boolean;
  rounded?: boolean;
  block?: boolean;
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  outline: false,
  rounded: false,
  block: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonClasses = computed(() => {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'transition-colors',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ];

  // Size classes
  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs'],
    sm: ['px-3', 'py-1.5', 'text-sm'],
    md: ['px-4', 'py-2', 'text-sm'],
    lg: ['px-6', 'py-3', 'text-base'],
    xl: ['px-8', 'py-4', 'text-lg'],
  };

  // Variant classes
  const variantClasses = {
    primary: props.outline
      ? ['border', 'border-blue-600', 'text-blue-600', 'hover:bg-blue-50', 'focus:ring-blue-500']
      : ['bg-blue-600', 'text-white', 'hover:bg-blue-700', 'focus:ring-blue-500'],
    secondary: props.outline
      ? ['border', 'border-gray-600', 'text-gray-600', 'hover:bg-gray-50', 'focus:ring-gray-500']
      : ['bg-gray-600', 'text-white', 'hover:bg-gray-700', 'focus:ring-gray-500'],
    success: props.outline
      ? ['border', 'border-green-600', 'text-green-600', 'hover:bg-green-50', 'focus:ring-green-500']
      : ['bg-green-600', 'text-white', 'hover:bg-green-700', 'focus:ring-green-500'],
    danger: props.outline
      ? ['border', 'border-red-600', 'text-red-600', 'hover:bg-red-50', 'focus:ring-red-500']
      : ['bg-red-600', 'text-white', 'hover:bg-red-700', 'focus:ring-red-500'],
    warning: props.outline
      ? ['border', 'border-yellow-600', 'text-yellow-600', 'hover:bg-yellow-50', 'focus:ring-yellow-500']
      : ['bg-yellow-600', 'text-white', 'hover:bg-yellow-700', 'focus:ring-yellow-500'],
    info: props.outline
      ? ['border', 'border-cyan-600', 'text-cyan-600', 'hover:bg-cyan-50', 'focus:ring-cyan-500']
      : ['bg-cyan-600', 'text-white', 'hover:bg-cyan-700', 'focus:ring-cyan-500'],
    light: props.outline
      ? ['border', 'border-gray-300', 'text-gray-700', 'hover:bg-gray-50', 'focus:ring-gray-500']
      : ['bg-gray-100', 'text-gray-900', 'hover:bg-gray-200', 'focus:ring-gray-500'],
    dark: props.outline
      ? ['border', 'border-gray-900', 'text-gray-900', 'hover:bg-gray-50', 'focus:ring-gray-500']
      : ['bg-gray-900', 'text-white', 'hover:bg-gray-800', 'focus:ring-gray-500'],
  };

  // Border radius
  const roundedClasses = props.rounded ? ['rounded-full'] : ['rounded-md'];

  // Block width
  const blockClasses = props.block ? ['w-full'] : [];

  return [
    ...baseClasses,
    ...sizeClasses[props.size],
    ...variantClasses[props.variant],
    ...roundedClasses,
    ...blockClasses,
  ].join(' ');
});

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>