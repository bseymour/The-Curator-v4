'use client'

import { useState, useEffect, useCallback } from 'react'

// Cache duration: 15 minutes for insights data
const CACHE_DURATION_MS = 15 * 60 * 1000

interface CacheMetadata {
  generatedAt: number
  timeRangeKey: string
}

interface CachedData<T> {
  data: T
  metadata: CacheMetadata
}

// Storage key prefix
const STORAGE_PREFIX = 'insights-cache-'

// Generate a unique cache key based on the request parameters
export function generateCacheKey(
  type: 'channel' | 'team-member' | 'team' | 'company-insights',
  id: string,
  timeRangeKey: string
): string {
  return `${STORAGE_PREFIX}${type}-${id}-${timeRangeKey}`
}

// Read from sessionStorage (client-side only)
function readFromStorage<T>(key: string): CachedData<T> | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = sessionStorage.getItem(key)
    if (!stored) return null
    return JSON.parse(stored) as CachedData<T>
  } catch {
    return null
  }
}

// Write to sessionStorage (client-side only)
function writeToStorage<T>(key: string, data: CachedData<T>): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('Failed to write to sessionStorage:', e)
  }
}

// Remove from sessionStorage
function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Ignore errors
  }
}

// Check if cached data is still valid
export function isCacheValid(metadata: CacheMetadata | undefined, currentTimeRangeKey: string): boolean {
  if (!metadata) return false
  
  const now = Date.now()
  const age = now - metadata.generatedAt
  
  // Cache is invalid if time range changed or cache expired
  if (metadata.timeRangeKey !== currentTimeRangeKey) return false
  if (age > CACHE_DURATION_MS) return false
  
  return true
}

// Format cache age for display
export function formatCacheAge(generatedAt: number): string {
  const ageMs = Date.now() - generatedAt
  const ageMinutes = Math.floor(ageMs / 60000)
  
  if (ageMinutes < 1) return 'Just now'
  if (ageMinutes === 1) return '1 minute ago'
  if (ageMinutes < 60) return `${ageMinutes} minutes ago`
  
  const ageHours = Math.floor(ageMinutes / 60)
  if (ageHours === 1) return '1 hour ago'
  return `${ageHours} hours ago`
}

// Check if cache age exceeds a threshold (in hours)
export function isCacheOlderThan(generatedAt: number | null, thresholdHours: number): boolean {
  if (!generatedAt) return false
  const ageMs = Date.now() - generatedAt
  const thresholdMs = thresholdHours * 60 * 60 * 1000
  return ageMs > thresholdMs
}

// Custom hook for cached channel insights
export function useChannelInsights(
  channelId: string | null,
  channelName: string,
  channelSlackId: string,
  categories: any[],
  timeRangeKey: string,
  timeRange: { preset: string; weekNumber?: number; year?: number }
) {
  const cacheKey = channelId ? generateCacheKey('channel', channelSlackId, timeRangeKey) : null
  
  const [cachedData, setCachedData] = useState<CachedData<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Load from storage on mount
  useEffect(() => {
    if (cacheKey) {
      const stored = readFromStorage<any>(cacheKey)
      if (stored) {
        setCachedData(stored)
      }
    }
  }, [cacheKey])

  const isValid = cachedData ? isCacheValid(cachedData.metadata, timeRangeKey) : false
  const data = isValid ? cachedData?.data : null

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    if (!channelId || !channelSlackId || !cacheKey) return null

    // Return cached data if valid and not forcing refresh
    if (data && !forceRefresh) {
      return data
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/summaries/channel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channelSlackId,
          channelName,
          categories,
          preset: timeRange.preset,
          weekNumber: timeRange.weekNumber,
          year: timeRange.year,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const result = await response.json()
      
      // Store in cache
      const newCachedData: CachedData<any> = {
        data: result,
        metadata: {
          generatedAt: Date.now(),
          timeRangeKey,
        },
      }
      
      writeToStorage(cacheKey, newCachedData)
      setCachedData(newCachedData)
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [channelId, channelSlackId, channelName, categories, timeRange, timeRangeKey, cacheKey, data])

  const clearCache = useCallback(() => {
    if (cacheKey) {
      removeFromStorage(cacheKey)
      setCachedData(null)
    }
  }, [cacheKey])

  return {
    data,
    error,
    isLoading,
    isValid,
    cacheAge: cachedData?.metadata?.generatedAt,
    fetchInsights,
    clearCache,
    refresh: () => fetchInsights(true),
  }
}

