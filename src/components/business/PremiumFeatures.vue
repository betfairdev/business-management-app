<template>
  <div class="space-y-6">
    <!-- Premium Banner -->
    <div v-if="!isPremium" class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold mb-2">Upgrade to Premium</h3>
          <p class="text-blue-100">Unlock advanced features and grow your business faster</p>
        </div>
        <BaseButton variant="light" @click="showPricingModal = true">
          Upgrade Now
        </BaseButton>
      </div>
    </div>

    <!-- Feature Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="feature in features" :key="feature.id" class="relative">
        <BaseCard variant="bordered" padding="lg" :class="{ 'opacity-50': !feature.available && !isPremium }">
          <div class="flex items-start justify-between mb-4">
            <div :class="feature.iconBg" class="p-3 rounded-lg">
              <component :is="feature.icon" :class="feature.iconColor" class="w-6 h-6" />
            </div>
            <span v-if="feature.premium" class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              Premium
            </span>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">{{ feature.title }}</h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">{{ feature.description }}</p>
          
          <BaseButton 
            :disabled="!feature.available && !isPremium"
            @click="feature.action"
            class="w-full"
          >
            {{ feature.buttonText }}
          </BaseButton>
        </BaseCard>
        
        <!-- Premium Lock Overlay -->
        <div v-if="!feature.available && !isPremium" class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div class="text-center text-white">
            <svg class="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p class="text-sm font-medium">Premium Feature</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Modal -->
    <BaseModal v-model="showPricingModal" title="Choose Your Plan" size="lg">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="product in products" :key="product.id" class="border rounded-lg p-6">
          <div class="text-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ product.title }}</h3>
            <p class="text-gray-600 dark:text-gray-400 mt-2">{{ product.description }}</p>
            <div class="mt-4">
              <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ product.price }}</span>
              <span class="text-gray-500 dark:text-gray-400">{{ product.type === 'subscription' ? '/month' : '' }}</span>
            </div>
          </div>
          
          <BaseButton 
            @click="purchaseProduct(product.id)"
            :loading="purchasing === product.id"
            class="w-full"
          >
            {{ hasPurchased(product.id) ? 'Purchased' : 'Purchase' }}
          </BaseButton>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseCard from '../ui/BaseCard.vue';
import BaseButton from '../ui/BaseButton.vue';
import BaseModal from '../ui/BaseModal.vue';
import { InAppPurchaseService, type Product } from '../../services/InAppPurchaseService';

const purchaseService = new InAppPurchaseService();

const showPricingModal = ref(false);
const purchasing = ref<string | null>(null);
const products = ref<Product[]>([]);
const purchases = ref<any[]>([]);

const isPremium = computed(() => {
  return purchases.value.some(p => 
    ['premium_monthly', 'premium_yearly'].includes(p.productId) && 
    p.purchaseState === 'purchased'
  );
});

const features = [
  {
    id: 'advanced_reports',
    title: 'Advanced Reports',
    description: 'Get detailed analytics and insights about your business performance',
    icon: 'ChartBarIcon',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    premium: true,
    available: false,
    buttonText: 'View Reports',
    action: () => console.log('Advanced reports'),
  },
  {
    id: 'multi_store',
    title: 'Multi-Store Management',
    description: 'Manage multiple store locations from a single dashboard',
    icon: 'BuildingStorefrontIcon',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    premium: true,
    available: false,
    buttonText: 'Manage Stores',
    action: () => console.log('Multi-store'),
  },
  {
    id: 'api_access',
    title: 'API Access',
    description: 'Integrate with third-party applications using our REST API',
    icon: 'CodeBracketIcon',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    premium: true,
    available: false,
    buttonText: 'View API Docs',
    action: () => console.log('API access'),
  },
  {
    id: 'email_marketing',
    title: 'Email Marketing',
    description: 'Send promotional emails and newsletters to your customers',
    icon: 'EnvelopeIcon',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    premium: true,
    available: false,
    buttonText: 'Start Campaign',
    action: () => console.log('Email marketing'),
  },
  {
    id: 'sms_notifications',
    title: 'SMS Notifications',
    description: 'Send order confirmations and updates via SMS',
    icon: 'ChatBubbleLeftRightIcon',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    premium: true,
    available: false,
    buttonText: 'Setup SMS',
    action: () => console.log('SMS notifications'),
  },
  {
    id: 'cloud_backup',
    title: 'Cloud Backup',
    description: 'Automatic daily backups of your business data to the cloud',
    icon: 'CloudArrowUpIcon',
    iconBg: 'bg-teal-100 dark:bg-teal-900',
    iconColor: 'text-teal-600 dark:text-teal-400',
    premium: true,
    available: false,
    buttonText: 'Configure Backup',
    action: () => console.log('Cloud backup'),
  },
];

const hasPurchased = (productId: string): boolean => {
  return purchases.value.some(p => p.productId === productId && p.purchaseState === 'purchased');
};

const purchaseProduct = async (productId: string) => {
  try {
    purchasing.value = productId;
    const purchase = await purchaseService.purchaseProduct(productId);
    purchases.value.push(purchase);
    showPricingModal.value = false;
  } catch (error) {
    console.error('Purchase failed:', error);
  } finally {
    purchasing.value = null;
  }
};

onMounted(async () => {
  await purchaseService.initialize();
  products.value = await purchaseService.getProducts();
  purchases.value = await purchaseService.getPurchases();
});
</script>