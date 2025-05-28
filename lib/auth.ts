// lib/auth.ts - Enhanced authentication with Supabase integration

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { User, AuthState, LoginResponse } from '@/types'
import { apiClient } from './api'
import { toast } from 'react-hot-toast'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

// Storage keys for auth data
const STORAGE_KEYS = {
  AUTH_DATA: 'knugget_auth',
  AUTH_TOKEN: 'knugget_auth_token',
  LAST_SYNC: 'knugget_last_sync',
} as const

export class AuthService {
  private static instance: AuthService
  private listeners: ((authState: AuthState) => void)[] = []
  private refreshPromise: Promise<boolean> | null = null
  private syncPromise: Promise<void> | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private initialized = false

  private constructor() {
    if (typeof window !== 'undefined' && !this.initialized) {
      this.initialize()
    }
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Initialize auth service
  private async initialize() {
    if (this.initialized) return

    try {
      this.setupAuthListener()

      // Check for existing session on startup
      const currentState = await this.getCurrentAuthState()
      this.notifyListeners(currentState)

      // Set up auto-refresh timer
      this.scheduleTokenRefresh()

      this.initialized = true
      console.log('🔐 Auth service initialized')
    } catch (error) {
      console.error('❌ Auth service initialization failed:', error)
    }
  }

  // Subscribe to auth state changes
  subscribe(callback: (authState: AuthState) => void) {
    this.listeners.push(callback)

    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  private notifyListeners(authState: AuthState) {
    this.listeners.forEach(listener => {
      try {
        listener(authState)
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  // Get current auth state with fallback mechanisms
  async getCurrentAuthState(): Promise<AuthState> {
    try {
      // First try to get user from our backend
      const backendResponse = await apiClient.getCurrentUser()

      if (backendResponse.success && backendResponse.data) {
        const tokens = this.getStoredTokens()
        const authState = {
          user: backendResponse.data,
          isAuthenticated: true,
          isLoading: false,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        }

        // Update API client token
        if (tokens.accessToken) {
          apiClient.setAuthToken(tokens.accessToken)
        }

        return authState
      }
    } catch (error) {
      console.log('Backend auth check failed, trying Supabase...', error)
    }

    // Fallback to Supabase
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) throw error

      if (session?.user) {
        // Sync with backend if we have a Supabase session
        await this.syncWithBackend(session.access_token)

        const backendUser = await apiClient.getCurrentUser()
        if (backendUser.success && backendUser.data) {
          const authState = {
            user: backendUser.data,
            isAuthenticated: true,
            isLoading: false,
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }

          // Store tokens for future use
          this.storeTokens({
            user: backendUser.data,
            accessToken: session.access_token,
            refreshToken: session.refresh_token || '',
            expiresAt: Date.now() + (session.expires_in || 3600) * 1000,
          })

          return authState
        }
      }
    } catch (error) {
      console.error('Supabase auth check failed:', error)
    }

    // Check for extension auth sync
    try {
      const extensionAuth = await this.checkExtensionAuth()
      if (extensionAuth.isAuthenticated) {
        return extensionAuth
      }
    } catch (error) {
      console.log('Extension auth check failed:', error)
    }

    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
    }
  }

  // Sign up with email and password
  async signUp(email: string, password: string, name?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try backend registration first
      const backendResponse = await apiClient.register(email, password, name)

      if (backendResponse.success && backendResponse.data) {
        const loginData = backendResponse.data as any
        this.storeTokens(loginData)

        const authState = {
          user: loginData.user,
          isAuthenticated: true,
          isLoading: false,
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
        }

        this.notifyListeners(authState)
        this.notifyExtension(authState)

        toast.success('Account created successfully!')
        return { success: true }
      }
    } catch (error: any) {
      console.log('Backend registration failed, trying Supabase...', error)

      // If backend fails, try Supabase
      try {
        const { data, error: supabaseError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || '',
            },
          },
        })

        if (supabaseError) throw supabaseError

        if (data.user && data.session) {
          // Sync with backend
          await this.syncWithBackend(data.session.access_token)

          const authState = await this.getCurrentAuthState()
          this.notifyListeners(authState)
          this.notifyExtension(authState)

          toast.success('Account created successfully!')
          return { success: true }
        }
      } catch (supabaseError: any) {
        console.error('Supabase registration failed:', supabaseError)
        return { success: false, error: supabaseError.message }
      }
    }

