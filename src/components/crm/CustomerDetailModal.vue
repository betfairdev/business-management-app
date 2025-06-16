<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b">
        <div>
          <h3 class="text-xl font-semibold text-gray-900">{{ customer.name }}</h3>
          <p class="text-gray-600">{{ customer.email }}</p>
        </div>
        <div class="flex items-center space-x-2">
          <button
            @click="$emit('edit', customer)"
            class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <i class="fas fa-edit mr-2"></i>
            Edit
          </button>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex h-[calc(90vh-80px)]">
        <!-- Sidebar -->
        <div class="w-1/3 border-r bg-gray-50 p-6 overflow-y-auto">
          <div class="space-y-6">
            <!-- Customer Info -->
            <div>
              <h4 class="text-lg font-medium text-gray-900 mb-3">Customer Information</h4>
              <div class="space-y-2 text-sm">
                <div>
                  <span class="font-medium text-gray-600">Type:</span>
                  <span class="ml-2">{{ customer.customerType }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Phone:</span>
                  <span class="ml-2">{{ customer.phone || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">WhatsApp:</span>
                  <span class="ml-2">{{ customer.whatsapp || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Company:</span>
                  <span class="ml-2">{{ customer.companyName || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Tax ID:</span>
                  <span class="ml-2">{{ customer.taxId || 'N/A' }}</span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Status:</span>
                  <span
                    :class="customer.status === 'Active' ? 'text-green-600' : 'text-red-600'"
                    class="ml-2 font-medium"
                  >
                    {{ customer.status }}
                  </span>
                </div>
                <div>
                  <span class="font-medium text-gray-600">Created:</span>
                  <span class="ml-2">{{ formatDate(customer.createdAt) }}</span>
                </div>
              </div>
            </div>

            <!-- Address -->
            <div v-if="customer.address">
              <h4 class="text-lg font-medium text-gray-900 mb-3">Address</h4>
              <p class="text-sm text-gray-600">{{ customer.address }}</p>
            </div>

            <!-- Quick Stats -->
            <div>
              <h4 class="text-lg font-medium text-gray-900 mb-3">Quick Stats</h4>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Orders:</span>
                  <span class="font-medium">{{ customerStats.totalOrders }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Total Spent:</span>
                  <span class="font-medium">${{ formatCurrency(customerStats.totalSpent) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Avg Order Value:</span>
                  <span class="font-medium">${{ formatCurrency(customerStats.avgOrderValue) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Last Order:</span>
                  <span class="font-medium">{{ formatDate(customerStats.lastOrderDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 p-6 overflow-y-auto">
          <!-- Tabs -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8">
              <button
                v-for="tab in tabs"
                :key="tab.key"
                @click="activeTab = tab.key"
                :class="activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                class="whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div v-if="activeTab === 'activity'">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
            <div class="space-y-4">
              <div
                v-for="activity in customerActivity"
                :key="activity.id"
                class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div class="flex-shrink-0">
                  <div
                    :class="getActivityIconClass(activity.type)"
                    class="w-8 h-8 rounded-full flex items-center justify-center"
                  >
                    <i :class="getActivityIcon(activity.type)" class="text-sm"></i>
                  </div>
                </div>
                <div class="flex-1">
                  <p class="text-sm text-gray-900">{{ activity.description }}</p>
                  <p class="text-xs text-gray-500">{{ formatDate(activity.date) }}</p>
                </div>
                <div v-if="activity.amount" class="text-sm font-medium text-gray-900">
                  ${{ formatCurrency(activity.amount) }}
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="activeTab === 'orders'">
            <h4 class="text-lg font-medium text-gray-900 mb-4">Order History</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="order in customerOrders" :key="order.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {{ order.invoiceNumber }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {{ formatDate(order.saleDate) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        :class="getStatusClass(order.status)"
                        class="px-2 py-1 rounded-full text-xs font-medium"
                      >
                        {{ order.status }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${{ formatCurrency(order.totalAmount) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="activeTab === 'notes'">
            <div class="flex justify-between items-center mb-4">
              <h4 class="text-lg font-medium text-gray-900">Notes</h4>
              <button
                @click="showAddNote = true"
                class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <i class="fas fa-plus mr-2"></i>
                Add Note
              </button>
            </div>

            <!-- Add Note Form -->
            <div v-if="showAddNote" class="mb-4 p-4 bg-gray-50 rounded-lg">
              <textarea
                v-model="newNote"
                placeholder="Add a note..."
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
              <div class="flex justify-end space-x-2 mt-2">
                <button
                  @click="showAddNote = false; newNote = ''"
                  class="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  @click="addNote"
                  class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Save Note
                </button>
              </div>
            </div>

            <!-- Notes List -->
            <div class="space-y-3">
              <div
                v-for="note in customerNotes"
                :key="note.id"
                class="p-3 bg-white border border-gray-200 rounded-lg"
              >
                <p class="text-sm text-gray-900">{{ note.content }}</p>
                <p class="text-xs text-gray-500 mt-2">
                  {{ formatDate(note.createdAt) }} by {{ note.createdBy }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { crmService } from '../../services/crmService';
import { DateTimeUtil } from '../../utils/dateTime';

const props = defineProps<{
  customer: any;
}>();

const emit = defineEmits<{
  close: [];
  edit: [customer: any];
}>();

const activeTab = ref('activity');
const showAddNote = ref(false);
const newNote = ref('');
const customerActivity = ref([]);
const customerOrders = ref([]);
const customerNotes = ref([]);
const customerStats = ref({
  totalOrders: 0,
  totalSpent: 0,
  avgOrderValue: 0,
  lastOrderDate: null,
});

const tabs = [
  { key: 'activity', label: 'Activity' },
  { key: 'orders', label: 'Orders' },
  { key: 'notes', label: 'Notes' },
];

const loadCustomerData = async () => {
  try {
    // Load activity
    const activityResponse = await crmService.getCustomerActivity(props.customer.id);
    if (activityResponse.success) {
      customerActivity.value = activityResponse.data || [];
    }

    // Load orders
    const ordersResponse = await crmService.getCustomerSales(props.customer.id);
    if (ordersResponse.success) {
      customerOrders.value = ordersResponse.data || [];
      
      // Calculate stats
      const orders = ordersResponse.data || [];
      customerStats.value = {
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0),
        avgOrderValue: orders.length > 0 ? orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0) / orders.length : 0,
        lastOrderDate: orders.length > 0 ? orders[0].saleDate : null,
      };
    }
  } catch (error) {
    console.error('Failed to load customer data:', error);
  }
};

const addNote = async () => {
  if (!newNote.value.trim()) return;
  
  try {
    const response = await crmService.addCustomerNote(props.customer.id, newNote.value);
    if (response.success) {
      customerNotes.value.unshift({
        id: Date.now(),
        content: newNote.value,
        createdAt: new Date().toISOString(),
        createdBy: 'Current User', // Replace with actual user
      });
      newNote.value = '';
      showAddNote.value = false;
    }
  } catch (error) {
    console.error('Failed to add note:', error);
  }
};

const formatDate = (date: string) => {
  if (!date) return 'N/A';
  return DateTimeUtil.format(date, 'MMM dd, yyyy');
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const getActivityIconClass = (type: string) => {
  const classes: Record<string, string> = {
    sale: 'bg-green-100 text-green-600',
    return: 'bg-red-100 text-red-600',
    contact: 'bg-blue-100 text-blue-600',
    note: 'bg-yellow-100 text-yellow-600',
  };
  return classes[type] || 'bg-gray-100 text-gray-600';
};

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    sale: 'fas fa-shopping-cart',
    return: 'fas fa-undo',
    contact: 'fas fa-phone',
    note: 'fas fa-sticky-note',
  };
  return icons[type] || 'fas fa-circle';
};

const getStatusClass = (status: string) => {
  const statusClasses: Record<string, string> = {
    Paid: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Cancelled: 'bg-red-100 text-red-800',
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
};

onMounted(() => {
  loadCustomerData();
});
</script>