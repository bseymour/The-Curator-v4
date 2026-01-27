'use client'

import { useState } from 'react'
import { Hash, MessageSquare, Users, ChevronDown, ChevronUp, Loader2, AlertCircle, RefreshCw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { useChannelInsights, formatCacheAge } from '@/hooks/use-insights-cache'
import type { Channel, ChannelCategory, TimeRangePreset } from '@/lib/types'

interface ChannelSummary {
  channelId: string
  channelName: string
  categories: ChannelCategory[]
  summary: string
  keyTopics: string[]
  highlights?: string[]
  actionItems?: string[]
  messageCount: number
  activeParticipants: number
  generatedAt: Date
}

interface ChannelSummaryCardProps {
  channel: Channel
  timeRange: {
    preset: TimeRangePreset
    weekNumber?: number
    year?: number
  }
}

const categoryColors: Record<ChannelCategory, string> = {
  HQ: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  Sales: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  Team: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  Management: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
}

export function ChannelSummaryCard({ channel, timeRange }: ChannelSummaryCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  
  const currentTimeRangeKey = `${timeRange.preset}-${timeRange.weekNumber}-${timeRange.year}`
  
  // Use the caching hook
  const {
    data: cachedSummary,
    cacheAge,
    isValid,
    fetchInsights,
  } = useChannelInsights(
    channel.id,
    channel.name,
    channel.slackId,
    channel.categories || [],
    currentTimeRangeKey,
    timeRange
  )
  
  const summary = cachedSummary as ChannelSummary | null
  const isStale = summary && !isValid

  const handleFetch = async (forceRefresh = false) => {
    // If we have a valid cached summary and not forcing refresh, just toggle expand
    if (summary && !forceRefresh && !isStale) {
      setExpanded(!expanded)
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await fetchInsights(forceRefresh || isStale)
      setExpanded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge variant="outline" className={categoryColors[channel.categories[0]] || categoryColors.Team}>
                  <Hash className="h-3 w-3 mr-1" />
                  {channel.name}
                </Badge>
                {channel.isPrivate && (
                  <Badge variant="outline" className="text-xs">Private</Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {channel.categories.join(' / ')} channel
              </CardDescription>
            </div>
            <div className="flex items-center gap-1">
              {/* Cache age and refresh button - shown when summary exists */}
              {summary && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFetch(true)}
                        disabled={loading}
                        className="gap-1 px-2"
                      >
                        {isStale ? (
                          <>
                            <RefreshCw className="h-4 w-4 text-amber-500" />
                            <span className="text-xs text-amber-500">Stale</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {cacheAge ? formatCacheAge(cacheAge) : ''}
                            </span>
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isStale ? 'Time range changed - click to refresh' : 'Click to refresh summary'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFetch(false)}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : summary ? (
                    <>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expanded ? 'Collapse' : 'Expand'}
                    </>
                  ) : (
                    'Get Summary'
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {summary && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {summary.messageCount} messages
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {summary.activeParticipants} participants
                  </span>
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary.summary}
                  </p>
                </div>

                {summary.keyTopics && summary.keyTopics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.keyTopics.map((topic, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {summary.highlights && summary.highlights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Highlights</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {summary.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-1">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.actionItems && summary.actionItems.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Action Items</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {summary.actionItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-accent mt-1">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
