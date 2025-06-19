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
    return user.value.role.permissions;
  });

  // Actions
  const login = async (credentials: LoginDto): Promise<boolean> => {
    isLoading.value = true;
    error.value = null;

    try {
      const userService = new UserService();
      const authenticatedUser = await userService.login(credentials);

      if (authenticatedUser) {
        user.value = authenticatedUser;
        
        // Set user permissions for access control
        if (authenticatedUser.role?.permissions) {
          AccessControlUtility.setUserPermissions({
            userId: authenticatedUser.id,
            roleId: authenticatedUser.role.id,
            permissions: authenticatedUser.role.permissions.map(p => ({
              module: p.module,
              action: p.action,
              isAllowed: p.isAllowed,
            })),
          });
        }

        // Store in localStorage for persistence
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
        user.value = parsedUser;

        // Restore permissions
        if (parsedUser.role?.permissions) {
          AccessControlUtility.setUserPermissions({
            userId: parsedUser.id,
            roleId: parsedUser.role.id,
            permissions: parsedUser.role.permissions.map((p: any) => ({
              module: p.module,
              action: p.action,
              isAllowed: p.isAllowed,
            })),
          });
        }
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