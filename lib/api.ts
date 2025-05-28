// lib/api.ts - API client for backend communication

import { ApiResponse, PaginatedResponse } from '@/types'
import { Summary, User, SummaryQueryParams, GenerateSummaryRequest, UserStats } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    // Get auth token from storage or auth store
    const token = this.getAuthToken()

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new ApiError(
          data.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      )
    }
  }

  getAuthToken(): string | null {
    // Try multiple sources for the auth token
    if (typeof window !== 'undefined') {
      // Try localStorage first
      const stored = localStorage.getItem('knugget_auth')
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          return parsed.accessToken
        } catch { }
      }

      // Try cookies as fallback
      const cookieMatch = document.cookie.match(/knugget_token=([^;]+)/)
      if (cookieMatch) {
        return cookieMatch[1]
      }
    }

    return null
  }

  // Health check
  async health() {
    return this.makeRequest('/health')
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(email: string, password: string, name?: string) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async refreshToken(refreshToken: string) {
    return this.makeRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async logout(refreshToken: string) {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/auth/me')
  }

  async forgotPassword(email: string) {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async resetPassword(token: string, password: string) {
    return this.makeRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  // Summary endpoints
  async generateSummary(data: GenerateSummaryRequest): Promise<ApiResponse<Summary>> {
    return this.makeRequest<Summary>('/summary/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getSummaries(params: SummaryQueryParams = {}): Promise<ApiResponse<PaginatedResponse<Summary>>> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/summary?${queryString}` : '/summary'

    return this.makeRequest<PaginatedResponse<Summary>>(endpoint)
  }

  async getSummaryById(id: string): Promise<ApiResponse<Summary>> {
    return this.makeRequest<Summary>(`/summary/${id}`)
  }

  async getSummaryByVideoId(videoId: string): Promise<ApiResponse<Summary | null>> {
    return this.makeRequest<Summary | null>(`/summary/video/${videoId}`)
  }

  async updateSummary(id: string, updates: Partial<Summary>): Promise<ApiResponse<Summary>> {
    return this.makeRequest<Summary>(`/summary/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteSummary(id: string): Promise<ApiResponse<void>> {
    return this.makeRequest<void>(`/summary/${id}`, {
      method: 'DELETE',
    })
  }

  async getSummaryStats(): Promise<ApiResponse<any>> {
    return this.makeRequest('/summary/stats')
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/profile')
  }

  async updateUserProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.makeRequest<UserStats>('/user/stats')
  }

  async addCredits(credits: number): Promise<ApiResponse<{ newBalance: number }>> {
    return this.makeRequest<{ newBalance: number }>('/user/credits/add', {
      method: 'POST',
      body: JSON.stringify({ credits }),
    })
  }

  async upgradePlan(plan: 'FREE' | 'PREMIUM'): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/user/plan/upgrade', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    })
  }

  async deleteAccount(): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/user/account', {
      method: 'DELETE',
    })
  }

  async verifyEmail(): Promise<ApiResponse<void>> {
    return this.makeRequest<void>('/user/verify-email', {
      method: 'POST',
    })
  }

  // Utility methods
  setAuthToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('knugget_auth_token', token)
    }
  }

  clearAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('knugget_auth_token')
      localStorage.removeItem('knugget_auth')
    }
  }

  // Upload file (for future use)
  async uploadFile(file: File, path: string = ''): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    if (path) formData.append('path', path)

    return this.makeRequest<{ url: string }>('/upload', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
      },
    })
  }

  // Search summaries (enhanced search)
  async searchSummaries(query: string, filters: any = {}): Promise<ApiResponse<PaginatedResponse<Summary>>> {
    const params = {
      search: query,
      ...filters,
    }

    return this.getSummaries(params)
  }

  // Export summaries
  async exportSummaries(format: 'json' | 'csv' = 'json'): Promise<ApiResponse<{ downloadUrl: string }>> {
    return this.makeRequest<{ downloadUrl: string }>(`/summary/export?format=${format}`)
  }

  // Bulk operations
  async bulkDeleteSummaries(ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> {
    return this.makeRequest<{ deletedCount: number }>('/summary/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  async bulkUpdateSummaries(ids: string[], updates: Partial<Summary>): Promise<ApiResponse<{ updatedCount: number }>> {
    return this.makeRequest<{ updatedCount: number }>('/summary/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, updates }),
    })
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export individual methods for convenience
export const {
  health,
  login,
  register,
  refreshToken,
  logout,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  generateSummary,
  getSummaries,
  getSummaryById,
  getSummaryByVideoId,
  updateSummary,
  deleteSummary,
  getSummaryStats,
  getUserProfile,
  updateUserProfile,
  getUserStats,
  addCredits,
  upgradePlan,
  deleteAccount,
  verifyEmail,
  searchSummaries,
  exportSummaries,
  bulkDeleteSummaries,
  bulkUpdateSummaries,
} = apiClient

export { ApiError }
export default apiClient