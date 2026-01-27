'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { 
  Hash, 
  AlertCircle, 
  Loader2, 
  Lock, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ExternalLink,
  Plus,
  Check,
  X,
  FolderOpen,
  Clock,
  Filter,
  CheckCircle2,
  Info,
  Bookmark
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { TimeRangeSelector } from '@/components/time-range-selector'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCompanyInsights, formatCacheAge, isCacheOlderThan } from '@/hooks/use-insights-cache'
import { cn } from '@/lib/utils'
import type { Channel, ChannelCategory, TimeRangePreset } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface InsightWithLink {
  text: string
  slackLink: string | null
}

interface ChannelInsight {
  channelId: string
  channelName: string
  channelSlackId: string
  categoryIds: string[]
  summary: string
  keyTopics: string[]
  highlights: InsightWithLink[]
  actionItems: InsightWithLink[]
  messageCount: number
  activeParticipants: number
}

interface InsightItem {
  type: 'action' | 'info'
  text: string
  slackLink: string | null
  channelId: string
  channelName: string
  categoryIds: string[]
}

// Color mapping for categories - badge style
const colorMap: Record<string, string> = {
  pink: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  violet: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  orange: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
}

// Color mapping for filter cards - with ring and active states
const COLORS: Record<string, { bg: string; text: string; ring: string; bgActive: string }> = {
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-600', ring: 'ring-pink-500', bgActive: 'bg-pink-50' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', ring: 'ring-blue-500', bgActive: 'bg-blue-50' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500', bgActive: 'bg-emerald-50' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500', bgActive: 'bg-amber-50' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', ring: 'ring-purple-500', bgActive: 'bg-purple-50' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', ring: 'ring-cyan-500', bgActive: 'bg-cyan-50' },
  red: { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500', bgActive: 'bg-red-50' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', ring: 'ring-indigo-500', bgActive: 'bg-indigo-50' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600', ring: 'ring-violet-500', bgActive: 'bg-violet-50' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600', ring: 'ring-rose-500', bgActive: 'bg-rose-50' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-600', ring: 'ring-orange-500', bgActive: 'bg-orange-50' },
}

function getColorClasses(colorName: string) {
  return COLORS[colorName] || COLORS.blue
}

