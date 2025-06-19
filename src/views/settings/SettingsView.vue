<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your application settings and preferences
        </p>
      </div>
    </div>

    <!-- Settings Tabs -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="[
            activeTab === tab.id
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300',
            'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
          ]"
          @click="activeTab = tab.id"
        >
          {{ tab.name }}
        </button>
      </nav>
    </div>

    <!-- General Settings -->
    <div v-if="activeTab === 'general'">
      <BaseCard title="General Settings" variant="bordered" padding="lg">
        <FormBuilder
          :fields="generalFields"
          :initial-data="generalSettings"
          :loading="isSubmitting"
          submit-text="Save Settings"
          @submit="saveGeneralSettings"
        />
      </BaseCard>
    </div>

    <!-- Business Settings -->
    <div v-if="activeTab === 'business'">
      <BaseCard title="Business Information" variant="bordered" padding="lg">
        <FormBuilder
          :fields="businessFields"
          :initial-data="businessSettings"
          :loading="isSubmitting"
          submit-text="Save Business Info"
          @submit="saveBusinessSettings"
        />
      </BaseCard>
    </div>

    <!-- Tax Settings -->
    <div v-if="activeTab === 'tax'">
      <div class="space-y-6">
        <!-- Tax Rates -->
        <BaseCard title="Tax Rates" variant="bordered" padding="lg">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Tax Rates</h3>
              <BaseButton size="sm" @click="showTaxRateModal = true">
                <template #icon-left>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </template>
                Add Tax Rate
              </BaseButton>
            </div>
          </template>

          <div class="space-y-4">
            <div v-for="taxRate in taxRates" :key="taxRate.id" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ taxRate.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ taxRate.rate }}%</p>
              </div>
              <div class="flex space-x-2">
                <BaseButton size="sm" variant="secondary" @click="editTaxRate(taxRate)">
                  Edit
                </BaseButton>
                <BaseButton size="sm" variant="danger" @click="deleteTaxRate(taxRate.id)">
                  Delete
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Payment Methods -->
        <BaseCard title="Payment Methods" variant="bordered" padding="lg">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
              <BaseButton size="sm" @click="showPaymentMethodModal = true">
                <template #icon-left>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </template>
                Add Payment Method
              </BaseButton>
            </div>
          </template>

          <div class="space-y-4">
            <div v-for="method in paymentMethods" :key="method.id" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ method.name }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ method.description }}</p>
              </div>
              <div class="flex space-x-2">
                <BaseButton size="sm" variant="secondary" @click="editPaymentMethod(method)">
                  Edit
                </BaseButton>
                <BaseButton size="sm" variant="danger" @click="deletePaymentMethod(method.id)">
                  Delete
                </BaseButton>
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- User Management -->
    <div v-if="activeTab === 'users'">
      <BaseCard title="User Management" variant="bordered" padding="lg">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Users</h3>
            <BaseButton size="sm" @click="showUserModal = true">
              <template #icon-left>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </template>
              Add User
            </BaseButton>
          </div>
        </template>

        <ResponsiveDataTable
          :data="users"
          :columns="userColumns"
          :loading="isLoading"
          :mobile-columns="['firstName', 'email', 'role.name']"
        >
          <template #cell-name="{ item }">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ item.firstName }} {{ item.lastName }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ item.email }}</p>
            </div>
          </template>

          <template #cell-role="{ item }">
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {{ item.role?.name || 'No Role' }}
            </span>
          </template>

          <template #row-actions="{ item }">
            <div class="flex space-x-2">
              <BaseButton size="sm" variant="secondary" @click="editUser(item)">
                Edit
              </BaseButton>
              <BaseButton size="sm" variant="danger" @click="deleteUser(item.id)">
                Delete
              </BaseButton>
            </div>
          </template>
        </ResponsiveDataTable>
      </BaseCard>
    </div>

    <!-- Backup & Export -->
    <div v-if="activeTab === 'backup'">
      <div class="space-y-6">
        <BaseCard title="Data Backup" variant="bordered" padding="lg">
          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              Create a backup of your business data including products, customers, sales, and more.
            </p>
            <BaseButton @click="createBackup" :loading="isCreatingBackup">
              <template #icon-left>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </template>
              Create Backup
            </BaseButton>
          </div>
        </BaseCard>

        <BaseCard title="Data Export" variant="bordered" padding="lg">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseButton variant="secondary" @click="exportAllData">
              <template #icon-left>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </template>
              Export All Data
            </BaseButton>
            
            <BaseButton variant="secondary" @click="exportProducts">
              Export Products
            </BaseButton>
            
            <BaseButton variant="secondary" @click="exportCustomers">
              Export Customers
            </BaseButton>
            
            <BaseButton variant="secondary" @click="exportSales">
              Export Sales
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Tax Rate Modal -->
    <BaseModal v-model="showTaxRateModal" :title="editingTaxRate ? 'Edit Tax Rate' : 'Add Tax Rate'" size="md">
      <FormBuilder
        :fields="taxRateFields"
        :initial-data="editingTaxRate"
        :loading="isSubmitting"
        :submit-text="editingTaxRate ? 'Update Tax Rate' : 'Add Tax Rate'"
        show-cancel
        @submit="saveTaxRate"
        @cancel="closeTaxRateModal"
      />
    </BaseModal>

    <!-- Payment Method Modal -->
    <BaseModal v-model="showPaymentMethodModal" :title="editingPaymentMethod ? 'Edit Payment Method' : 'Add Payment Method'" size="md">
      <FormBuilder
        :fields="paymentMethodFields"
        :initial-data="editingPaymentMethod"
        :loading="isSubmitting"
        :submit-text="editingPaymentMethod ? 'Update Payment Method' : 'Add Payment Method'"
        show-cancel
        @submit="savePaymentMethod"
        @cancel="closePaymentMethodModal"
      />
    </BaseModal>

    <!-- User Modal -->
    <BaseModal v-model="showUserModal" :title="editingUser ? 'Edit User' : 'Add User'" size="lg">
      <FormBuilder
        :fields="userFields"
        :initial-data="editingUser"
        :loading="isSubmitting"
        :submit-text="editingUser ? 'Update User' : 'Add User'"
        show-cancel
        @submit="saveUser"
        @cancel="closeUserModal"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseCard from '../../components/ui/BaseCard.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import ResponsiveDataTable from '../../components/layout/ResponsiveDataTable.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import { SettingService } from '../../services/SettingService';
