<template>
  <div id="app">
    <!-- Show header and footer only for authenticated users -->
    <Header v-if="isAuthenticated" />
    <!-- Show router view for non-authenticated users (login page) -->
    <RouterView />
    <Footer v-if="isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import Header from './components/layout/Header.vue'
import Footer from './components/layout/footer.vue'
import { useAuthStore } from './stores/authStore'

const isAuthenticated = useAuthStore().isAuthenticated
</script>
