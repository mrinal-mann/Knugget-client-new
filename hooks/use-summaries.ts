// hooks/use-summaries.ts - Enhanced summary management hooks

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useAuth } from './use-auth'
import {
  Summary,
  SummaryQueryParams,
  GenerateSummaryRequest,
  PaginatedResponse,
  TranscriptSegment,
  VideoMetadata
} from '@/types'
import { toast } from 'react-hot-toast'
import { debounce } from '@/lib/utils'

// Query keys factory for better cache management
export const summaryKeys = {
  all: ['summaries'] as const,
  lists: () => [...summaryKeys.all, 'list'] as const,
  list: (params: SummaryQueryParams) => [...summaryKeys.lists(), { params }] as const,
  infinite: (params: Omit<SummaryQueryParams, 'page'>) => [...summaryKeys.all, 'infinite', { params }] as const,
  details: () => [...summaryKeys.all, 'detail'] as const,
  detail: (id: string) => [...summaryKeys.details(), id] as const,
  byVideo: (videoId: string) => [...summaryKeys.all, 'video', videoId] as const,
  stats: () => [...summaryKeys.all, 'stats'] as const,
  search: (query: string, filters: any) => [...summaryKeys.all, 'search', { query, filters }] as const,
}

// Main summaries hook with enhanced error handling and caching
export function useSummaries(params: SummaryQueryParams = {}) {
  const { isAuthenticated } = useAuth()

  const queryKey = summaryKeys.list(params)

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isRefetching
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.getSummaries(params)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch summaries')
      }
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.statusCode >= 400 && error?.statusCode < 500) return false
      return failureCount < 2
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  // Enhanced loading states
  const isInitialLoading = isLoading && !data
  const isLoadingMore = isFetching && !isInitialLoading

  return {
    summaries: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    isInitialLoading,
    isLoadingMore,
    isRefetching,
    error,
    refetch,
  }
}

// Infinite scroll summaries with optimized performance
export function useInfiniteSummaries(params: Omit<SummaryQueryParams, 'page'> = {}) {
  const { isAuthenticated } = useAuth()

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: summaryKeys.infinite(params),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.getSummaries({ ...params, page: pageParam as number })
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch summaries')
      }
      return response.data!
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: PaginatedResponse<Summary>) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    maxPages: 10, // Prevent infinite scroll memory issues
    retry: (failureCount, error: any) => {
      if (error?.statusCode >= 400 && error?.statusCode < 500) return false
      return failureCount < 2
    },
  })

  // Memoized flattened summaries for performance
  const summaries = useMemo(() => {
    return data?.pages.flatMap((page: PaginatedResponse<Summary>) => page.data) || []
  }, [data])

  const totalCount = (data?.pages[0] as PaginatedResponse<Summary>)?.pagination.total || 0

  return {
    summaries,
    totalCount,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  }
}

// Single summary with optimistic updates
export function useSummary(id: string) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: summaryKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getSummaryById(id)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch summary')
      }
      return response.data
    },
    enabled: isAuthenticated && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 404) return false
      if (error?.statusCode >= 400 && error?.statusCode < 500) return false
      return failureCount < 2
    },
  })
}

// Summary by video ID with cache optimization
export function useSummaryByVideoId(videoId: string) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: summaryKeys.byVideo(videoId),
    queryFn: async () => {
      const response = await apiClient.getSummaryByVideoId(videoId)
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch summary')
      }
      return response.data
    },
    enabled: isAuthenticated && !!videoId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.statusCode === 404) return false
      return failureCount < 2
    },
  })
}

