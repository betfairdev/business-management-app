import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue'),
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
      component: () => import('../views/products/ProductsView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'products', action: 'read' }
      }
    },
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/customers/CustomersView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'customers', action: 'read' }
      }
    },
    {
      path: '/sales',
      name: 'sales',
      component: () => import('../views/sales/SalesView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'sales', action: 'read' }
      }
    },
    {
      path: '/purchases',
      name: 'purchases',
      component: () => import('../views/purchases/PurchasesView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'purchases', action: 'read' }
      }
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: () => import('../views/inventory/InventoryView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'inventory', action: 'read' }
      }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/reports/ReportsView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'reports', action: 'read' }
      }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/settings/SettingsView.vue'),
      meta: {
        requiresAuth: true,
        permission: { module: 'settings', action: 'read' }
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue')
    }
  ],
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check permissions
  if (to.meta.permission && authStore.isAuthenticated) {
    const { module, action } = to.meta.permission as { module: string; action: string }
    if (!authStore.hasPermission(module, action)) {
      // Redirect to dashboard or show unauthorized page
      next('/')
      return
    }
  }

  // Redirect to dashboard if already authenticated and trying to access login
  if (to.name === 'login' && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router