<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <h1 class="text-9xl font-bold text-gray-300 dark:text-gray-600">404</h1>
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Page Not Found
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div class="space-y-4">
        <BaseButton @click="$router.push('/')">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </template>
          Go Home
        </BaseButton>
        
        <BaseButton variant="secondary" @click="$router.back()">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </template>
          Go Back
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseButton from '../components/ui/BaseButton.vue';
</script>