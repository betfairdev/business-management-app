<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Email Management</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage your business email communications
        </p>
      </div>
      <div class="mt-4 sm:mt-0 flex space-x-3">
        <BaseButton variant="secondary" @click="showAccountModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </template>
          Add Account
        </BaseButton>
        <BaseButton @click="showComposeModal = true">
          <template #icon-left>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </template>
          Compose Email
        </BaseButton>
      </div>
    </div>

    <!-- Email Accounts -->
    <BaseCard title="Email Accounts" variant="bordered" padding="lg">
      <div class="space-y-4">
        <div v-for="account in accounts" :key="account.id" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center">
            <div class="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="font-medium text-gray-900 dark:text-white">{{ account.email }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ account.provider }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span v-if="account.isDefault" class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Default
            </span>
            <BaseButton size="sm" variant="danger" @click="removeAccount(account.id)">
              Remove
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Email Templates -->
    <BaseCard title="Email Templates" variant="bordered" padding="lg">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Email Templates</h3>
          <BaseButton size="sm" @click="showTemplateModal = true">
            <template #icon-left>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </template>
            New Template
          </BaseButton>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="template in templates" :key="template.id" class="border rounded-lg p-4">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">{{ template.name }}</h4>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">{{ template.subject }}</p>
          <div class="flex space-x-2">
            <BaseButton size="sm" variant="secondary" @click="useTemplate(template)">
              Use
            </BaseButton>
            <BaseButton size="sm" variant="secondary" @click="editTemplate(template)">
              Edit
            </BaseButton>
          </div>
        </div>
      </div>
    </BaseCard>

    <!-- Recent Emails -->
    <BaseCard title="Recent Emails" variant="bordered" padding="lg">
      <div class="space-y-4">
        <div v-for="email in emails" :key="email.id" class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ email.subject }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">To: {{ email.to.join(', ') }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(email.createdAt) }}</p>
          </div>
          <span :class="getStatusClass(email.status)" class="px-2 py-1 text-xs font-medium rounded-full">
            {{ email.status }}
          </span>
        </div>
      </div>
    </BaseCard>

    <!-- Compose Email Modal -->
    <BaseModal v-model="showComposeModal" title="Compose Email" size="lg">
      <FormBuilder
        :fields="composeFields"
        :loading="isSubmitting"
        submit-text="Send Email"
        show-cancel
        @submit="sendEmail"
        @cancel="showComposeModal = false"
      />
    </BaseModal>

    <!-- Add Account Modal -->
    <BaseModal v-model="showAccountModal" title="Add Email Account" size="md">
      <FormBuilder
        :fields="accountFields"
        :loading="isSubmitting"
        submit-text="Add Account"
        show-cancel
        @submit="addAccount"
        @cancel="showAccountModal = false"
      />
    </BaseModal>

    <!-- Template Modal -->
    <BaseModal v-model="showTemplateModal" title="Create Template" size="lg">
      <FormBuilder
        :fields="templateFields"
        :loading="isSubmitting"
        submit-text="Save Template"
        show-cancel
        @submit="saveTemplate"
        @cancel="showTemplateModal = false"
      />
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseCard from '../../components/ui/BaseCard.vue';
import BaseButton from '../../components/ui/BaseButton.vue';
import BaseModal from '../../components/ui/BaseModal.vue';
import FormBuilder, { type FormField } from '../../components/common/FormBuilder.vue';
import { EmailService, type EmailAccount, type EmailTemplate, type Email } from '../../services/EmailService';
import { FormatUtility } from '../../utils/formatUtility';

const emailService = new EmailService();

const showComposeModal = ref(false);
const showAccountModal = ref(false);
const showTemplateModal = ref(false);
const isSubmitting = ref(false);

const accounts = ref<EmailAccount[]>([]);
const templates = ref<EmailTemplate[]>([]);
const emails = ref<Email[]>([]);

const composeFields: FormField[] = [
  {
    name: 'to',
    type: 'text',
    label: 'To',
    required: true,
    validation: { required: true },
    hint: 'Separate multiple emails with commas',
  },
  {
    name: 'subject',
    type: 'text',
    label: 'Subject',
    required: true,
    validation: { required: true },
  },
  {
    name: 'body',
    type: 'textarea',
    label: 'Message',
    required: true,
    rows: 10,
    validation: { required: true },
  },
];

const accountFields: FormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email Address',
    required: true,
    validation: { required: true, email: true },
  },
  {
    name: 'provider',
    type: 'select',
    label: 'Provider',
    required: true,
    options: [
      { label: 'Gmail', value: 'gmail' },
      { label: 'Outlook', value: 'outlook' },
      { label: 'Custom SMTP', value: 'smtp' },
    ],
  },
  {
    name: 'isDefault',
    type: 'checkbox',
    label: 'Set as default account',
  },
];

const templateFields: FormField[] = [
  {
    name: 'name',
    type: 'text',
    label: 'Template Name',
    required: true,
    validation: { required: true },
  },
  {
    name: 'subject',
    type: 'text',
    label: 'Subject',
    required: true,
    validation: { required: true },
  },
  {
    name: 'body',
    type: 'textarea',
    label: 'Template Body',
    required: true,
    rows: 10,
    validation: { required: true },
    hint: 'Use {{variable}} for dynamic content',
  },
];

const formatDate = (date: Date): string => {
  return FormatUtility.dateTime(date);
};

const getStatusClass = (status: string): string => {
  const classes = {
    'sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'draft': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const sendEmail = async (formData: any) => {
  try {
    isSubmitting.value = true;
    const toEmails = formData.to.split(',').map((email: string) => email.trim());
    
    await emailService.sendEmail({
      from: 'business@example.com',
      to: toEmails,
      subject: formData.subject,
      body: formData.body,
      isHtml: false,
    });
    
    showComposeModal.value = false;
    loadEmails();
  } catch (error) {
    console.error('Error sending email:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const addAccount = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await emailService.addAccount(formData);
    showAccountModal.value = false;
    loadAccounts();
  } catch (error) {
    console.error('Error adding account:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const saveTemplate = async (formData: any) => {
  try {
    isSubmitting.value = true;
    await emailService.createTemplate({
      ...formData,
      variables: [], // Extract variables from template body
    });
    showTemplateModal.value = false;
    loadTemplates();
  } catch (error) {
    console.error('Error saving template:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const removeAccount = async (id: string) => {
  if (confirm('Are you sure you want to remove this account?')) {
    await emailService.removeAccount(id);
    loadAccounts();
  }
};

const useTemplate = (template: EmailTemplate) => {
  // Pre-fill compose form with template
  showComposeModal.value = true;
};

const editTemplate = (template: EmailTemplate) => {
  // Edit template
  showTemplateModal.value = true;
};

const loadAccounts = async () => {
  accounts.value = await emailService.getAccounts();
};

const loadTemplates = async () => {
  templates.value = await emailService.getTemplates();
};

const loadEmails = async () => {
  emails.value = await emailService.getEmails();
};

onMounted(() => {
  loadAccounts();
  loadTemplates();
  loadEmails();
});
</script>