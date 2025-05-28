// types/index.ts - Frontend types matching backend schema

import { Database } from './supabase'

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
}

// User Types
export type UserPlan = 'FREE' | 'PREMIUM'

export interface User {
    id: string
    email: string
    name: string | null
    avatar: string | null
    plan: UserPlan
    credits: number
    emailVerified: boolean
    createdAt: string
    updatedAt: string
    lastLoginAt: string | null
    supabaseId: string | null
}

export interface UserProfile extends User { }

export interface UserStats {
    totalSummaries: number
    summariesThisMonth: number
    creditsUsed: number
    creditsRemaining: number
    planStatus: UserPlan
    joinedDate: string
}

// Auth Types
export interface LoginResponse {
    user: User
    accessToken: string
    refreshToken: string
    expiresAt: number
}

export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    accessToken: string | null
    refreshToken: string | null
}

// Summary Types
export type SummaryStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface TranscriptSegment {
    timestamp: string
    text: string
    startSeconds?: number
    endSeconds?: number
}

export interface VideoMetadata {
    videoId: string
    title: string
    channelName: string
    duration?: string
    url: string
    thumbnailUrl?: string
    description?: string
    publishedAt?: string
    viewCount?: number
    likeCount?: number
}

export interface Summary {
    id: string
    title: string
    keyPoints: string[]
    fullSummary: string
    tags: string[]
    status: SummaryStatus
    videoMetadata: VideoMetadata
    transcript?: TranscriptSegment[]
    transcriptText?: string
    createdAt: string
    updatedAt: string
    saved?: boolean
}

// Form Types
export interface LoginFormData {
    email: string
    password: string
}

export interface RegisterFormData {
    email: string
    password: string
    name?: string
}

export interface UpdateProfileFormData {
    name?: string
    avatar?: string
}

export interface GenerateSummaryRequest {
    transcript: TranscriptSegment[]
    videoMetadata: VideoMetadata
}

// Query Parameters
export interface SummaryQueryParams {
    page?: number
    limit?: number
    search?: string
    status?: SummaryStatus
    videoId?: string
    startDate?: string
    endDate?: string
    sortBy?: 'createdAt' | 'title' | 'videoTitle'
    sortOrder?: 'asc' | 'desc'
}

// Extension Communication Types
export interface ExtensionMessage {
    type: string
    data?: any
    timestamp?: number
}

export interface ExtensionAuthData {
    isAuthenticated: boolean
    user: User | null
    accessToken: string | null
    refreshToken: string | null
}

export interface ExtensionStatus {
    isInstalled: boolean
    isActive: boolean
    version?: string
}

// Dashboard Stats
export interface DashboardStats {
    totalSummaries: number
    summariesThisMonth: number
    creditsUsed: number
    creditsRemaining: number
    recentSummaries: Summary[]
    monthlyUsage: Array<{
        month: string
        summaries: number
        credits: number
    }>
    topChannels: Array<{
        channel: string
        count: number
    }>
    avgSummaryLength: number
}

// Settings Types
export interface UserSettings {
    theme: 'light' | 'dark' | 'system'
    emailNotifications: boolean
    extensionSync: boolean
    autoSummarize: boolean
    defaultSummaryLength: 'short' | 'medium' | 'long'
}

// Error Types
export interface ValidationError {
    field: string
    message: string
}

export interface ApiError extends Error {
    statusCode: number
    isOperational: boolean
    errors?: ValidationError[]
}

// Component Props Types
export interface SummaryCardProps {
    summary: Summary
    onEdit?: (summary: Summary) => void
    onDelete?: (summaryId: string) => void
    onView?: (summary: Summary) => void
    showActions?: boolean
}

export interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon?: React.ReactNode
    trend?: {
        value: number
        isPositive: boolean
    }
}

export interface ChartDataPoint {
    name: string
    value: number
    [key: string]: any
}

// Navigation Types
export interface NavItem {
    title: string
    href: string
    icon?: React.ReactNode
    description?: string
    external?: boolean
}

export interface SidebarNavItem extends NavItem {
    items?: SidebarNavItem[]
}

// Filter and Sort Types
export interface FilterOption {
    label: string
    value: string
    count?: number
}

export interface SortOption {
    label: string
    value: string
    direction: 'asc' | 'desc'
}

// Pagination Types
export interface PaginationInfo {
    currentPage: number
    totalPages: number
    pageSize: number
    totalItems: number
    hasNext: boolean
    hasPrev: boolean
}

// Search Types
export interface SearchResult<T = any> {
    items: T[]
    totalCount: number
    query: string
    filters?: Record<string, any>
}

// Theme Types
export interface ThemeConfig {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
}

// Constants
export const ITEMS_PER_PAGE = 20
export const MAX_ITEMS_PER_PAGE = 100
export const DEBOUNCE_DELAY = 300
export const REFRESH_INTERVAL = 30000 // 30 seconds

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Loading States
export interface LoadingState {
    isLoading: boolean
    error: string | null
}

export interface AsyncState<T> extends LoadingState {
    data: T | null
}

// Form States
export interface FormState<T = any> {
    data: T
    errors: Record<string, string>
    isSubmitting: boolean
    isDirty: boolean
    isValid: boolean
}

// Modal Types
export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
}

// Toast Types
export interface ToastOptions {
    title?: string
    description?: string
    variant?: 'default' | 'destructive' | 'success'
    duration?: number
}

// Feature Flags
export interface FeatureFlags {
    enableExtensionSync: boolean
    enableAdvancedFilters: boolean
    enableBulkActions: boolean
    enableExport: boolean
    enableSharing: boolean
    enableAnalytics: boolean
}