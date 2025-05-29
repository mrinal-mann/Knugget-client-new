/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { User, AuthState, AuthAction, AuthContextType, UpdateProfileRequest } from '@/types/auth'
import { authService } from '@/lib/auth-service'
import { formatError } from '@/lib/utils'
import { authSyncService } from '@/lib/auth-sync'

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
}

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      }
    case 'AUTH_UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      }
    default:
      return state
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        dispatch({ type: 'AUTH_START' })

        // Try to initialize from extension first, then localStorage
        const { user, isAuthenticated } = await authSyncService.initializeFromExtension()

        if (isAuthenticated && user) {
          dispatch({ type: 'AUTH_SUCCESS', payload: user })
        } else {
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        dispatch({ type: 'AUTH_LOGOUT' })
      }
    }

    initializeAuth()
  }, [])

  // Add this to listen for extension auth changes:
  useEffect(() => {
    const handleExtensionAuthChange = (event: CustomEvent) => {
      const { isAuthenticated, user } = event.detail

      if (isAuthenticated && user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: user })
      } else {
        dispatch({ type: 'AUTH_LOGOUT' })
      }
    }

    window.addEventListener('extensionAuthChange', handleExtensionAuthChange as EventListener)

    return () => {
      window.removeEventListener('extensionAuthChange', handleExtensionAuthChange as EventListener)
    }
  }, [])

  // Auto-refresh token
  useEffect(() => {
    if (!state.isAuthenticated) return

    const interval = setInterval(async () => {
      try {
        await authService.autoRefreshToken()
      } catch (error) {
        console.error('Failed to auto-refresh token:', error)
        dispatch({ type: 'AUTH_LOGOUT' })
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [state.isAuthenticated])

  async function login(email: string, password: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.login({ email, password })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })

        // Notify Chrome extension
        await authService.notifyExtensionAuthSuccess(response.data)

        // Redirect to dashboard or intended page
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl')
        router.push(returnUrl || '/dashboard')
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Login failed' })
        throw new Error(response.error || 'Login failed')
      }
    } catch (error) {
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      throw error
    }
  }

  async function signup(email: string, password: string, name?: string) {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.register({ email, password, name })

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })

        // Notify Chrome extension
        await authService.notifyExtensionAuthSuccess(response.data)

        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Signup failed' })
        throw new Error(response.error || 'Signup failed')
      }
    } catch (error) {
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      throw error
    }
  }

  async function logout() {
    try {
      dispatch({ type: 'AUTH_START' })

      // Call logout API
      await authService.logout()

      // Notify Chrome extension
      await authService.notifyExtensionLogout()

      dispatch({ type: 'AUTH_LOGOUT' })

      // Redirect to login page
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout locally even if API call fails
      dispatch({ type: 'AUTH_LOGOUT' })
      router.push('/auth/login')
    }
  }

  async function refreshAuth() {
    try {
      dispatch({ type: 'AUTH_START' })

      const response = await authService.refreshToken()

      if (response.success && response.data) {
        dispatch({ type: 'AUTH_SUCCESS', payload: response.data.user })
      } else {
        dispatch({ type: 'AUTH_LOGOUT' })
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Failed to refresh auth:', error)
      dispatch({ type: 'AUTH_LOGOUT' })
      router.push('/auth/login')
    }
  }

  async function updateProfile(data: UpdateProfileRequest) {
    try {
      dispatch({ type: 'AUTH_START' })

      // This would be implemented when you add the profile update endpoint
      // const response = await authService.updateProfile(data)

      // For now, just update local state
      dispatch({ type: 'AUTH_UPDATE_USER', payload: data })

      // In a real implementation:
      // if (response.success && response.data) {
      //   dispatch({ type: 'AUTH_SUCCESS', payload: response.data })
      // } else {
      //   dispatch({ type: 'AUTH_ERROR', payload: response.error || 'Update failed' })
      //   throw new Error(response.error || 'Update failed')
      // }
    } catch (error) {
      const errorMessage = formatError(error)
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage })
      throw error
    }
  }

  function clearError() {
    dispatch({ type: 'AUTH_CLEAR_ERROR' })
  }

  const contextValue: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    signup,
    logout,
    refreshAuth,
    clearError,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}