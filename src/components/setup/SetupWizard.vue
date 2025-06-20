<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl w-full space-y-8">
      <!-- Progress Bar -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Setup Your Business</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">Step {{ currentStep }} of {{ totalSteps }}</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
          ></div>
        </div>
      </div>

      <!-- Step Content -->
      <BaseCard variant="bordered" padding="lg">
        <!-- Step 1: Business Information -->
        <div v-if="currentStep === 1">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Information</h3>
          <FormBuilder
            :fields="businessFields"
            :initial-data="setupData.business"
            @submit="handleBusinessSubmit"
            submit-text="Continue"
          />
        </div>

        <!-- Step 2: Admin User -->
        <div v-if="currentStep === 2">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Admin Account</h3>
          <FormBuilder
            :fields="adminFields"
            :initial-data="setupData.admin"
            @submit="handleAdminSubmit"
            submit-text="Continue"
          />
        </div>

        <!-- Step 3: Preferences -->
        <div v-if="currentStep === 3">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferences</h3>
          <FormBuilder
            :fields="preferencesFields"
            :initial-data="setupData.preferences"
            @submit="handlePreferencesSubmit"
            submit-text="Complete Setup"
          />
        </div>

        <!-- Step 4: Completion -->
        <div v-if="currentStep === 4" class="text-center">
          <div class="mb-6">
            <div class="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="h-8 w-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Setup Complete!</h3>
            <p class="text-gray-600 dark:text-gray-400">Your business is ready to go.</p>
          </div>
          <BaseButton @click="completeSetup">
            Get Started
          </BaseButton>
        </div>
      </BaseCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import FormBuilder, { type FormField } from '../common/FormBuilder.vue';
import { SettingService } from '../../services/SettingService';
import { UserService } from '../../services/UserService';

const router = useRouter();
const settingService = new SettingService();
const userService = new UserService();

const currentStep = ref(1);
const totalSteps = 4;

const setupData = reactive({
  business: {
    businessName: '',
    address: '',
    phone: '',
    email: '',
    currency: 'USD',
    timezone: 'UTC',
  },
  admin: {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  },
  preferences: {
    theme: 'system',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    notifications: true,
  },
});

const businessFields: FormField[] = [
  {
    name: 'businessName',
    type: 'text',
    label: 'Business Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'email',
    type: 'email',
    label: 'Business Email',
    required: true,
    validation: { required: true, email: true },
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone Number',
    validation: { phone: true },
  },
  {
    name: 'address',
    type: 'textarea',
    label: 'Business Address',
    rows: 3,
  },
  {
    name: 'currency',
    type: 'select',
    label: 'Currency',
    required: true,
    options: [
      { label: 'USD - US Dollar', value: 'USD' },
      { label: 'EUR - Euro', value: 'EUR' },
      { label: 'GBP - British Pound', value: 'GBP' },
      { label: 'INR - Indian Rupee', value: 'INR' },
    ],
  },
];

const adminFields: FormField[] = [
  {
    name: 'firstName',
    type: 'text',
    label: 'First Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'lastName',
    type: 'text',
    label: 'Last Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    required: true,
    validation: { required: true, email: true },
  },
  {
    name: 'password',
    type: 'password',
    label: 'Password',
    required: true,
    validation: { required: true, minLength: 6 },
  },
];

const preferencesFields: FormField[] = [
  {
    name: 'theme',
    type: 'select',
    label: 'Theme',
    options: [
      { label: 'System', value: 'system' },
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
    ],
  },
  {
    name: 'language',
    type: 'select',
    label: 'Language',
    options: [
      { label: 'English', value: 'en' },
      { label: 'Spanish', value: 'es' },
      { label: 'French', value: 'fr' },
    ],
  },
  {
    name: 'dateFormat',
    type: 'select',
    label: 'Date Format',
    options: [
      { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
      { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
      { label: 'YYYY-MM-DD', value: 'YYYY-MM-DD' },
    ],
  },
  {
    name: 'notifications',
    type: 'checkbox',
    label: 'Enable Notifications',
  },
];

const handleBusinessSubmit = (formData: any) => {
  setupData.business = { ...setupData.business, ...formData };
  currentStep.value = 2;
};

const handleAdminSubmit = (formData: any) => {
  setupData.admin = { ...setupData.admin, ...formData };
  currentStep.value = 3;
};

const handlePreferencesSubmit = async (formData: any) => {
  setupData.preferences = { ...setupData.preferences, ...formData };
  
  try {
    // Save business settings
    await settingService.updateMultipleSettings(setupData.business);
    
    // Create admin user
    await userService.create(setupData.admin);
    
    // Save preferences
    await settingService.updateMultipleSettings(setupData.preferences);
    
    // Mark setup as complete
    await settingService.setSetting('setup_complete', 'true');
    
    currentStep.value = 4;
  } catch (error) {
    console.error('Setup error:', error);
  }
};

const completeSetup = () => {
  router.push('/login');
};
</script>