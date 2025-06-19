<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <div class="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
          <svg class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v8" />
          </svg>
        </div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Business Manager
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Sign in to your account
        </p>
      </div>

      <BaseCard padding="lg">
        <FormBuilder
          :fields="loginFields"
          :loading="authStore.isLoading"
          submit-text="Sign In"
          @submit="handleLogin"
        />

        <div v-if="authStore.error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p class="text-sm text-red-600 dark:text-red-400">
            {{ authStore.error }}
          </p>
        </div>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Demo Credentials
              </span>
            </div>
          </div>

          <div class="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Admin:</strong> admin@example.com / password123</p>
            <p><strong>Manager:</strong> manager@example.com / password123</p>
            <p><strong>Employee:</strong> employee@example.com / password123</p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/authStore';
import BaseCard from '../../components/ui/BaseCard.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import type { LoginDto } from '../../dtos/LoginDto';

const router = useRouter();
const authStore = useAuthStore();

const loginFields: FormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: true,
    validation: {
      required: true,
      email: true,
    },
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    placeholder: 'Enter your password',
    required: true,
    validation: {
      required: true,
      minLength: 6,
    },
  },
];

const handleLogin = async (formData: Record<string, any>) => {
  authStore.clearError();
  
  const loginData: LoginDto = {
    email: formData.email,
    password: formData.password,
  };

  const success = await authStore.login(loginData);
  
  if (success) {
    router.push('/');
  }
};
</script>