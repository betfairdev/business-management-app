<template>
  <div id="app">
    <!-- Show router view for non-authenticated users (login page) -->
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>
