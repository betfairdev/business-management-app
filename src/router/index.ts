import { createRouter, createWebHistory } from 'vue-router'

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
      path: '/communications',
      name: 'communications',
      children: [
        {
          path: 'email',
          name: 'email',
          component: () => import('../views/communications/EmailView.vue'),
          meta: {
            requiresAuth: true,
            permission: { module: 'communications', action: 'read' }
          }
        }
      ]
    },
    {
      path: '/premium',
      name: 'premium',
      component: () => import('../components/business/PremiumFeatures.vue'),
      meta: { requiresAuth: true }
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
let authInitialized = false;

router.beforeEach(async (to, from, next) => {
  // Import here to ensure Pinia is ready
  const { useAuthStore } = await import('../stores/authStore');
  const authStore = useAuthStore();

  // Ensure auth is initialized (load from localStorage if needed)
  if (!authInitialized) {
    await authStore.initializeAuth();
    authInitialized = true;
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Check permissions
  if (to.meta.permission && authStore.isAuthenticated) {
    const { module, action } = to.meta.permission as { module: string; action: string }
    // Debug log
    const perms = Array.isArray(authStore.user?.role?.permissions)
      ? authStore.user.role.permissions.map(p => ({ module: p.module, action: p.action, isAllowed: p.isAllowed }))
      : [];
    console.log('Checking permission:', module, action, 'User permissions:', perms);
    if (!authStore.hasPermission(module, action)) {
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
