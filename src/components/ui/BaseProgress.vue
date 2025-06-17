<template>
  <div class="w-full">
    <div v-if="label || showPercentage" class="flex justify-between items-center mb-2">
      <span v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ label }}
      </span>
      <span v-if="showPercentage" class="text-sm text-gray-500 dark:text-gray-400">
        {{ Math.round(percentage) }}%
      </span>
    </div>

    <div :class="containerClasses">
      <div
        :class="barClasses"
        :style="{ width: `${percentage}%` }"
        role="progressbar"
        :aria-valuenow="value"
        :aria-valuemin="min"
        :aria-valuemax="max"
      >
        <div v-if="animated" class="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
      </div>
    </div>

    <div v-if="description" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface ProgressProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  description?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  animated?: boolean;
  striped?: boolean;
}

const props = withDefaults(defineProps<ProgressProps>(), {
  min: 0,
  max: 100,
  variant: 'primary',
  size: 'md',
  showPercentage: false,
  animated: false,
  striped: false,
});

const percentage = computed(() => {
  const range = props.max - props.min;
  const adjustedValue = Math.max(props.min, Math.min(props.max, props.value));
  return ((adjustedValue - props.min) / range) * 100;
});

const containerClasses = computed(() => {
  const baseClasses = [
    'w-full',
    'bg-gray-200',
    'dark:bg-gray-700',
    'rounded-full',
    'overflow-hidden',
  ];

  const sizeClasses = {
    sm: ['h-2'],
    md: ['h-3'],
    lg: ['h-4'],
  };

  return [...baseClasses, ...sizeClasses[props.size]].join(' ');
});

const barClasses = computed(() => {
  const baseClasses = [
    'h-full',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'relative',
  ];

  const variantClasses = {
    primary: ['bg-blue-600'],
    success: ['bg-green-600'],
    warning: ['bg-yellow-600'],
    danger: ['bg-red-600'],
    info: ['bg-cyan-600'],
  };

  const stripedClasses = props.striped
    ? [
        'bg-gradient-to-r',
        'from-current',
        'via-transparent',
        'to-current',
        'bg-size-8',
        'animate-pulse',
      ]
    : [];

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...stripedClasses,
  ].join(' ');
});
</script>