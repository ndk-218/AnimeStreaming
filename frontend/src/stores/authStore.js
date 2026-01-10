import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * User Authentication Store
 * Quản lý user state, tokens, và authentication status
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ===== STATE =====
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // ===== ACTIONS =====
      
      /**
       * Set user data after login/register
       */
      setUser: (userData) => {
        set({ 
          user: userData,
          isAuthenticated: true 
        });
      },

      /**
       * Set tokens
       */
      setTokens: (accessToken, refreshToken) => {
        set({ 
          accessToken,
          refreshToken 
        });
      },

      /**
       * Update user profile
       */
      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }));
      },

      /**
       * Login action
       */
      login: (userData, accessToken, refreshToken) => {
        set({
          user: userData,
          accessToken,
          refreshToken,
          isAuthenticated: true
        });
      },

      /**
       * Logout action
       */
      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false
        });
      },

      /**
       * Set loading state
       */
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      /**
       * Get user tier (anonymous or registered)
       */
      getUserTier: () => {
        const { isAuthenticated } = get();
        return isAuthenticated ? 'registered' : 'anonymous';
      },

      /**
       * Get max video quality based on user tier
       */
      getMaxQuality: () => {
        const tier = get().getUserTier();
        // Anonymous: 720p, Registered: 1080p
        return tier === 'registered' ? '1080p' : '720p';
      }
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
