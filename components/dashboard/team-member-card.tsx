'use client'

import { useState } from 'react'
import { 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  AlertTriangle,
  Hash,
  Briefcase,
  RefreshCw,
  MessageCircleWarning,
  ListChecks,
  ExternalLink,
  Clock,
  Sparkles // Import Sparkles icon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { useTeamMemberInsights, formatCacheAge } from '@/hooks/use-insights-cache'
import type { TeamMember, TimeRangePreset, SentimentType } from '@/lib/types'

interface MessageRef {
  index: number
  text: string
  channel: string
  permalink: string | null
}

interface WarningSignal {
  signal: string
  context: string
  severity: 'low' | 'medium' | 'high'
  messageIndex?: number
}

interface PositiveSignal {
  signal: string
  messageIndex?: number
}

interface SentimentHighlight {
  text: string
  messageIndex?: number
}

interface ActivityItem {
  activity: string
  messageIndices?: number[]
}

interface WinItem {
  win: string
  messageIndices?: number[]
}

interface ConcernItem {
  concern: string
  messageIndices?: number[]
}

interface CommunicationTone {
  terseness: 'normal' | 'slightly_terse' | 'notably_terse'
  tension: 'none' | 'mild' | 'notable'
  warningSignals: WarningSignal[]
  positiveSignals: (string | PositiveSignal)[]
  suggestedTopicsFor1on1: string[]
}

interface TeamMemberSummary {
  memberId: string
  memberName: string
  activitySummary: string
  keyActivities: (string | ActivityItem)[]
  wins: (string | WinItem)[]
  concerns: (string | ConcernItem)[]
  sentiment: {
    type: SentimentType
    score: number
    highlights: (string | SentimentHighlight)[]
  }
  communicationTone?: CommunicationTone
  messageCount: number
  channelsActive: string[]
  messageRefs?: MessageRef[]
  generatedAt: Date
}

interface TeamMemberCardProps {
  member: TeamMember
  timeRange: {
    preset: TimeRangePreset
    weekNumber?: number
    year?: number
  }
}

// Helper to render a link to Slack message
function SlackLink({ messageRefs, indices }: { messageRefs?: MessageRef[]; indices?: number[] }) {
  if (!messageRefs || !indices || indices.length === 0) return null
  
  const validLinks = indices
    .filter(i => messageRefs[i]?.permalink)
    .slice(0, 3) // Limit to 3 links
  
  if (validLinks.length === 0) return null
  
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {validLinks.map((i, idx) => (
        <a
          key={i}
          href={messageRefs[i].permalink!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-primary hover:text-primary/80 text-xs"
          title={`View in Slack (#${messageRefs[i].channel})`}
        >
          <ExternalLink className="h-3 w-3" />
          {validLinks.length > 1 && <span className="sr-only">{idx + 1}</span>}
        </a>
      ))}
    </span>
  )
}

function SingleSlackLink({ messageRefs, index }: { messageRefs?: MessageRef[]; index?: number }) {
  if (!messageRefs || index === undefined || !messageRefs[index]?.permalink) return null
  
  return (
    <a
      href={messageRefs[index].permalink!}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center text-primary hover:text-primary/80 ml-1"
      title={`View in Slack (#${messageRefs[index].channel})`}
    >
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

const sentimentConfig: Record<SentimentType, { 
  icon: typeof TrendingUp
  color: string
  bgColor: string
  label: string
}> = {
  positive: { 
    icon: TrendingUp, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    label: 'Positive' 
  },
  neutral: { 
    icon: Minus, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100',
    label: 'Neutral' 
  },
  negative: { 
    icon: TrendingDown, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100',
    label: 'Needs Attention' 
  },
  mixed: { 
    icon: AlertTriangle, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100',
    label: 'Mixed' 
  },
}

export function TeamMemberCard({ member, timeRange }: TeamMemberCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const currentTimeRangeKey = `${timeRange.preset}-${timeRange.weekNumber}-${timeRange.year}`
  
  // Use the caching hook
  const {
    data: cachedSummary,
    cacheAge,
    isValid,
    fetchInsights,
  } = useTeamMemberInsights(
    member.id,
    member.name,
    member.slackUserId,
    member.role,
    member.function,
    member.relationship,
    currentTimeRangeKey,
    timeRange
  )
  
  const summary = cachedSummary as TeamMemberSummary | null
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

  const sentimentInfo = summary ? sentimentConfig[summary.sentiment.type] : null
  const SentimentIcon = sentimentInfo?.icon || Minus

  return (
    <Card className="w-full">
      <Collapsible open={expanded} onOpenChange={setExpanded} className="w-full">
        <CardHeader className="pb-3 w-full">
          <div className="flex items-start justify-between gap-4 w-full">
            <div className="flex items-center gap-4 min-w-0 flex-grow">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-3 flex-wrap">
                  {member.name}
                  {summary && sentimentInfo && (
                    <Badge className={`${sentimentInfo.bgColor} ${sentimentInfo.color} border-0`}>
                      <SentimentIcon className="h-3 w-3 mr-1" />
                      {sentimentInfo.label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="flex items-center gap-3 text-sm mt-1 flex-wrap">
                  <Badge variant="outline">
                    {member.role}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    {member.function}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span>{member.relationship}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                      <p>{isStale ? 'Time range changed - click to refresh' : 'Click to refresh insights'}</p>
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
                      Analyzing...
                    </>
                  ) : summary ? (
                    <>
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expanded ? 'Collapse' : 'Expand'}
                    </>
                  ) : (
                    'Get Insights'
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent className="w-full">
          <CardContent className="pt-0 px-6 w-full">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {summary && (
              <div className="space-y-6 w-full">
                {/* Stats bar */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b flex-wrap">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {summary.messageCount} messages
                  </span>
                  {summary.channelsActive.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Hash className="h-4 w-4" />
                      {summary.channelsActive.length} channels
                    </span>
                  )}
                  {/* Communication tone badge in stats */}
                  {summary.communicationTone && (
                    <>
                      {summary.communicationTone.terseness !== 'normal' && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${summary.communicationTone.terseness === 'notably_terse' 
                            ? 'border-amber-300 bg-amber-50 text-amber-700' 
                            : 'border-yellow-200 bg-yellow-50 text-yellow-700'}`}
                        >
                          {summary.communicationTone.terseness === 'notably_terse' ? 'Notably terse' : 'Slightly terse'}
                        </Badge>
                      )}
                      {summary.communicationTone.tension !== 'none' && (
                        <Badge 
                          variant="outline"
                          className={`text-xs ${summary.communicationTone.tension === 'notable' 
                            ? 'border-red-300 bg-red-50 text-red-700' 
                            : 'border-orange-200 bg-orange-50 text-orange-700'}`}
                        >
                          {summary.communicationTone.tension === 'notable' ? 'Notable tension' : 'Mild tension'}
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                {/* KEY INFORMATION - Top Section with responsive grid */}
                <div className="grid gap-6 md:grid-cols-2 w-full">
                  {/* Left column - Summary and Activities */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-foreground">Activity Summary</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {summary.activitySummary}
                      </p>
                    </div>

                    {summary.keyActivities && summary.keyActivities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 text-foreground">Key Activities</h4>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          {summary.keyActivities.map((item, i) => {
                            const activity = typeof item === 'string' 
                              ? item 
                              : (item && typeof item === 'object' && 'activity' in item) 
                                ? item.activity 
                                : String(item)
                            const indices = (item && typeof item === 'object' && 'messageIndices' in item) 
                              ? item.messageIndices 
                              : undefined
                            return (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span>
                                  {activity}
                                  <SlackLink messageRefs={summary.messageRefs} indices={indices} />
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Right column - Wins and Concerns */}
                  <div className="space-y-4">
                    {summary.wins && summary.wins.length > 0 && (
                      <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-green-800">
                          <Trophy className="h-4 w-4" />
                          Wins
                        </h4>
                        <ul className="text-sm text-green-700 space-y-1.5">
                          {summary.wins.map((item, i) => {
                            const win = typeof item === 'string' 
                              ? item 
                              : (item && typeof item === 'object' && 'win' in item) 
                                ? item.win 
                                : String(item)
                            const indices = (item && typeof item === 'object' && 'messageIndices' in item) 
                              ? item.messageIndices 
                              : undefined
                            return (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5">✓</span>
                                <span>
                                  {win}
                                  <SlackLink messageRefs={summary.messageRefs} indices={indices} />
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {summary.concerns && summary.concerns.length > 0 && (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          Areas of Concern
                        </h4>
                        <ul className="text-sm text-amber-700 space-y-1.5">
                          {summary.concerns.map((item, i) => {
                            const concern = typeof item === 'string' 
                              ? item 
                              : (item && typeof item === 'object' && 'concern' in item) 
                                ? item.concern 
                                : String(item)
                            const indices = (item && typeof item === 'object' && 'messageIndices' in item) 
                              ? item.messageIndices 
                              : undefined
                            return (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5">!</span>
                                <span>
                                  {concern}
                                  <SlackLink messageRefs={summary.messageRefs} indices={indices} />
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* 1:1 Topics - Important for action */}
                    {summary.communicationTone?.suggestedTopicsFor1on1 && summary.communicationTone.suggestedTopicsFor1on1.length > 0 && (
                      <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-blue-800">
                          <ListChecks className="h-4 w-4" />
                          Suggested Topics for 1:1
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-1.5">
                          {summary.communicationTone.suggestedTopicsFor1on1.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">-</span>
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* DETAILED ANALYSIS - Below the fold */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                    <MessageCircleWarning className="h-4 w-4" />
                    Detailed Analysis
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2 w-full">
                    {/* Warning Signals */}
                    {summary.communicationTone?.warningSignals && summary.communicationTone.warningSignals.length > 0 && (
                      <div className="p-4 rounded-lg bg-red-50 border border-red-100">
                        <h5 className="font-medium text-sm mb-3 flex items-center gap-2 text-red-800">
                          <AlertTriangle className="h-4 w-4" />
                          Warning Signals
                        </h5>
                        <div className="space-y-3">
                          {summary.communicationTone.warningSignals.map((signal, i) => (
                            <div key={i} className="text-sm">
                              <div className="flex items-start gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs shrink-0 ${
                                    signal.severity === 'high' 
                                      ? 'border-red-400 text-red-700' 
                                      : signal.severity === 'medium'
                                        ? 'border-orange-300 text-orange-700'
                                        : 'border-yellow-300 text-yellow-700'
                                  }`}
                                >
                                  {signal.severity}
                                </Badge>
                                <div>
                                  <span className="text-red-800 font-medium">
                                    {signal.signal}
                                    <SingleSlackLink messageRefs={summary.messageRefs} index={signal.messageIndex} />
                                  </span>
                                  {signal.context && (
                                    <p className="text-red-600 text-xs mt-1 italic">{'"'}{signal.context}{'"'}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Positive Signals */}
                    {summary.communicationTone?.positiveSignals && summary.communicationTone.positiveSignals.length > 0 && (
                      <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                        <h5 className="font-medium text-sm mb-3 flex items-center gap-2 text-emerald-800">
                          <Sparkles className="h-4 w-4" />
                          Positive Signals
                        </h5>
                        <ul className="text-sm text-emerald-700 space-y-1.5">
                          {summary.communicationTone.positiveSignals.map((item, i) => {
                            const signal = typeof item === 'string' 
                              ? item 
                              : (item && typeof item === 'object' && 'signal' in item) 
                                ? item.signal 
                                : String(item)
                            const messageIndex = (item && typeof item === 'object' && 'messageIndex' in item) 
                              ? item.messageIndex 
                              : undefined
                            return (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-0.5">+</span>
                                <span>
                                  {signal}
                                  <SingleSlackLink messageRefs={summary.messageRefs} index={messageIndex} />
                                </span>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Sentiment Indicators */}
                    {summary.sentiment.highlights && summary.sentiment.highlights.length > 0 && (
                      <div className="lg:col-span-2">
                        <h5 className="font-medium text-sm mb-2 text-muted-foreground">Sentiment Indicators</h5>
                        <div className="flex flex-wrap gap-2">
                          {summary.sentiment.highlights.map((item, i) => {
                            const text = typeof item === 'string' 
                              ? item 
                              : (item && typeof item === 'object' && 'text' in item) 
                                ? item.text 
                                : String(item)
                            const messageIndex = (item && typeof item === 'object' && 'messageIndex' in item) 
                              ? item.messageIndex 
                              : undefined
                            return (
                              <Badge key={i} variant="secondary" className="text-xs inline-flex items-center gap-1">
                                {'"'}{text}{'"'}
                                <SingleSlackLink messageRefs={summary.messageRefs} index={messageIndex} />
                              </Badge>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
