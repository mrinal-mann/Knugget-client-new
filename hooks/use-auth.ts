// hooks/use-auth.ts - Authentication hooks

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/lib/auth'
import { apiClient } from '@/lib/api'
import { AuthState, User, LoginFormData, RegisterFormData } from '@/types'
import { toast } from 'react-hot-toast'

// Main auth hook
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
  })

  const queryClient = useQueryClient()

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((newAuthState) => {
      setAuthState(newAuthState)
      
      // Invalidate queries when auth state changes
      if (newAuthState.isAuthenticated !== authState.isAuthenticated) {
        queryClient.invalidateQueries()
      }
    })

    // Get initial auth state
    authService.getCurrentAuthState().then((initialState) => {
      setAuthState(initialState)
    })

    return unsubscribe
  }, [queryClient, authState.isAuthenticated])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const result = await authService.signIn(data.email, data.password)
      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Welcome back!')
      queryClient.invalidateQueries()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const result = await authService.signUp(data.email, data.password, data.name)
      if (!result.success) {
        throw new Error(result.error || 'Registration failed')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Account created successfully!')
      queryClient.invalidateQueries()
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.signOut()
    },
    onSuccess: () => {
      toast.success('Signed out successfully')
      queryClient.clear()
    },
    onError: (error: Error) => {
      toast.error('Logout failed')
      console.error('Logout error:', error)
    },
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await authService.resetPassword(email)
      if (!result.success) {
        throw new Error(result.error || 'Password reset failed')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Password reset email sent!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Password reset failed')
    },
  })

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await authService.updatePassword(password)
      if (!result.success) {
        throw new Error(result.error || 'Password update failed')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Password updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Password update failed')
    },
  })

  // Refresh token
  const refreshToken = useCallback(async () => {
    try {
      const success = await authService.refreshToken()
      if (!success) {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      toast.error('Session expired. Please log in again.')
    }
  }, [])

  return {
    // Auth state
    ...authState,
    
    // Actions
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    updatePassword: updatePasswordMutation.mutate,
    refreshToken,
    
    // Loading states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
  }
}

// User profile hook
export function useUser() {
  const { user, isAuthenticated } = useAuth()
  
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.getUserProfile()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user profile')
      }
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiClient.updateUserProfile(updates)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile')
      }
      return response.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'profile'], updatedUser)
      toast.success('Profile updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile')
    },
  })

  return {
    user: userProfile || user,
    isLoading,
    error,
    updateProfile: updateProfileMutation.mutate,
    isUpdatingProfile: updateProfileMutation.isPending,
  }
}

// User stats hook
export function useUserStats() {
  const { isAuthenticated } = useAuth()
  
  return useQuery({
    queryKey: ['user', 'stats'],
    queryFn: async () => {
      const response = await apiClient.getUserStats()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch user stats')
      }
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Credits management hook
export function useCredits() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const addCreditsMutation = useMutation({
    mutationFn: async (credits: number) => {
      const response = await apiClient.addCredits(credits)
      if (!response.success) {
        throw new Error(response.error || 'Failed to add credits')
      }
      return response.data
    },
    onSuccess: (data) => {
      // Update user stats and profile
      queryClient.invalidateQueries({ queryKey: ['user'] })
      if (data) {
        toast.success(`Added ${data.newBalance - (user?.credits || 0)} credits!`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add credits')
    },
  })

  const upgradePlanMutation = useMutation({
    mutationFn: async (plan: 'FREE' | 'PREMIUM') => {
      const response = await apiClient.upgradePlan(plan)
      if (!response.success) {
        throw new Error(response.error || 'Failed to upgrade plan')
      }
      return response.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'profile'], updatedUser)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      toast.success(`Upgraded to ${updatedUser?.plan} plan!`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upgrade plan')
    },
  })

  return {
    credits: user?.credits || 0,
    plan: user?.plan || 'FREE',
    addCredits: addCreditsMutation.mutate,
    upgradePlan: upgradePlanMutation.mutate,
    isAddingCredits: addCreditsMutation.isPending,
    isUpgradingPlan: upgradePlanMutation.isPending,
  }
}

// Session management hook
export function useSession() {
  const { isAuthenticated, isLoading, user, refreshToken } = useAuth()
  
  // Auto-refresh token before expiry
  useEffect(() => {
    if (!isAuthenticated || isLoading) return

    // Refresh token every 10 minutes
    const interval = setInterval(() => {
      refreshToken()
    }, 10 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, isLoading, refreshToken])

  // Check for session expiry
  useEffect(() => {
    if (!isAuthenticated || isLoading) return

    const checkExpiry = () => {
      const stored = localStorage.getItem('knugget_auth')
      if (stored) {
        try {
          const { expiresAt } = JSON.parse(stored)
          const now = Date.now()
          
          // If token expires in less than 5 minutes, refresh it
          if (expiresAt - now < 5 * 60 * 1000) {
            refreshToken()
          }
        } catch (error) {
          console.error('Error checking session expiry:', error)
        }
      }
    }

    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, isLoading, refreshToken])

  return {
    isAuthenticated,
    isLoading,
    user,
    refreshToken,
  }
}

// Auth guard hook for protected routes
export function useAuthGuard(redirectTo: string = '/auth/login') {
  const { isAuthenticated, isLoading } = useAuth()
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page
      window.location.href = redirectTo
    }
  }, [isAuthenticated, isLoading, redirectTo])

  return {
    isAuthenticated,
    isLoading,
    isAuthorized: isAuthenticated && !isLoading,
  }
}

export default useAuth