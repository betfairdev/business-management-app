<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Business Management System
        </p>
      </div>

      <BaseCard padding="lg">
        <FormBuilder
          :fields="loginFields"
          :loading="appStore.isLoading"
          submit-text="Sign In"
          @submit="handleLogin"
        />

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

          <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Email:</strong> admin@example.com</p>
            <p><strong>Password:</strong> password123</p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '../stores/appStore';
import BaseCard from '../components/ui/BaseCard.vue';
import FormBuilder from '../components/common/FormBuilder.vue';
import type { FormField } from '../components/common/FormBuilder.vue';

const router = useRouter();
const appStore = useAppStore();

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

const handleLogin = async (formData: { email: string; password: string }) => {
  const result = await appStore.login(formData.email, formData.password);
  
  if (result.success) {
    router.push('/');
  } else {
    // Handle login error
    console.error('Login failed:', result.error);
    // You could show a toast notification here
  }
};
</script>