// Custom hook for cached team member insights
export function useTeamMemberInsights(
  memberId: string | null,
  memberName: string,
  slackUserId: string,
  role: string,
  memberFunction: string,
  relationship: string,
  timeRangeKey: string,
  timeRange: { preset: string; weekNumber?: number; year?: number }
) {
  const cacheKey = memberId ? generateCacheKey('team-member', slackUserId, timeRangeKey) : null

  const [cachedData, setCachedData] = useState<CachedData<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Load from storage on mount
  useEffect(() => {
    if (cacheKey) {
      const stored = readFromStorage<any>(cacheKey)
      if (stored) {
        setCachedData(stored)
      }
    }
  }, [cacheKey])

  const isValid = cachedData ? isCacheValid(cachedData.metadata, timeRangeKey) : false
  const data = isValid ? cachedData?.data : null

  const fetchInsights = useCallback(async (forceRefresh = false) => {
    if (!memberId || !slackUserId || !cacheKey) return null

    if (data && !forceRefresh) {
      return data
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/summaries/team-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          memberName,
          slackUserId,
          role,
          memberFunction,
          relationship,
          preset: timeRange.preset,
          weekNumber: timeRange.weekNumber,
          year: timeRange.year,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate summary')
      }

      const result = await response.json()
      
      const newCachedData: CachedData<any> = {
        data: result,
        metadata: {
          generatedAt: Date.now(),
          timeRangeKey,
        },
      }
      
      writeToStorage(cacheKey, newCachedData)
      setCachedData(newCachedData)
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [memberId, memberName, slackUserId, role, memberFunction, relationship, timeRange, timeRangeKey, cacheKey, data])

  const clearCache = useCallback(() => {
    if (cacheKey) {
      removeFromStorage(cacheKey)
      setCachedData(null)
    }
  }, [cacheKey])

  return {
    data,
    error,
    isLoading,
    isValid,
    cacheAge: cachedData?.metadata?.generatedAt,
    fetchInsights,
    clearCache,
    refresh: () => fetchInsights(true),
  }
}

// Custom hook for cached team summary
export function useTeamSummary(
  groupKey: string | null,
  groupName: string,
  members: any[],
  timeRangeKey: string,
  timeRange: { preset: string; weekNumber?: number; year?: number }
) {
  // Create a stable key from member IDs
  const memberKey = members.map(m => m.id).sort().join(',')
  const cacheKey = groupKey ? generateCacheKey('team', `${groupKey}-${memberKey}`, timeRangeKey) : null

  const [cachedData, setCachedData] = useState<CachedData<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Load from storage on mount
  useEffect(() => {
    if (cacheKey) {
      const stored = readFromStorage<any>(cacheKey)
      if (stored) {
        setCachedData(stored)
      }
    }
  }, [cacheKey])

  const isValid = cachedData ? isCacheValid(cachedData.metadata, timeRangeKey) : false
  const data = isValid ? cachedData?.data : null

  const fetchSummary = useCallback(async (forceRefresh = false) => {
    if (!groupKey || members.length === 0 || !cacheKey) return null

    if (data && !forceRefresh) {
      return data
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/summaries/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members, groupName, timeRange }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch team summary')
      }

      const result = await response.json()
      
      const newCachedData: CachedData<any> = {
        data: result,
        metadata: {
          generatedAt: Date.now(),
          timeRangeKey,
        },
      }
      
      writeToStorage(cacheKey, newCachedData)
      setCachedData(newCachedData)
      
      return result
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [groupKey, groupName, members, timeRange, timeRangeKey, cacheKey, data])

  const clearCache = useCallback(() => {
    if (cacheKey) {
      removeFromStorage(cacheKey)
      setCachedData(null)
    }
  }, [cacheKey])

  return {
    data,
    error,
    isLoading,
    isValid,
    cacheAge: cachedData?.metadata?.generatedAt,
    fetchSummary,
    clearCache,
    refresh: () => fetchSummary(true),
  }
}

// Custom hook for company-wide insights (multiple channels)
export function useCompanyInsights(
  categoryFilter: string | null,
  channels: any[],
  categoryMap: Record<string, any>,
  timeRangeKey: string,
  timeRange: { preset: string; weekNumber?: number; year?: number }
) {
  // Use a stable cache key that doesn't change when channels load
  const cacheKey = generateCacheKey('company-insights', categoryFilter || 'all', timeRangeKey)
  
  const filteredChannels = categoryFilter 
    ? channels.filter(ch => ch.categoryIds?.includes(categoryFilter))
    : channels

  const [cachedData, setCachedData] = useState<CachedData<any[]> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  // Load from storage on mount and when key changes
  useEffect(() => {
    const stored = readFromStorage<any[]>(cacheKey)
    if (stored) {
      setCachedData(stored)
    }
  }, [cacheKey])

  const isValid = cachedData ? isCacheValid(cachedData.metadata, timeRangeKey) : false
  const data = isValid ? cachedData?.data : null

  const fetchAllInsights = useCallback(async (forceRefresh = false) => {
    if (filteredChannels.length === 0) return []

    if (data && !forceRefresh) {
      return data
    }

    setIsLoading(true)
    setError(null)

    try {
      const newInsights: any[] = []

      for (const channel of filteredChannels) {
        try {
          const response = await fetch('/api/summaries/channel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              channelId: channel.slackId,
              channelName: channel.name,
              categories: channel.categoryIds?.map((id: string) => categoryMap[id]).filter(Boolean) || [],
              preset: timeRange.preset,
              weekNumber: timeRange.weekNumber,
              year: timeRange.year,
            }),
          })

          if (response.ok) {
            const responseData = await response.json()
            newInsights.push({
              channelId: channel.id,
              channelName: channel.name,
              channelSlackId: channel.slackId,
              categoryIds: channel.categoryIds || [],
              summary: responseData.summary || '',
              keyTopics: responseData.keyTopics || [],
              highlights: responseData.highlights || [],
              actionItems: responseData.actionItems || [],
              messageCount: responseData.messageCount || 0,
              activeParticipants: responseData.activeParticipants || 0,
            })
          }
        } catch (err) {
          console.error(`Failed to get insights for ${channel.name}:`, err)
        }
      }

      const newCachedData: CachedData<any[]> = {
        data: newInsights,
        metadata: {
          generatedAt: Date.now(),
          timeRangeKey,
        },
      }
      
      writeToStorage(cacheKey, newCachedData)
      setCachedData(newCachedData)
      
      return newInsights
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [filteredChannels, categoryMap, timeRange, timeRangeKey, cacheKey, data])

  const clearCache = useCallback(() => {
    removeFromStorage(cacheKey)
    setCachedData(null)
  }, [cacheKey])

  return {
    data,
    error,
    isLoading,
    isValid,
    cacheAge: cachedData?.metadata?.generatedAt,
    filteredChannels,
    fetchAllInsights,
    clearCache,
    refresh: () => fetchAllInsights(true),
  }
}

// Utility to clear all insights caches
export function clearAllInsightsCache() {
  if (typeof window === 'undefined') return
  
  const keysToRemove: string[] = []
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key))
}
