import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import CSS
import './assets/main.css'

// Import reflection metadata for decorators
import 'reflect-metadata'

// Initialize database
import { initializeDatabase } from './config/database'

// Initialize stores
import { useAuthStore } from './stores/authStore'
import { useAppStore } from './stores/appStore'

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