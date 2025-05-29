/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Type for Chrome extension API
interface ChromeAPI {
  storage: {
    sync: {
      set: (items: Record<string, any>) => Promise<void>
      remove: (keys: string | string[]) => Promise<void>
    }
    local: {
      set: (items: Record<string, any>) => Promise<void>
      remove: (keys: string | string[]) => Promise<void>
    }
    onChanged: {
      addListener: (callback: (changes: Record<string, any>, namespace: string) => void) => void
    }
  }
  runtime: {
    sendMessage: (extensionId: string, message: any) => Promise<any>
  }
}

// Type guard for Chrome API
function getChromeAPI(): ChromeAPI | null {
  if (typeof chrome !== 'undefined' && chrome?.storage) {
    return chrome as unknown as ChromeAPI
  }
  return null
}

import {
  User,
  AuthData,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ApiResponse,
  LoginResponse,
  AUTH_STORAGE_KEYS,
  EXTENSION_STORAGE_KEYS,
  AUTH_ENDPOINTS,
  ExtensionAuthData,
} from '@/types/auth'
import { getApiBaseUrl, isBrowser, isChromeExtensionAvailable } from '@/lib/utils'

class AuthService {
  private baseUrl: string

  constructor() {
    this.baseUrl = getApiBaseUrl()
  }