// Enhanced summary mutations with optimistic updates
export function useSummaryMutations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Generate summary with comprehensive error handling
  const generateSummaryMutation = useMutation({
    mutationFn: async (data: GenerateSummaryRequest) => {
      // Validate input data
      if (!data.transcript || data.transcript.length === 0) {
        throw new Error('Transcript is required')
      }
      if (!data.videoMetadata || !data.videoMetadata.videoId) {
        throw new Error('Video metadata is required')
      }

      const response = await apiClient.generateSummary(data)
      if (!response.success) {
        throw new Error(response.error || 'Failed to generate summary')
      }
      return response.data
    },
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: summaryKeys.all })

      // Optimistically update credits
      if (user) {
        queryClient.setQueryData(['user', 'profile'], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            credits: Math.max(0, oldData.credits - 1),
          }
        })
      }

      // Return context for potential rollback
      return { previousUser: user }
    },
    onSuccess: (newSummary, variables) => {
      // Update summary caches
      queryClient.invalidateQueries({ queryKey: summaryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: summaryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })

      // Set the new summary in cache
      if (newSummary?.id) {
        queryClient.setQueryData(summaryKeys.detail(newSummary.id), newSummary)

        // Also cache by video ID
        queryClient.setQueryData(
          summaryKeys.byVideo(variables.videoMetadata.videoId),
          newSummary
        )
      }

      toast.success('Summary generated successfully!', {
        duration: 5000,
        icon: '✨',
      })
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic credit update
      if (context?.previousUser) {
        queryClient.setQueryData(['user', 'profile'], context.previousUser)
      }

      // Invalidate user data to get fresh state
      queryClient.invalidateQueries({ queryKey: ['user'] })

      const errorMessage = error?.message || 'Failed to generate summary'
      toast.error(errorMessage, {
        duration: 6000,
        icon: '❌',
      })
    },
    retry: (failureCount, error: any) => {
      // Don't retry on client errors or insufficient credits
      if (error?.statusCode === 402 || error?.statusCode >= 400 && error?.statusCode < 500) {
        return false
      }
      return failureCount < 1
    },
  })

  // Update summary with optimistic updates
  const updateSummaryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Summary> }) => {
      const response = await apiClient.updateSummary(id, updates)
      if (!response.success) {
        throw new Error(response.error || 'Failed to update summary')
      }
      return response.data
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: summaryKeys.detail(id) })

      const previousSummary = queryClient.getQueryData(summaryKeys.detail(id))

      // Optimistically update the summary
      queryClient.setQueryData(summaryKeys.detail(id), (old: any) => {
        if (!old) return old
        return { ...old, ...updates }
      })

      return { previousSummary, id }
    },
    onSuccess: (updatedSummary) => {
      // Update all related caches
      if (updatedSummary?.id) {
        queryClient.setQueryData(summaryKeys.detail(updatedSummary.id), updatedSummary)
      }
      queryClient.invalidateQueries({ queryKey: summaryKeys.lists() })

      toast.success('Summary updated successfully!')
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSummary) {
        queryClient.setQueryData(summaryKeys.detail(context.id), context.previousSummary)
      }

      toast.error(error instanceof Error ? error.message : 'Failed to update summary')
    },
  })

  // Delete summary with optimistic updates
  const deleteSummaryMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.deleteSummary(id)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete summary')
      }
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: summaryKeys.all })

      // Get the summary being deleted for potential rollback
      const previousSummary = queryClient.getQueryData(summaryKeys.detail(id))

      // Optimistically remove from all caches
      queryClient.removeQueries({ queryKey: summaryKeys.detail(id) })

      // Remove from lists
      queryClient.setQueriesData(
        { queryKey: summaryKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            data: oldData.data.filter((summary: Summary) => summary.id !== id),
            pagination: {
              ...oldData.pagination,
              total: Math.max(0, oldData.pagination.total - 1),
            },
          }
        }
      )

      return { previousSummary, id }
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: summaryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })

      toast.success('Summary deleted successfully!')
    },
    onError: (error, id, context) => {
      // Rollback optimistic updates
      if (context?.previousSummary) {
        queryClient.setQueryData(summaryKeys.detail(id), context.previousSummary)
      }

      // Refetch to get accurate state
      queryClient.invalidateQueries({ queryKey: summaryKeys.lists() })

      toast.error(error instanceof Error ? error.message : 'Failed to delete summary')
    },
  })

  // Bulk delete with progress tracking
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) {
        throw new Error('No summaries selected')
      }

      const response = await apiClient.bulkDeleteSummaries(ids)
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete summaries')
      }
      return response.data
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: summaryKeys.all })

      // Store deleted summaries for potential rollback
      const previousSummaries = ids.map(id => ({
        id,
        data: queryClient.getQueryData(summaryKeys.detail(id))
      }))

      // Optimistically remove from caches
      ids.forEach(id => {
        queryClient.removeQueries({ queryKey: summaryKeys.detail(id) })
      })

      // Update lists
      queryClient.setQueriesData(
        { queryKey: summaryKeys.lists() },
        (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            data: oldData.data.filter((summary: Summary) => !ids.includes(summary.id!)),
            pagination: {
              ...oldData.pagination,
              total: Math.max(0, oldData.pagination.total - ids.length),
            },
          }
        }
      )

      return { previousSummaries, ids }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: summaryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['user', 'stats'] })

      toast.success(`Successfully deleted ${result?.deletedCount || 0} summaries`)
    },
    onError: (error, ids, context) => {
      // Rollback optimistic updates
      if (context?.previousSummaries) {
        context.previousSummaries.forEach(({ id, data }) => {
          if (data) {
            queryClient.setQueryData(summaryKeys.detail(id), data)
          }
        })
      }

      queryClient.invalidateQueries({ queryKey: summaryKeys.lists() })

      toast.error(error instanceof Error ? error.message : 'Failed to delete summaries')
    },
  })

  return {
    generateSummary: generateSummaryMutation.mutate,
    generateSummaryAsync: generateSummaryMutation.mutateAsync,
    updateSummary: updateSummaryMutation.mutate,
    updateSummaryAsync: updateSummaryMutation.mutateAsync,
    deleteSummary: deleteSummaryMutation.mutate,
    deleteSummaryAsync: deleteSummaryMutation.mutateAsync,
    bulkDelete: bulkDeleteMutation.mutate,
    bulkDeleteAsync: bulkDeleteMutation.mutateAsync,

    // Loading states
    isGenerating: generateSummaryMutation.isPending,
    isUpdating: updateSummaryMutation.isPending,
    isDeleting: deleteSummaryMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,

    // Error states
    generateError: generateSummaryMutation.error,
    updateError: updateSummaryMutation.error,
    deleteError: deleteSummaryMutation.error,
    bulkDeleteError: bulkDeleteMutation.error,

    // Reset functions
    resetGenerateError: generateSummaryMutation.reset,
    resetUpdateError: updateSummaryMutation.reset,
    resetDeleteError: deleteSummaryMutation.reset,
    resetBulkDeleteError: bulkDeleteMutation.reset,
  }
}

