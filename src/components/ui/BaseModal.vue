<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

        <!-- Modal container -->
        <div class="flex min-h-full items-center justify-center p-4">
          <Transition
            enter-active-class="transition-all duration-300"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-300"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="modelValue"
              :class="modalClasses"
              @click.stop
            >
              <!-- Header -->
              <div v-if="$slots.header || title || closable" class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div class="flex-1">
                  <slot name="header">
                    <h3 v-if="title" class="text-lg font-semibold text-gray-900 dark:text-white">
                      {{ title }}
                    </h3>
                  </slot>
                </div>
                <button
                  v-if="closable"
                  type="button"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                  @click="close"
                >
                  <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Body -->
              <div class="p-6">
                <slot />
              </div>

              <!-- Footer -->
              <div v-if="$slots.footer" class="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <slot name="footer" />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';

export interface ModalProps {
  modelValue: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  closable?: boolean;
  closeOnBackdrop?: boolean;
  persistent?: boolean;
}

const props = withDefaults(defineProps<ModalProps>(), {
  size: 'md',
  closable: true,
  closeOnBackdrop: true,
  persistent: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
  open: [];
}>();

const modalClasses = computed(() => {
  const baseClasses = [
    'relative',
    'bg-white',
    'dark:bg-gray-800',
    'rounded-lg',
    'shadow-xl',
    'transform',
    'transition-all',
    'w-full',
  ];

  const sizeClasses = {
    sm: ['max-w-sm'],
    md: ['max-w-md'],
    lg: ['max-w-lg'],
    xl: ['max-w-xl'],
    '2xl': ['max-w-2xl'],
    full: ['max-w-full', 'mx-4'],
  };

  return [...baseClasses, ...sizeClasses[props.size]].join(' ');
});

const close = () => {
  if (!props.persistent) {
    emit('update:modelValue', false);
    emit('close');
  }
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};

// Handle escape key
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    emit('open');
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
  } else {
    document.removeEventListener('keydown', handleEscape);
    document.body.style.overflow = '';
  }
});

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable) {
    close();
  }
};
</script>