  /**
   * Make authenticated API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const token = this.getAccessToken()

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
    }

    return response
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await this.makeRequest<LoginResponse>(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
    }

    return response
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    const refreshToken = this.getRefreshToken()

    // Call logout endpoint
    const response = await this.makeRequest<void>(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    // Clear local auth data regardless of API response
    await this.clearAuthData()

    return response
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<ApiResponse<LoginResponse>> {
    const refreshToken = this.getRefreshToken()

    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
      }
    }

    const response = await this.makeRequest<LoginResponse>(AUTH_ENDPOINTS.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    if (response.success && response.data) {
      await this.setAuthData(response.data)
    } else {
      // If refresh fails, clear auth data
      await this.clearAuthData()
    }

    return response
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(AUTH_ENDPOINTS.ME)
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(AUTH_ENDPOINTS.RESET_PASSWORD, {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  /**
   * Set authentication data in storage and sync with extension
   */
  private async setAuthData(authData: LoginResponse): Promise<void> {
    if (!isBrowser()) return

    try {
      // Store in localStorage
      localStorage.setItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN, authData.accessToken)
      localStorage.setItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN, authData.refreshToken)
      localStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(authData.user))
      localStorage.setItem(AUTH_STORAGE_KEYS.EXPIRES_AT, authData.expiresAt.toString())

      // Sync with Chrome extension if available
      await this.syncWithExtension(authData)
    } catch (error) {
      console.error('Failed to set auth data:', error)
    }
  }

  /**
   * Clear authentication data from storage and extension
   */
  private async clearAuthData(): Promise<void> {
    if (!isBrowser()) return

    try {
      // Clear localStorage
      Object.values(AUTH_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })

      // Clear extension storage
      await this.clearExtensionAuth()
    } catch (error) {
      console.error('Failed to clear auth data:', error)
    }
  }

  /**
   * Sync authentication data with Chrome extension
   */
  private async syncWithExtension(authData: LoginResponse): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      const extensionAuthData: ExtensionAuthData = {
        token: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: {
          id: authData.user.id,
          name: authData.user.name,
          email: authData.user.email,
          credits: authData.user.credits,
          plan: authData.user.plan.toLowerCase(),
        },
        expiresAt: authData.expiresAt,
        loginTime: new Date().toISOString(),
      }

      // Store in Chrome storage
      await chromeAPI.storage.sync.set({
        [EXTENSION_STORAGE_KEYS.AUTH_DATA]: extensionAuthData,
      })

      // Also store in local storage for immediate access
      await chromeAPI.storage.local.set({
        knuggetUserInfo: extensionAuthData,
      })

      console.log('Auth data synced with Chrome extension')
    } catch (error) {
      console.error('Failed to sync with Chrome extension:', error)
    }
  }

  /**
   * Clear Chrome extension authentication data
   */
  private async clearExtensionAuth(): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      await chromeAPI.storage.sync.remove(EXTENSION_STORAGE_KEYS.AUTH_DATA)
      await chromeAPI.storage.local.remove('knuggetUserInfo')
      console.log('Extension auth data cleared')
    } catch (error) {
      console.error('Failed to clear extension auth:', error)
    }
  }

  /**
   * Get access token from storage
   */
  getAccessToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN)
  }

  /**
   * Get refresh token from storage
   */
  getRefreshToken(): string | null {
    if (!isBrowser()) return null
    return localStorage.getItem(AUTH_STORAGE_KEYS.REFRESH_TOKEN)
  }

  /**
   * Get user data from storage
   */
  getUser(): User | null {
    if (!isBrowser()) return null

    const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_DATA)
    if (!userData) return null

    try {
      return JSON.parse(userData)
    } catch {
      return null
    }
  }

  /**
   * Get token expiration time
   */
  getExpiresAt(): number | null {
    if (!isBrowser()) return null

    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.EXPIRES_AT)
    return expiresAt ? parseInt(expiresAt) : null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken()
    const expiresAt = this.getExpiresAt()

    if (!token || !expiresAt) return false

    // Check if token is expired (with 5 minute buffer)
    const isExpired = Date.now() > (expiresAt - 5 * 60 * 1000)
    return !isExpired
  }

  /**
   * Check if token needs refresh (within 15 minutes of expiry)
   */
  needsRefresh(): boolean {
    const expiresAt = this.getExpiresAt()
    if (!expiresAt) return false

    const refreshThreshold = 15 * 60 * 1000 // 15 minutes
    return Date.now() > (expiresAt - refreshThreshold)
  }

  /**
   * Auto-refresh token if needed
   */
  async autoRefreshToken(): Promise<boolean> {
    if (!this.needsRefresh()) return true

    const response = await this.refreshToken()
    return response.success
  }

  /**
   * Initialize auth state from storage
   */
  initializeFromStorage(): { user: User | null; isAuthenticated: boolean } {
    const user = this.getUser()
    const isAuthenticated = this.isAuthenticated()

    return { user, isAuthenticated }
  }

  /**
   * Listen for Chrome extension auth changes
   */
  setupExtensionAuthListener(): void {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    // Listen for storage changes from extension
    chromeAPI.storage.onChanged.addListener((changes: Record<string, any>, namespace: string) => {
      if (namespace === 'sync' && changes[EXTENSION_STORAGE_KEYS.AUTH_DATA]) {
        const change = changes[EXTENSION_STORAGE_KEYS.AUTH_DATA]

        if (change.newValue) {
          // Extension logged in, sync to website
          const authData = change.newValue as ExtensionAuthData
          this.handleExtensionAuthChange(authData)
        } else if (change.oldValue && !change.newValue) {
          // Extension logged out, clear website auth
          this.clearAuthData()
        }
      }
    })
  }

  /**
   * Handle auth change from Chrome extension
   */
  private async handleExtensionAuthChange(authData: ExtensionAuthData): Promise<void> {
    try {
      // Convert extension auth data to LoginResponse format
      const loginResponse: LoginResponse = {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.name,
          avatar: null,
          plan: authData.user.plan.toUpperCase() as 'FREE' | 'PREMIUM',
          credits: authData.user.credits,
          emailVerified: true,
          createdAt: authData.loginTime,
          lastLoginAt: authData.loginTime,
        },
        accessToken: authData.token,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt,
      }

      await this.setAuthData(loginResponse)

      // Trigger a custom event to notify React components
      window.dispatchEvent(new CustomEvent('authChange', {
        detail: { user: loginResponse.user, isAuthenticated: true }
      }))
    } catch (error) {
      console.error('Failed to handle extension auth change:', error)
    }
  }

  /**
   * Send auth success message to Chrome extension
   */
  async notifyExtensionAuthSuccess(authData: LoginResponse): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
      if (!extensionId) return

      await chromeAPI.runtime.sendMessage(extensionId, {
        type: 'KNUGGET_AUTH_SUCCESS',
        payload: {
          token: authData.accessToken,
          refreshToken: authData.refreshToken,
          user: authData.user,
          expiresAt: authData.expiresAt,
        },
      })
    } catch (error) {
      console.error('Failed to notify extension of auth success:', error)
    }
  }

  /**
   * Send logout message to Chrome extension
   */
  async notifyExtensionLogout(): Promise<void> {
    const chromeAPI = getChromeAPI()
    if (!chromeAPI) return

    try {
      const extensionId = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID
      if (!extensionId) return

      await chromeAPI.runtime.sendMessage(extensionId, {
        type: 'KNUGGET_LOGOUT',
      })
    } catch (error) {
      console.error('Failed to notify extension of logout:', error)
    }
  }
}

// Export singleton instance
export const authService = new AuthService()