// Enhanced search hook with debouncing and history
export function useSummarySearch() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<Partial<SummaryQueryParams>>({})
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const { isAuthenticated } = useAuth()

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, searchFilters: Partial<SummaryQueryParams>) => {
      if (searchQuery.trim()) {
        setSearchHistory(prev => {
          const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)]
          return newHistory.slice(0, 10) // Keep only last 10 searches
        })
      }
    }, 300),
    []
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: summaryKeys.search(query, filters),
    queryFn: async () => {
      if (!query.trim()) {
        return { data: [], pagination: null }
      }

      const response = await apiClient.searchSummaries(query, filters)
      if (!response.success) {
        throw new Error(response.error || 'Search failed')
      }
      return response.data
    },
    enabled: isAuthenticated && query.trim().length > 0,
    staleTime: 30 * 1000,
    gcTime: 2 * 60 * 1000,
  })

  const search = useCallback((searchQuery: string, searchFilters?: Partial<SummaryQueryParams>) => {
    setQuery(searchQuery)
    if (searchFilters) {
      setFilters(searchFilters)
    }
    debouncedSearch(searchQuery, searchFilters || filters)
  }, [filters, debouncedSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setFilters({})
  }, [])

  const searchFromHistory = useCallback((historyQuery: string) => {
    setQuery(historyQuery)
  }, [])

  return {
    query,
    filters,
    searchHistory,
    results: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    search,
    clearSearch,
    searchFromHistory,
    refetch,
  }
}

// Summary statistics with real-time updates
export function useSummaryStats() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: summaryKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.getSummaryStats()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch summary stats')
      }
      return response.data
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds if active
    refetchIntervalInBackground: false,
  })
}

