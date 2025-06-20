<template>
  <div id="app">
    <!-- Splash Screen -->
    <SplashScreen v-if="showSplash" />
    
    <!-- Setup Wizard -->
    <SetupWizard v-else-if="showSetup" />
    
    <!-- Main App -->
    <div v-else>
      <!-- Show header and footer only for authenticated users -->
      <Header v-if="isAuthenticated" />
      
      <!-- Main Content with bottom padding for mobile nav -->
      <main :class="{ 'pb-16 md:pb-0': isAuthenticated }">
        <RouterView />
      </main>
      
      <!-- Desktop Footer -->
      <Footer v-if="isAuthenticated" class="hidden md:block" />
      
      <!-- Mobile Bottom Navigation -->
      <BottomNavigation v-if="isAuthenticated" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { RouterView } from 'vue-router';
import Header from './components/layout/Header.vue';
import Footer from './components/layout/footer.vue';
import BottomNavigation from './components/layout/BottomNavigation.vue';
import SplashScreen from './components/layout/SplashScreen.vue';
import SetupWizard from './components/setup/SetupWizard.vue';
import { useAuthStore } from './stores/authStore';
import { useAppStore } from './stores/appStore';
import { SettingService } from './services/SettingService';
import { NotificationService } from './services/NotificationService';

const authStore = useAuthStore();
const appStore = useAppStore();
const settingService = new SettingService();
const notificationService = new NotificationService();

const showSplash = ref(true);
const showSetup = ref(false);

const isAuthenticated = computed(() => authStore.isAuthenticated);

onMounted(async () => {
  // Show splash for 2 seconds
  setTimeout(async () => {
    showSplash.value = false;
    
    // Check if setup is complete
    const setupComplete = await settingService.getSettingValue('setup_complete');
    if (!setupComplete) {
      showSetup.value = true;
    } else {
      // Initialize app normally
      await initializeApp();
    }
  }, 2000);
});

const initializeApp = async () => {
  try {
    // Initialize auth from localStorage
    await authStore.initializeAuth();
    
    // Initialize app settings
    appStore.initializeSettings();
    
    // Initialize notifications
    await notificationService.initialize();
    
    console.log('✅ App initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize app:', error);
  }
};
</script>