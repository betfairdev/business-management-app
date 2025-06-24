import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserService } from '../services/UserService';
import { SubscriptionService } from '../services/subscription/SubscriptionService';
import { FeatureService } from '../services/feature/FeatureService';
import { AccessControlUtility } from '../utils/accessControlUtility';
import type { User } from '../entities/User';
import type { LoginDto } from '../dtos/LoginDto';
import type { SubscriptionPlan } from '../entities/Subscription';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const userPlan = ref<SubscriptionPlan | null>(null);
  const planFeatures = ref<Record<string, any>>({});

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userPermissions = computed(() => {
    if (!user.value?.role?.permissions) return [];
    // Ensure permissions are always an array of {module, action, isAllowed}
    return Array.isArray(user.value.role.permissions)
      ? user.value.role.permissions.map(p => ({
        module: p.module,
        action: p.action,
        isAllowed: p.isAllowed,
      }))
      : [];
  });

  // Actions
  const login = async (credentials: LoginDto): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const userService = new UserService();
      // Always fetch with role and permissions
      const authenticatedUser = await userService.login(credentials);

      if (authenticatedUser) {
        user.value = authenticatedUser;

        // Load user subscription and features
        await loadUserSubscriptionData();

        // Set user permissions for access control
        if (authenticatedUser.role?.permissions) {
          const plainPermissions = Array.isArray(authenticatedUser.role.permissions)
            ? authenticatedUser.role.permissions.map(p => ({
              module: p.module,
              action: p.action,
              isAllowed: p.isAllowed,
            }))
            : [];
          AccessControlUtility.setUserPermissions({
            userId: authenticatedUser.id,
            roleId: authenticatedUser.role.id,
            permissions: plainPermissions,
          });
        }

        localStorage.setItem('user', JSON.stringify(authenticatedUser));
        return true;
      } else {
        error.value = 'Invalid email or password';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = () => {
    user.value = null;
    userPlan.value = null;
    planFeatures.value = {};
    error.value = null;
    AccessControlUtility.clearPermissions();
    localStorage.removeItem('user');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('planFeatures');
  };

  const initializeAuth = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // If permissions missing, fetch user from API
        if (!parsedUser.role?.permissions) {
          const userService = new UserService();
          const freshUser = await userService.getUserWithPermissions(parsedUser.id);
          if (freshUser) {
            user.value = freshUser;
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } else {
          user.value = parsedUser;
        }

        // Load subscription data
        await loadUserSubscriptionData();

        // Restore permissions
        const perms = user.value?.role?.permissions || [];
        const plainPermissions = Array.isArray(perms)
          ? perms.map((p: any) => ({
            module: p.module,
            action: p.action,
            isAllowed: p.isAllowed,
          }))
          : [];
        AccessControlUtility.setUserPermissions({
          userId: user.value.id,
          roleId: user.value.role?.id,
          permissions: plainPermissions,
        });
      } catch (err) {
        console.error('Failed to parse stored user:', err);
        localStorage.removeItem('user');
      }
    }
  };

  const loadUserSubscriptionData = async () => {
    if (!user.value) return;

    try {
      const subscriptionService = new SubscriptionService();
      const featureService = new FeatureService();

      // Get user subscription
      const subscriptionInfo = await subscriptionService.getUserSubscription(user.value.id);
      
      if (subscriptionInfo) {
        userPlan.value = subscriptionInfo.subscription.plan;
        planFeatures.value = subscriptionInfo.features;
      } else {
        // Default to free plan
        userPlan.value = 'free' as SubscriptionPlan;
        planFeatures.value = await featureService.getPlanFeatures('free' as SubscriptionPlan);
      }

      // Set plan features for access control
      AccessControlUtility.setUserPlan(userPlan.value, planFeatures.value);

      // Cache subscription data
      localStorage.setItem('userPlan', userPlan.value);
      localStorage.setItem('planFeatures', JSON.stringify(planFeatures.value));
    } catch (err) {
      console.error('Failed to load subscription data:', err);
      // Default to free plan on error
      userPlan.value = 'free' as SubscriptionPlan;
      planFeatures.value = {};
    }
  };

  const updateUser = (updatedUser: User) => {
    user.value = updatedUser;
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const hasPermission = (module: string, action: string): boolean => {
    return AccessControlUtility.hasPermission(module, action);
  };

  const hasModuleAccess = (module: string): boolean => {
    return AccessControlUtility.hasModuleAccess(module);
  };

  const hasFeatureAccess = (featureKey: string): boolean => {
    return AccessControlUtility.hasFeatureAccess(featureKey);
  };

  const hasFullAccess = (module: string, action: string, featureKey?: string): boolean => {
    return AccessControlUtility.hasFullAccess(module, action, featureKey);
  };

  const getFeatureLimit = (featureKey: string): number | undefined => {
    return AccessControlUtility.getFeatureLimit(featureKey);
  };

  const isWithinFeatureLimit = (featureKey: string, currentUsage: number): boolean => {
    return AccessControlUtility.isWithinFeatureLimit(featureKey, currentUsage);
  };

  const getRemainingFeatureUsage = (featureKey: string, currentUsage: number): number => {
    return AccessControlUtility.getRemainingFeatureUsage(featureKey, currentUsage);
  };

  const clearError = () => {
    error.value = null;
  };

  const refreshSubscription = async () => {
    await loadUserSubscriptionData();
  };

  return {
    // State
    user,
    isLoading,
    error,
    userPlan,
    planFeatures,

    // Getters
    isAuthenticated,
    userPermissions,

    // Actions
    login,
    logout,
    initializeAuth,
    updateUser,
    hasPermission,
    hasModuleAccess,
    hasFeatureAccess,
    hasFullAccess,
    getFeatureLimit,
    isWithinFeatureLimit,
    getRemainingFeatureUsage,
    clearError,
    refreshSubscription,
  };
});