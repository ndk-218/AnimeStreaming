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
       * Check if user is premium
       */
      isPremium: () => {
        const { user } = get();
        if (!user || !user.isPremium) return false;
        
        // Check if premium expired
        if (user.premiumExpiry) {
          const expiryDate = new Date(user.premiumExpiry);
          const now = new Date();
          return now < expiryDate;
        }
        
        return false;
      },

      /**
       * Get user tier (anonymous, regular, premium)
       */
      getUserTier: () => {
        const { isAuthenticated, user } = get();
        const isPremium = get().isPremium();
        
        if (!isAuthenticated) return 'anonymous';
        if (isPremium) return 'premium';
        return 'regular';
      },

      /**
       * Get max video quality based on user tier
       */
      getMaxQuality: () => {
        const tier = get().getUserTier();
        
        switch (tier) {
          case 'anonymous':
            return '480p';
          case 'regular':
            return '720p';
          case 'premium':
            return '1080p';
          default:
            return '480p';
        }
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
