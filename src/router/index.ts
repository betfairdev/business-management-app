import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/appStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/products',
      name: 'products',
      component: () => import('../views/ProductsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/SalesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/purchases',
      name: 'purchases',
      component: () => import('../views/PurchasesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/CustomersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/suppliers',
      name: 'suppliers',
      component: () => import('../views/SuppliersView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/InventoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
      meta: { requiresAuth: true }
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const appStore = useAppStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth !== false) {
    // Check if user is authenticated
    if (!appStore.isAuthenticated) {
      // Try to refresh authentication
      await appStore.checkAuth()
      
      if (!appStore.isAuthenticated) {
        next('/login')
        return
      }
    }
  }
  
  // If user is authenticated and trying to access login page, redirect to dashboard
  if (to.path === '/login' && appStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router