// Recent summaries with auto-refresh
export function useRecentSummaries(limit: number = 5) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: [...summaryKeys.lists(), 'recent', limit],
    queryFn: async () => {
      const response = await apiClient.getSummaries({
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch recent summaries')
      }
      return response.data?.data || []
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchIntervalInBackground: false,
  })
}

// Export functionality with progress tracking
export function useSummaryExport() {
  const exportMutation = useMutation({
    mutationFn: async (format: 'json' | 'csv' = 'json') => {
      const response = await apiClient.exportSummaries(format)
      if (!response.success) {
        throw new Error(response.error || 'Export failed')
      }
      return response.data
    },
    onSuccess: (data, format) => {
      // Create and trigger download
      if (data?.downloadUrl) {
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = `knugget-summaries-${Date.now()}.${format || 'json'}`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      toast.success(`Export started successfully! Format: ${(format || 'json').toUpperCase()}`, {
        duration: 4000,
        icon: '✨',
      })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    },
  })

  return {
    exportSummaries: exportMutation.mutate,
    exportSummariesAsync: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error,
    resetExportError: exportMutation.reset,
  }
}

// Advanced filtering with persistent state
export function useSummaryFilters() {
  const [filters, setFilters] = useState<SummaryQueryParams>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('knugget_summary_filters')
        if (saved) {
          return { ...JSON.parse(saved), page: 1 }
        }
      } catch (error) {
        console.error('Failed to load saved filters:', error)
      }
    }

    return {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
  })

  // Persist filters to localStorage
  const persistFilters = useCallback((newFilters: SummaryQueryParams) => {
    if (typeof window !== 'undefined') {
      try {
        const { page, ...filtersToPersist } = newFilters
        localStorage.setItem('knugget_summary_filters', JSON.stringify(filtersToPersist))
      } catch (error) {
        console.error('Failed to save filters:', error)
      }
    }
  }, [])

  const updateFilter = useCallback((key: keyof SummaryQueryParams, value: any) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
        page: key !== 'page' ? 1 : value, // Reset page when other filters change
      }
      persistFilters(newFilters)
      return newFilters
    })
  }, [persistFilters])

  const updateFilters = useCallback((newFilters: Partial<SummaryQueryParams>) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        ...newFilters,
        page: 1, // Reset page when filters change
      }
      persistFilters(updated)
      return updated
    })
  }, [persistFilters])

  const resetFilters = useCallback(() => {
    const defaultFilters = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    }
    setFilters(defaultFilters)
    persistFilters(defaultFilters)
  }, [persistFilters])

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.search ||
      filters.status ||
      filters.videoId ||
      filters.startDate ||
      filters.endDate ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc'
    )
  }, [filters])

  return {
    filters,
    updateFilter,
    updateFilters,
    resetFilters,
    hasActiveFilters,
  }
}

// Selection management for bulk operations
export function useSummarySelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectSummary = useCallback((id: string) => {
    setSelectedIds(prev => new Set([...prev, id]))
  }, [])

  const deselectSummary = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  const toggleSummary = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback((summaries: Summary[]) => {
    setSelectedIds(new Set(summaries.map(s => s.id!).filter(Boolean)))
  }, [])

  const selectPage = useCallback((summaries: Summary[]) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      summaries.forEach(summary => {
        if (summary.id) newSet.add(summary.id)
      })
      return newSet
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => {
    return selectedIds.has(id)
  }, [selectedIds])

  const isAllSelected = useCallback((summaries: Summary[]) => {
    return summaries.every(summary => summary.id && selectedIds.has(summary.id))
  }, [selectedIds])

  const isPartiallySelected = useCallback((summaries: Summary[]) => {
    return summaries.some(summary => summary.id && selectedIds.has(summary.id)) && !isAllSelected(summaries)
  }, [selectedIds, isAllSelected])

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    selectSummary,
    deselectSummary,
    toggleSummary,
    selectAll,
    selectPage,
    clearSelection,
    isSelected,
    isAllSelected,
    isPartiallySelected,
    hasSelection: selectedIds.size > 0,
  }
}

export default useSummaries