export default function CompanyInsightsPage() {
  const [timeRange, setTimeRange] = useState<{
    preset: TimeRangePreset
    weekNumber?: number
    year?: number
  }>({ preset: '7d' })

  const [insightFilter, setInsightFilter] = useState<'all' | 'action' | 'info'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set())
  const [addingTodo, setAddingTodo] = useState<string | null>(null)
  const [addedTodos, setAddedTodos] = useState<Set<string>>(new Set())
  const [addingToKnow, setAddingToKnow] = useState<string | null>(null)
  const [addedToKnows, setAddedToKnows] = useState<Set<string>>(new Set())

  // Function to add an action item to todos
  const addToTodo = async (text: string, slackLink: string | null, channelName: string) => {
    const itemKey = `${channelName}-${text}`
    setAddingTodo(itemKey)
    
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slackLink, channelName }),
      })
      
      if (response.ok) {
        setAddedTodos(prev => new Set([...prev, itemKey]))
      }
    } catch (error) {
      console.error('Failed to add todo:', error)
    } finally {
      setAddingTodo(null)
    }
  }

  // Function to add an info item to to-knows
  const addToToKnow = async (text: string, slackLink: string | null, channelName: string) => {
    const itemKey = `${channelName}-${text}`
    setAddingToKnow(itemKey)
    
    try {
      const response = await fetch('/api/toknows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, slackLink, channelName }),
      })
      
      if (response.ok) {
        setAddedToKnows(prev => new Set([...prev, itemKey]))
      }
    } catch (error) {
      console.error('Failed to add to-know:', error)
    } finally {
      setAddingToKnow(null)
    }
  }

  const { data: channelsData, isLoading: loadingChannels } = useSWR<Channel[]>(
    '/api/settings/channels',
    fetcher
  )

  const { data: categoriesData, isLoading: loadingCategories } = useSWR<ChannelCategory[]>(
    '/api/settings/channel-categories',
    fetcher
  )
  
  const channels = Array.isArray(channelsData) ? channelsData : []
  const categories = Array.isArray(categoriesData) ? categoriesData : []

  // Create a lookup map for categories
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat
      return acc
    }, {} as Record<string, ChannelCategory>)
  }, [categories])

  const currentTimeRangeKey = `${timeRange.preset}-${timeRange.weekNumber}-${timeRange.year}`
  
  // Use the caching hook for company insights
  const {
    data: cachedInsights,
    cacheAge,
    isValid,
    filteredChannels,
    fetchAllInsights,
  } = useCompanyInsights(
    categoryFilter,
    channels,
    categoryMap,
    currentTimeRangeKey,
    timeRange
  )
  
  // Use cached insights directly, cast to proper type
  const insightsData = (cachedInsights || []) as ChannelInsight[]
  const isStale = insightsData.length > 0 && !isValid
  const isOld = isCacheOlderThan(cacheAge, 4) // Accentuate refresh if > 4 hours old

  // Generate insights from filtered channels
  const generateAllInsights = async (forceRefresh = false) => {
    if (filteredChannels.length === 0) return
    
    // If we have valid cached insights and not forcing refresh, return
    if (insightsData.length > 0 && !forceRefresh && !isStale) {
      return
    }
    
    setLoadingInsights(true)
    
    try {
      await fetchAllInsights(forceRefresh || isStale)
    } catch (error) {
      console.error('Failed to generate insights:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  // Flatten all insights into a single list
  const allInsightItems = useMemo(() => {
    const items: InsightItem[] = []

    for (const insight of insightsData) {
      // Add action items
      for (const action of insight.actionItems) {
        items.push({
          type: 'action',
          text: typeof action === 'string' ? action : action.text,
          slackLink: typeof action === 'string' ? null : action.slackLink,
          channelId: insight.channelId,
          channelName: insight.channelName,
          categoryIds: insight.categoryIds,
        })
      }
      // Add highlights as informational items
      for (const highlight of insight.highlights) {
        items.push({
          type: 'info',
          text: typeof highlight === 'string' ? highlight : highlight.text,
          slackLink: typeof highlight === 'string' ? null : highlight.slackLink,
          channelId: insight.channelId,
          channelName: insight.channelName,
          categoryIds: insight.categoryIds,
        })
      }
    }

    return items
  }, [insightsData])

  // Filter insight items by type only (category is pre-filtered before generation)
  const filteredInsightItems = useMemo(() => {
    return allInsightItems.filter(item => {
      if (insightFilter !== 'all' && item.type !== insightFilter) return false
      return true
    })
  }, [allInsightItems, insightFilter])

  // Stats
  const privateChannels = channels.filter(c => c.isPrivate).length
  const publicChannels = channels.length - privateChannels
  const totalActionItems = allInsightItems.filter(i => i.type === 'action').length
  const totalInfoItems = allInsightItems.filter(i => i.type === 'info').length

  const toggleChannel = (channelId: string) => {
    setExpandedChannels(prev => {
      const next = new Set(prev)
      if (next.has(channelId)) {
        next.delete(channelId)
      } else {
        next.add(channelId)
      }
      return next
    })
  }

  const isLoading = loadingChannels || loadingCategories

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Hash className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Company Insights</h1>
            </div>
            <p className="text-muted-foreground">
              AI-powered summaries of channel activity across your organization
            </p>
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Filter Cards */}
        {channels.length > 0 && (
          <div className="space-y-4 mb-8">
            {/* Active Filters Badge */}
            {categoryFilter && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {categoryFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {categoryMap[categoryFilter]?.name || 'Unknown'}
                    <button onClick={() => setCategoryFilter(null)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={() => setCategoryFilter(null)} className="text-xs">
                  Clear all
                </Button>
              </div>
            )}

            {/* Built-in Filter Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* All Channels */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  categoryFilter === null && "ring-2 ring-primary bg-primary/5"
                )}
                onClick={() => setCategoryFilter(null)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      categoryFilter === null ? "bg-primary/20" : "bg-primary/10"
                    )}>
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{channels.length}</p>
                      <p className="text-xs text-muted-foreground">All Channels</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Public Channels - informational only */}
              <Card className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Hash className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{publicChannels}</p>
                      <p className="text-xs text-muted-foreground">Public</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Private Channels - informational only */}
              <Card className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Lock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{privateChannels}</p>
                      <p className="text-xs text-muted-foreground">Private</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories count - informational only */}
              <Card className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <FolderOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{categories.length}</p>
                      <p className="text-xs text-muted-foreground">Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Filter Cards */}
            {categories.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map((category) => {
                  const colorClasses = getColorClasses(category.color)
                  const channelCount = channels.filter(ch => ch.categoryIds?.includes(category.id)).length
                  const isActive = categoryFilter === category.id
                  
                  return (
                    <Card 
                      key={category.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isActive && `ring-2 ${colorClasses.ring} ${colorClasses.bgActive}`
                      )}
                      onClick={() => setCategoryFilter(isActive ? null : category.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isActive ? colorClasses.bg.replace('/10', '/20') : colorClasses.bg
                          )}>
                            <FolderOpen className={cn("h-5 w-5", colorClasses.text)} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{channelCount}</p>
                            <p className="text-xs text-muted-foreground">{category.name}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : channels.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No channels configured</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Add channels in Settings to start getting summaries.</span>
              <Button variant="outline" size="sm" asChild>
                <a href="/settings">Go to Settings</a>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Generate Insights Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Lightbulb className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>
                        {categoryFilter 
                          ? `${categoryMap[categoryFilter]?.name || 'Category'} Insights`
                          : 'Company-Wide Insights'
                        }
                      </CardTitle>
                      <CardDescription>
                        {insightsData.length > 0 
                          ? `${totalActionItems} action items, ${totalInfoItems} highlights from ${insightsData.length} channels`
                          : `Generate insights from ${filteredChannels.length} ${categoryFilter ? 'filtered' : ''} channel${filteredChannels.length !== 1 ? 's' : ''}`
                        }
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Cache age indicator */}
                    {insightsData.length > 0 && cacheAge && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={cn(
                              "flex items-center gap-1 text-xs px-2 py-1 rounded-md",
                              isStale 
                                ? "bg-amber-100 text-amber-700 border border-amber-300" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              <Clock className="h-3 w-3" />
                              {isStale ? 'Stale' : formatCacheAge(cacheAge)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isStale 
                              ? 'Time range or filters changed - click refresh to update' 
                              : 'Cached data - click refresh to get latest insights'
                            }</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => generateAllInsights(insightsData.length > 0)} 
                            disabled={loadingInsights || filteredChannels.length === 0}
                            className={cn(
                              "gap-2",
                              isOld && insightsData.length > 0 && "bg-amber-500 hover:bg-amber-600 text-white"
                            )}
                          >
                            {loadingInsights ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : insightsData.length > 0 ? (
                              <>
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                              </>
                            ) : (
                              <>
                                <Lightbulb className="h-4 w-4" />
                                Generate
                              </>
                            )}
                          </Button>
                        </TooltipTrigger>
                        {isOld && insightsData.length > 0 && (
                          <TooltipContent>
                            <p>Data is over 4 hours old - refresh recommended</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>

              {insightsData.length > 0 && (
                <CardContent className="pt-0">
                  {/* Filter by type */}
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Filter results:</span>
                    <Tabs value={insightFilter} onValueChange={(v) => setInsightFilter(v as 'all' | 'action' | 'info')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="all" className="text-xs px-3 h-7">
                          All ({allInsightItems.length})
                        </TabsTrigger>
                        <TabsTrigger value="action" className="text-xs px-3 h-7">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actions ({totalActionItems})
                        </TabsTrigger>
                        <TabsTrigger value="info" className="text-xs px-3 h-7">
                          <Info className="h-3 w-3 mr-1" />
                          Info ({totalInfoItems})
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Insights List */}
                  {filteredInsightItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No insights match the current filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredInsightItems.map((item, index) => {
                        const channelCategories = item.categoryIds
                          .map(id => categoryMap[id])
                          .filter(Boolean)

                        return (
                          <div 
                            key={`${item.channelId}-${item.type}-${index}`}
                            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className={`p-1.5 rounded-full ${
                              item.type === 'action' 
                                ? 'bg-emerald-500/10 text-emerald-600' 
                                : 'bg-blue-500/10 text-blue-600'
                            }`}>
                              {item.type === 'action' 
                                ? <CheckCircle2 className="h-4 w-4" /> 
                                : <Info className="h-4 w-4" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed">{item.text}</p>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  <Hash className="h-3 w-3 mr-1" />
                                  {item.channelName}
                                </Badge>
                                {channelCategories.map(cat => (
                                  <Badge 
                                    key={cat.id} 
                                    variant="outline" 
                                    className={`text-xs ${colorMap[cat.color] || colorMap.blue}`}
                                  >
                                    {cat.name}
                                  </Badge>
                                ))}
                                {item.slackLink && (
                                  <a 
                                    href={item.slackLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                                  >
                                    View in Slack
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                                {item.type === 'action' && (
                                  (() => {
                                    const itemKey = `${item.channelName}-${item.text}`
                                    const isAdded = addedTodos.has(itemKey)
                                    const isAdding = addingTodo === itemKey
                                    
                                    return isAdded ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                        <Check className="h-3 w-3" />
                                        Added to To-Do
                                      </span>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs gap-1"
                                        onClick={() => addToTodo(item.text, item.slackLink, item.channelName)}
                                        disabled={isAdding}
                                      >
                                        {isAdding ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Plus className="h-3 w-3" />
                                        )}
                                        Add to To-Do
                                      </Button>
                                    )
                                  })()
                                )}
                                {item.type === 'info' && (
                                  (() => {
                                    const itemKey = `${item.channelName}-${item.text}`
                                    const isAdded = addedToKnows.has(itemKey)
                                    const isAdding = addingToKnow === itemKey
                                    
                                    return isAdded ? (
                                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                                        <Check className="h-3 w-3" />
                                        Added to To-Know
                                      </span>
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs gap-1"
                                        onClick={() => addToToKnow(item.text, item.slackLink, item.channelName)}
                                        disabled={isAdding}
                                      >
                                        {isAdding ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <Bookmark className="h-3 w-3" />
                                        )}
                                        Add to To-Know
                                      </Button>
                                    )
                                  })()
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Channel Details (Collapsible) */}
            {insightsData.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  Channel Summaries
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {filteredChannels.map(channel => {
                    const channelInsight = insightsData.find(i => i.channelId === channel.id)
                    if (!channelInsight) return null

                    const isExpanded = expandedChannels.has(channel.id)
                    const channelCategories = channel.categoryIds
                      ?.map(id => categoryMap[id])
                      .filter(Boolean) || []

                    return (
                      <Card key={channel.id}>
                        <Collapsible open={isExpanded} onOpenChange={() => toggleChannel(channel.id)}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-base">
                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                  {channel.name}
                                  {channel.isPrivate && (
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  {channelCategories.map(cat => (
                                    <Badge 
                                      key={cat.id} 
                                      variant="outline" 
                                      className={`text-xs ${colorMap[cat.color] || colorMap.blue}`}
                                    >
                                      {cat.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CardDescription className="text-sm mt-2">
                              {channelInsight.summary.slice(0, 150)}
                              {channelInsight.summary.length > 150 && '...'}
                            </CardDescription>
                          </CardHeader>

                          <CollapsibleContent>
                            <CardContent className="pt-0 space-y-4">
                              <div className="text-sm text-muted-foreground">
                                {channelInsight.messageCount} messages from {channelInsight.activeParticipants} participants
                              </div>

                              {channelInsight.keyTopics.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2">Key Topics</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {channelInsight.keyTopics.map((topic, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">
                                        {topic}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {channelInsight.actionItems.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Action Items
                                  </h4>
                                  <ul className="text-sm text-muted-foreground space-y-2">
                                    {channelInsight.actionItems.map((item, i) => {
                                      const text = typeof item === 'string' ? item : item.text
                                      const link = typeof item === 'string' ? null : item.slackLink
                                      const itemKey = `${channelInsight.channelName}-${text}`
                                      const isAdded = addedTodos.has(itemKey)
                                      const isAdding = addingTodo === itemKey
                                      
                                      return (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-emerald-600 mt-1">→</span>
                                          <span className="flex-1">
                                            {text}
                                            <span className="ml-2 inline-flex items-center gap-2">
                                              {link && (
                                                <a 
                                                  href={link} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                >
                                                  View <ExternalLink className="h-3 w-3" />
                                                </a>
                                              )}
                                              {isAdded ? (
                                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                                                  <Check className="h-3 w-3" />
                                                  Added
                                                </span>
                                              ) : (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-5 px-1.5 text-xs gap-1"
                                                  onClick={() => addToTodo(text, link, channelInsight.channelName)}
                                                  disabled={isAdding}
                                                >
                                                  {isAdding ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                  ) : (
                                                    <Plus className="h-3 w-3" />
                                                  )}
                                                  To-Do
                                                </Button>
                                              )}
                                            </span>
                                          </span>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              )}

                              {channelInsight.highlights.length > 0 && (
                                <div>
                                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Info className="h-4 w-4 text-blue-600" />
                                    Highlights
                                  </h4>
                                  <ul className="text-sm text-muted-foreground space-y-2">
                                    {channelInsight.highlights.map((highlight, i) => {
                                      const text = typeof highlight === 'string' ? highlight : highlight.text
                                      const link = typeof highlight === 'string' ? null : highlight.slackLink
                                      return (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-blue-600 mt-1">•</span>
                                          <span className="flex-1">
                                            {text}
                                            {link && (
                                              <a 
                                                href={link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="ml-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                              >
                                                View <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )}
                                          </span>
                                        </li>
                                      )
                                    })}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
