<template>
  <div :class="cardClasses">
    <!-- Header -->
    <div v-if="$slots.header || title" :class="headerClasses">
      <slot name="header">
        <h3 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ title }}
        </h3>
      </slot>
    </div>

    <!-- Body -->
    <div :class="bodyClasses">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" :class="footerClasses">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

export interface CardProps {
  title?: string;
  variant?: 'default' | 'bordered' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  hoverable?: boolean;
}

const props = withDefaults(defineProps<CardProps>(), {
  variant: 'default',
  padding: 'md',
  rounded: true,
  hoverable: false,
});

const cardClasses = computed(() => {
  const baseClasses = [
    'bg-white',
    'dark:bg-gray-800',
    'transition-all',
    'duration-200',
  ];

  const variantClasses = {
    default: [],
    bordered: ['border', 'border-gray-200', 'dark:border-gray-700'],
    elevated: ['shadow-lg'],
    outlined: ['border-2', 'border-gray-300', 'dark:border-gray-600'],
  };

  const roundedClasses = props.rounded ? ['rounded-lg'] : [];
  const hoverClasses = props.hoverable ? ['hover:shadow-md', 'cursor-pointer'] : [];

  return [
    ...baseClasses,
    ...variantClasses[props.variant],
    ...roundedClasses,
    ...hoverClasses,
  ].join(' ');
});

const headerClasses = computed(() => {
  const baseClasses = ['border-b', 'border-gray-200', 'dark:border-gray-700'];
  
  const paddingClasses = {
    none: [],
    sm: ['px-3', 'py-2'],
    md: ['px-4', 'py-3'],
    lg: ['px-6', 'py-4'],
  };

  return [...baseClasses, ...paddingClasses[props.padding]].join(' ');
});

const bodyClasses = computed(() => {
  const paddingClasses = {
    none: [],
    sm: ['p-3'],
    md: ['p-4'],
    lg: ['p-6'],
  };

  return paddingClasses[props.padding].join(' ');
});

const footerClasses = computed(() => {
  const baseClasses = ['border-t', 'border-gray-200', 'dark:border-gray-700'];
  
  const paddingClasses = {
    none: [],
    sm: ['px-3', 'py-2'],
    md: ['px-4', 'py-3'],
    lg: ['px-6', 'py-4'],
  };

  return [...baseClasses, ...paddingClasses[props.padding]].join(' ');
});
</script>