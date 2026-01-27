'use client'

import { useState } from 'react'
import { 
  Loader2, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2,
  Trophy,
  Lightbulb,
  Users,
  Star,
  RefreshCw,
  Clock,
  Heart
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTeamSummary, formatCacheAge, isCacheOlderThan } from '@/hooks/use-insights-cache'
import type { TeamMember, TimeRangePreset } from '@/lib/types'

interface TeamSummary {
  groupName: string
  overallHealth: 'healthy' | 'attention_needed' | 'concerning'
  healthScore: number
  summary: string
  highlights: string[]
  concerns: string[]
  topContributors: Array<{ name: string; contribution: string }>
  suggestedActions: string[]
  memberCount: number
  messageCount: number
  generatedAt: Date
}

interface TeamSummaryCardProps {
  groupName: string
  members: TeamMember[]
  timeRange: {
    preset: TimeRangePreset
    weekNumber?: number
    year?: number
  }
}

const healthConfig = {
  healthy: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Healthy',
    progressColor: 'bg-green-500',
  },
  attention_needed: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Needs Attention',
    progressColor: 'bg-amber-500',
  },
  concerning: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Concerning',
    progressColor: 'bg-red-500',
  },
}

export function TeamSummaryCard({ groupName, members, timeRange }: TeamSummaryCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTimeRangeKey = `${timeRange.preset}-${timeRange.weekNumber}-${timeRange.year}`
  
  // Create a stable group key from the group name
  const groupKey = groupName.toLowerCase().replace(/\s+/g, '-')
  
  // Use the caching hook
  const {
    data: cachedSummary,
    cacheAge,
    isValid,
    fetchSummary: fetchCachedSummary,
  } = useTeamSummary(
    groupKey,
    groupName,
    members,
    currentTimeRangeKey,
    timeRange
  )
  
  const summary = cachedSummary as TeamSummary | null
  const isStale = summary && !isValid
  const isOld = isCacheOlderThan(cacheAge, 24) // Accentuate refresh if > 24 hours old

  const handleFetch = async (forceRefresh = false) => {
    if (members.length === 0) return
    
    // If we have a valid cached summary and not forcing refresh, return
    if (summary && !forceRefresh && !isStale) {
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      await fetchCachedSummary(forceRefresh || isStale)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (members.length === 0) {
    return null
  }

  const health = summary ? healthConfig[summary.overallHealth] : null
  const HealthIcon = health?.icon || Heart

  return (
    <Card className={`w-full ${health?.borderColor || ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${health?.bgColor || 'bg-muted'}`}>
              <Users className={`h-5 w-5 ${health?.color || 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{groupName} Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                {members.length} team member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <Badge className={`${health?.bgColor} ${health?.color} border-0`}>
                <HealthIcon className="h-3 w-3 mr-1" />
                {health?.label}
              </Badge>
            )}
            {/* Cache age indicator - shown when summary exists */}
            {summary && cacheAge && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md ${
                      isStale 
                        ? "bg-amber-100 text-amber-700 border border-amber-300" 
                        : "bg-muted text-muted-foreground"
                    }`}>
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
            {summary && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => handleFetch(true)}
                      disabled={loading}
                      className={`gap-2 ${
                        isOld ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                      }`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {isOld && (
                    <TooltipContent>
                      <p>Data is over 24 hours old - refresh recommended</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Initial state - show generate button */}
        {!loading && !summary && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Generate an AI-powered overview of this group's activity, sentiment, and communication patterns.
            </p>
            <Button onClick={handleFetch} className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Generate Overview
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Analyzing team...</span>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg w-full">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
            <Button variant="outline" size="sm" onClick={handleFetch} className="gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {summary && (
          <div className="space-y-4">
            {/* Health Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Team Health Score</span>
                <span className="font-semibold">{summary.healthScore}/100</span>
              </div>
              <Progress value={summary.healthScore} className={`h-2 ${health?.progressColor}`} />
            </div>

            {/* Summary */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {summary.summary}
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Highlights */}
              {summary.highlights.length > 0 && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-green-800">
                    <Trophy className="h-4 w-4" />
                    Highlights
                  </h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {summary.highlights.slice(0, 4).map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5">+</span>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Concerns */}
              {summary.concerns.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Concerns
                  </h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {summary.concerns.slice(0, 4).map((concern, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-0.5">!</span>
                        {concern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Top Contributors */}
            {summary.topContributors.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Standout Contributors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summary.topContributors.map((contributor, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {contributor.name}: {contributor.contribution}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {summary.suggestedActions.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-blue-800">
                  <Lightbulb className="h-4 w-4" />
                  Suggested Actions
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  {summary.suggestedActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">{i + 1}.</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Footer stats */}
            <div className="flex items-center text-xs text-muted-foreground pt-2 border-t">
              <span>Based on {summary.messageCount} messages</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