    return { success: false, error: 'Registration failed' }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try backend login first
      const backendResponse = await apiClient.login(email, password)

      if (backendResponse.success && backendResponse.data) {
        const loginData = backendResponse.data as any
        this.storeTokens(loginData)

        const authState = {
          user: loginData.user,
          isAuthenticated: true,
          isLoading: false,
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
        }

        this.notifyListeners(authState)
        this.notifyExtension(authState)
        this.scheduleTokenRefresh()

        toast.success('Welcome back!')
        return { success: true }
      }
    } catch (error: any) {
      console.log('Backend login failed, trying Supabase...', error)

      // If backend fails, try Supabase
      try {
        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (supabaseError) throw supabaseError

        if (data.user && data.session) {
          // Sync with backend
          await this.syncWithBackend(data.session.access_token)

          const authState = await this.getCurrentAuthState()
          this.notifyListeners(authState)
          this.notifyExtension(authState)
          this.scheduleTokenRefresh()

          toast.success('Welcome back!')
          return { success: true }
        }
      } catch (supabaseError: any) {
        console.error('Supabase login failed:', supabaseError)
        return { success: false, error: supabaseError.message }
      }
    }

    return { success: false, error: 'Login failed' }
  }

  // Sign out from all sources
  async signOut(): Promise<void> {
    try {
      // Clear refresh timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }

      // Sign out from backend
      const tokens = this.getStoredTokens()
      if (tokens.refreshToken) {
        try {
          await apiClient.logout(tokens.refreshToken)
        } catch (error) {
          console.error('Backend logout error:', error)
        }
      }

      // Sign out from Supabase
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Supabase logout error:', error)
      }

      // Clear stored tokens and API client token
      this.clearTokens()
      apiClient.clearAuthToken()

      // Create signed out state
      const signedOutState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
      }

      // Notify listeners and extension
      this.notifyListeners(signedOutState)
      this.notifyExtension(signedOutState)

      toast.success('Signed out successfully')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Sign out failed')
    }
  }

  // Refresh token with deduplication
  async refreshToken(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return await this.refreshPromise
    }

    this.refreshPromise = this.performTokenRefresh()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const tokens = this.getStoredTokens()

      if (tokens.refreshToken) {
        // Try backend refresh first
        try {
          const backendResponse = await apiClient.refreshToken(tokens.refreshToken)

          if (backendResponse.success && backendResponse.data) {
            const loginData = backendResponse.data as any
            this.storeTokens(loginData)

            const authState = {
              user: loginData.user,
              isAuthenticated: true,
              isLoading: false,
              accessToken: loginData.accessToken,
              refreshToken: loginData.refreshToken,
            }

            this.notifyListeners(authState)
            this.notifyExtension(authState)
            this.scheduleTokenRefresh()

            return true
          }
        } catch (error) {
          console.error('Backend token refresh failed:', error)
        }
      }

      // Fallback to Supabase refresh
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      if (data.session) {
        await this.syncWithBackend(data.session.access_token)
        const authState = await this.getCurrentAuthState()
        this.notifyListeners(authState)
        this.notifyExtension(authState)
        this.scheduleTokenRefresh()
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)

      // If refresh fails, sign out user
      await this.signOut()
      toast.error('Session expired. Please sign in again.')
    }

    return false
  }

  // Reset password
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Try backend reset first
      const backendResponse = await apiClient.forgotPassword(email)

      if (backendResponse.success) {
        toast.success('Password reset email sent!')
        return { success: true }
      }
    } catch (error) {
      console.log('Backend password reset failed, trying Supabase...', error)
    }

    try {
      // Fallback to Supabase
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success('Password reset email sent!')
      return { success: true }
    } catch (error: any) {
      console.error('Password reset failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Update password
  async updatePassword(password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      toast.success('Password updated successfully!')
      return { success: true }
    } catch (error: any) {
      console.error('Password update failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Private helper methods

  private storeTokens(loginResponse: LoginResponse) {
    if (typeof window !== 'undefined') {
      const authData = {
        user: loginResponse.user,
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        expiresAt: loginResponse.expiresAt,
        loginTime: new Date().toISOString(),
      }

      localStorage.setItem(STORAGE_KEYS.AUTH_DATA, JSON.stringify(authData))
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginResponse.accessToken)
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, Date.now().toString())

      // Set token in API client
      apiClient.setAuthToken(loginResponse.accessToken)
    }
  }

  private getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.AUTH_DATA)
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
          }
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error)
      }
    }

    return { accessToken: null, refreshToken: null }
  }

  private clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_DATA)
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.LAST_SYNC)
    }
  }

  // Sync user data with backend using Supabase token
  private async syncWithBackend(supabaseToken: string): Promise<void> {
    if (this.syncPromise) {
      return await this.syncPromise
    }

    this.syncPromise = this.performBackendSync(supabaseToken)

    try {
      await this.syncPromise
    } finally {
      this.syncPromise = null
    }
  }

  private async performBackendSync(supabaseToken: string): Promise<void> {
    try {
      // This would call a backend endpoint to sync Supabase user with backend
      // For now, we'll just log and set the token for future API calls
      console.log('🔄 Syncing with backend using Supabase token...')

      // Temporarily set the token for API calls
      const originalToken = apiClient.getAuthToken()
      apiClient.setAuthToken(supabaseToken)

      // Try to get user info from backend
      const userResponse = await apiClient.getCurrentUser()

      if (!userResponse.success) {
        // If user doesn't exist in backend, create them
        // This would require implementing a sync endpoint in your backend
        console.log('User not found in backend, might need to create...')
      }

      // Restore original token if sync fails
      if (originalToken) {
        apiClient.setAuthToken(originalToken)
      }

    } catch (error) {
      console.error('Backend sync failed:', error)
    }
  }

  // Check for extension authentication
  private async checkExtensionAuth(): Promise<AuthState> {
    return new Promise((resolve) => {
      // Try to get auth from extension with timeout
      const timeout = setTimeout(() => {
        resolve({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          refreshToken: null,
        })
      }, 1000)

      // Request auth from extension
      this.postMessageToExtension({
        type: 'KNUGGET_EXTENSION_AUTH_REQUEST',
        timestamp: Date.now(),
      })

      // Listen for response (this would be handled by the message listener)
      const handleExtensionResponse = (event: MessageEvent) => {
        if (event.data.type === 'KNUGGET_EXTENSION_AUTH_RESPONSE' && event.data.payload) {
          clearTimeout(timeout)
          window.removeEventListener('message', handleExtensionResponse)

          const { isAuthenticated, user, accessToken, refreshToken } = event.data.payload

          if (isAuthenticated && user && accessToken) {
            this.storeTokens({
              user,
              accessToken,
              refreshToken: refreshToken || '',
              expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            })

            resolve({
              user,
              isAuthenticated,
              isLoading: false,
              accessToken,
              refreshToken,
            })
          } else {
            resolve({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              accessToken: null,
              refreshToken: null,
            })
          }
        }
      }

      window.addEventListener('message', handleExtensionResponse)
    })
  }

  // Schedule automatic token refresh
  private scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_DATA)
      if (stored) {
        const { expiresAt } = JSON.parse(stored)
        const timeUntilExpiry = expiresAt - Date.now()
        const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000) // Refresh 5 minutes before expiry

        if (refreshTime > 0) {
          this.refreshTimer = setTimeout(() => {
            this.refreshToken()
          }, refreshTime)
        } else {
          // Token already expired, refresh immediately
          this.refreshToken()
        }
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error)
    }
  }

  // Notify Chrome extension about auth state changes
  private notifyExtension(authState: AuthState) {
    this.postMessageToExtension({
      type: 'KNUGGET_AUTH_UPDATE',
      payload: {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        accessToken: authState.accessToken,
        refreshToken: authState.refreshToken,
      },
      timestamp: Date.now(),
    })
  }

  // Post message to extension with error handling
  private postMessageToExtension(data: any) {
    try {
      if (typeof window !== 'undefined' && window.postMessage) {
        window.postMessage(data, window.location.origin)
      }
    } catch (error) {
      console.error('Failed to notify extension:', error)
    }
  }

  // Set up comprehensive auth state listener
  setupAuthListener() {
    // Listen for Supabase auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Supabase auth event:', event)

      try {
        if (event === 'SIGNED_IN' && session) {
          await this.syncWithBackend(session.access_token)
          const authState = await this.getCurrentAuthState()
          this.notifyListeners(authState)
          this.notifyExtension(authState)
          this.scheduleTokenRefresh()
        } else if (event === 'SIGNED_OUT') {
          this.clearTokens()
          apiClient.clearAuthToken()

          const signedOutState = {
            user: null,
            isAuthenticated: false,
            isLoading: false,
            accessToken: null,
            refreshToken: null,
          }

          this.notifyListeners(signedOutState)
          this.notifyExtension(signedOutState)
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await this.syncWithBackend(session.access_token)
          const authState = await this.getCurrentAuthState()
          this.notifyListeners(authState)
          this.notifyExtension(authState)
          this.scheduleTokenRefresh()
        }
      } catch (error) {
        console.error('Error handling Supabase auth event:', error)
      }
    })

    // Listen for extension messages
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return

        try {
          if (event.data.type === 'KNUGGET_EXTENSION_AUTH_REQUEST') {
            // Extension is requesting current auth state
            this.getCurrentAuthState().then(authState => {
              this.notifyExtension(authState)
            })
          } else if (event.data.type === 'KNUGGET_EXTENSION_AUTH_UPDATE') {
            // Extension is updating auth state
            const { payload } = event.data
            if (payload && payload.isAuthenticated) {
              // Update local state if extension has newer auth
              const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
              const extensionSync = payload.timestamp || 0

              if (!lastSync || extensionSync > parseInt(lastSync)) {
                this.storeTokens({
                  user: payload.user,
                  accessToken: payload.accessToken,
                  refreshToken: payload.refreshToken || '',
                  expiresAt: payload.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
                })

                const authState = {
                  user: payload.user,
                  isAuthenticated: true,
                  isLoading: false,
                  accessToken: payload.accessToken,
                  refreshToken: payload.refreshToken,
                }

                this.notifyListeners(authState)
              }
            }
          }
        } catch (error) {
          console.error('Error handling extension message:', error)
        }
      })
    }
  }
}

// Create singleton instance
export const authService = AuthService.getInstance()

// Convenience functions
export function useAuthService() {
  return authService
}

export async function getAuthToken(): Promise<string | null> {
  const authState = await authService.getCurrentAuthState()
  return authState.accessToken
}

export async function isAuthenticated(): Promise<boolean> {
  const authState = await authService.getCurrentAuthState()
  return authState.isAuthenticated
}

export async function getCurrentUser(): Promise<User | null> {
  const authState = await authService.getCurrentAuthState()
  return authState.user
}

// Initialize auth listener when module loads
if (typeof window !== 'undefined') {
  authService.setupAuthListener()
}