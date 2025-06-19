import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import CSS
import './assets/main.css'

// Import reflection metadata for decorators
import 'reflect-metadata'

// Initialize database
import { AppDataSource, initializeDatabase } from './config/database'

// Initialize stores
import { useAuthStore } from './stores/authStore'
import { useAppStore } from './stores/appStore'
import { runSeeds } from './seeds/seed'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize app
async function initializeApp() {
  try {
    // Initialize database
    await initializeDatabase()
    console.log('✅ Database initialized successfully')
    if (!AppDataSource) {
      throw new Error('AppDataSource is not initialized');
    }

    // Wait for 3 seconds before running seeds
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Run seeds after database is initialized
    await runSeeds(AppDataSource) // Ensure this function is defined in your seeds file
    console.log('✅ Seeds executed successfully')

    // Initialize stores
    const authStore = useAuthStore()
    const appStore = useAppStore()

    // Initialize auth from localStorage
    await authStore.initializeAuth()

    // Initialize app settings
    appStore.initializeSettings()

    console.log('✅ App initialized successfully')
  } catch (error) {
    console.error('❌ Failed to initialize app:', error)
  }
}

// Mount app
initializeApp().then(() => {
  app.mount('#app')
})