import { TaxRateService } from '../../services/TaxRateService';
import { PaymentMethodService } from '../../services/PaymentMethodService';
import { UserService } from '../../services/UserService';
import { ExportUtility } from '../../utils/exportUtility';
import type { TableColumn } from '../../components/common/DataTable.vue';

// Services
const settingService = new SettingService();
const taxRateService = new TaxRateService();
const paymentMethodService = new PaymentMethodService();
const userService = new UserService();

// State
const isLoading = ref(false);
const isSubmitting = ref(false);
const isCreatingBackup = ref(false);
const activeTab = ref('general');

// Modal state
const showTaxRateModal = ref(false);
const showPaymentMethodModal = ref(false);
const showUserModal = ref(false);
const editingTaxRate = ref<any>(null);
const editingPaymentMethod = ref<any>(null);
const editingUser = ref<any>(null);

// Data
const taxRates = ref<any[]>([]);
const paymentMethods = ref<any[]>([]);
const users = ref<any[]>([]);

// Settings
const generalSettings = ref({
  companyName: 'My Business',
  currency: 'USD',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  language: 'en',
});

const businessSettings = ref({
  businessName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxNumber: '',
});

// Tabs
const tabs = [
  { id: 'general', name: 'General' },
  { id: 'business', name: 'Business' },
  { id: 'tax', name: 'Tax & Payments' },
  { id: 'users', name: 'Users' },
  { id: 'backup', name: 'Backup & Export' },
];

// Table columns
const userColumns: TableColumn[] = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'role', title: 'Role', sortable: false },
  { key: 'createdAt', title: 'Created', sortable: true, format: 'date' },
];

// Form fields
const generalFields: FormField[] = [
  {
    name: 'companyName',
    type: 'text',
    label: 'Company Name',
    required: true,
    validation: { required: true },
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
  {
    name: 'timezone',
    type: 'select',
    label: 'Timezone',
    options: [
      { label: 'UTC', value: 'UTC' },
      { label: 'America/New_York', value: 'America/New_York' },
      { label: 'Europe/London', value: 'Europe/London' },
      { label: 'Asia/Kolkata', value: 'Asia/Kolkata' },
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
];

const businessFields: FormField[] = [
  {
    name: 'businessName',
    type: 'text',
    label: 'Business Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'address',
    type: 'textarea',
    label: 'Address',
    rows: 3,
  },
  {
    name: 'phone',
    type: 'tel',
    label: 'Phone',
    validation: { phone: true },
  },
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    validation: { email: true },
  },
  {
    name: 'website',
    type: 'url',
    label: 'Website',
    validation: { url: true },
  },
  {
    name: 'taxNumber',
    type: 'text',
    label: 'Tax Number',
  },
];

const taxRateFields: FormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Tax Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'rate',
    type: 'number',
    label: 'Tax Rate (%)',
    required: true,
    validation: { required: true, min: 0, max: 100 },
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    rows: 2,
  },
];

