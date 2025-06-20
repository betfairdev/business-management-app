import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { UserService } from '../services/UserService';
import { AccessControlUtility } from '../utils/accessControlUtility';
import type { User } from '../entities/User';
import type { LoginDto } from '../dtos/LoginDto';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

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
    error.value = null;
    AccessControlUtility.clearPermissions();
    localStorage.removeItem('user');
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

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    user,
    isLoading,
    error,

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
    clearError,
  };
});
