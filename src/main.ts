import './assets/main.css'
import 'flowbite'

import { initializeDatabase } from './config/database';
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

initializeDatabase()
  .then(() => {
    app.mount('#app')
  })
  .catch(console.error);