const paymentMethodFields: FormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Payment Method Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'description',
    type: 'textarea',
    label: 'Description',
    rows: 2,
  },
];

const userFields: FormField[] = [
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

// Methods
const loadTaxRates = async () => {
  try {
    const result = await taxRateService.findAll({ limit: 100 });
    taxRates.value = result.data;
  } catch (error) {
    console.error('Error loading tax rates:', error);
  }
};

const loadPaymentMethods = async () => {
  try {
    const result = await paymentMethodService.findAll({ limit: 100 });
    paymentMethods.value = result.data;
  } catch (error) {
    console.error('Error loading payment methods:', error);
  }
};

const loadUsers = async () => {
  try {
    const result = await userService.findAll({ limit: 100 });
    users.value = result.data;
  } catch (error) {
    console.error('Error loading users:', error);
  }
};

const saveGeneralSettings = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await settingService.updateMultipleSettings(formData);
    generalSettings.value = { ...formData };
  } catch (error) {
    console.error('Error saving general settings:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const saveBusinessSettings = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await settingService.updateMultipleSettings(formData);
    businessSettings.value = { ...formData };
  } catch (error) {
    console.error('Error saving business settings:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const saveTaxRate = async (formData: any) => {
  try {
    isSubmitting.value = true;
    if (editingTaxRate.value) {
      await taxRateService.update(editingTaxRate.value.id, formData);
    } else {
      await taxRateService.create(formData);
    }
    closeTaxRateModal();
    loadTaxRates();
  } catch (error) {
    console.error('Error saving tax rate:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const savePaymentMethod = async (formData: any) => {
  try {
    isSubmitting.value = true;
    if (editingPaymentMethod.value) {
      await paymentMethodService.update(editingPaymentMethod.value.id, formData);
    } else {
      await paymentMethodService.create(formData);
    }
    closePaymentMethodModal();
    loadPaymentMethods();
  } catch (error) {
    console.error('Error saving payment method:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const saveUser = async (formData: any) => {
  try {
    isSubmitting.value = true;
    if (editingUser.value) {
      await userService.update(editingUser.value.id, formData);
    } else {
      await userService.create(formData);
    }
    closeUserModal();
    loadUsers();
  } catch (error) {
    console.error('Error saving user:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const editTaxRate = (taxRate: any) => {
  editingTaxRate.value = taxRate;
  showTaxRateModal.value = true;
};

const editPaymentMethod = (method: any) => {
  editingPaymentMethod.value = method;
  showPaymentMethodModal.value = true;
};

const editUser = (user: any) => {
  editingUser.value = user;
  showUserModal.value = true;
};

const deleteTaxRate = async (id: string) => {
  if (confirm('Are you sure you want to delete this tax rate?')) {
    try {
      await taxRateService.delete(id);
      loadTaxRates();
    } catch (error) {
      console.error('Error deleting tax rate:', error);
    }
  }
};

const deletePaymentMethod = async (id: number) => {
  if (confirm('Are you sure you want to delete this payment method?')) {
    try {
      await paymentMethodService.delete(id.toString());
      loadPaymentMethods();
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  }
};

const deleteUser = async (id: string) => {
  if (confirm('Are you sure you want to delete this user?')) {
    try {
      await userService.delete(id);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }
};

const closeTaxRateModal = () => {
  showTaxRateModal.value = false;
  editingTaxRate.value = null;
};

const closePaymentMethodModal = () => {
  showPaymentMethodModal.value = false;
  editingPaymentMethod.value = null;
};

const closeUserModal = () => {
  showUserModal.value = false;
  editingUser.value = null;
};

const createBackup = async () => {
  try {
    isCreatingBackup.value = true;
    // Simulate backup creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {
        settings: generalSettings.value,
        business: businessSettings.value,
        taxRates: taxRates.value,
        paymentMethods: paymentMethods.value,
        users: users.value.map(u => ({ ...u, password: undefined })),
      },
    };

    await ExportUtility.export({
      data: [[JSON.stringify(backupData, null, 2)]],
      format: 'json',
      filename: `backup-${new Date().toISOString().split('T')[0]}`,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
  } finally {
    isCreatingBackup.value = false;
  }
};

const exportAllData = async () => {
  await createBackup();
};

const exportProducts = async () => {
  // Implementation would export products data
  console.log('Export products');
};

const exportCustomers = async () => {
  // Implementation would export customers data
  console.log('Export customers');
};

const exportSales = async () => {
  // Implementation would export sales data
  console.log('Export sales');
};

onMounted(() => {
  loadTaxRates();
  loadPaymentMethods();
  loadUsers();
});
</script>