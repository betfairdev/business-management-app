// src/main.ts

import 'reflect-metadata'  // required by TypeORM per official docs :contentReference[oaicite:0]{index=0}
import './assets/main.css'
import 'flowbite'

import { initializeDatabase } from './config/database'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Extend the Window interface to include custom properties
declare global {
  interface Window {
    initSqlJs?: unknown
    SQLITE_WASM_PATH?: string
  }
}

async function bootstrap() {
  // Preload sql.js init function in web, so TypeORM's sqljs driver can use it :contentReference[oaicite:1]{index=1}
  if (typeof window !== 'undefined') {
    try {
      const initSqlJsModule = await import('sql.js')
      const initSqlJs = initSqlJsModule.default || initSqlJsModule
      // Attach to window so TypeORM’s sqljs driver finds it
      window.initSqlJs = initSqlJs

      // Ensure the WASM path is correct: copy sql-wasm.wasm into public/ so it's served at '/sql-wasm.wasm'
      // Adjust if your public folder serves from a different base path.
      window.SQLITE_WASM_PATH = '/sql-wasm.wasm'

      console.log('✅ sql.js preloaded; WINDOW.SQLITE_WASM_PATH=', window.SQLITE_WASM_PATH)
    } catch (err) {
      console.warn('⚠️ Could not preload sql.js; TypeORM driver may load lazily. Error:', err)
    }
  }

  try {
    // Initialize database (will choose sqljs on web, Capacitor SQLite on native)
    await initializeDatabase()
    console.log('✅ Database initialized')
  } catch (e) {
    console.error('❌ BOOTSTRAP ERROR during database initialization', e)
    // You can show a user alert or retry logic here
  }

  // Now mount the Vue app only after DB is ready
  const app = createApp(App)
    .use(createPinia())
    .use(router)

  await router.isReady()
  app.mount('#app')
}

bootstrap().catch(e => console.error('❌ BOOTSTRAP ERROR', e))
