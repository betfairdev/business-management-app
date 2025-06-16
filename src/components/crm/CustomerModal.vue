<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ isEdit ? 'Edit Customer' : 'Add New Customer' }}
        </h3>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              v-model="form.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              v-model="form.phone"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- WhatsApp -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              v-model="form.whatsapp"
              type="tel"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Customer Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
            <select
              v-model="form.customerType"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Retailer">Retailer</option>
              <option value="Dealer">Dealer</option>
              <option value="Wholesaler">Wholesaler</option>
            </select>
          </div>

          <!-- Company Name -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input
              v-model="form.companyName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Address -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              v-model="form.address"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Tax ID -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
            <input
              v-model="form.taxId"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              v-model="form.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {{ isEdit ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  customer?: any;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: any];
}>();

const form = ref({
  name: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  companyName: '',
  customerType: 'Retailer',
  taxId: '',
  status: 'Active',
});

const handleSubmit = () => {
  emit('save', form.value);
};

onMounted(() => {
  if (props.customer && props.isEdit) {
    Object.assign(form.value, props.customer);
  }
});
</script>