'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { 
  Users, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  UserMinus,
  X,
  Crown,
  User
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { TimeRangeSelector } from '@/components/time-range-selector'
import { TeamMemberCard } from '@/components/dashboard/team-member-card'
import { TeamSummaryCard } from '@/components/dashboard/team-summary-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { TeamMember, TeamMemberRole, TeamMemberRelationship, TimeRangePreset, TeamGroup } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch data')
    throw error
  }
  return res.json()
}

const COLORS: Record<string, { bg: string; text: string; ring: string; bgActive: string }> = {
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-600', ring: 'ring-pink-500', bgActive: 'bg-pink-50' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600', ring: 'ring-blue-500', bgActive: 'bg-blue-50' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500', bgActive: 'bg-emerald-50' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500', bgActive: 'bg-amber-50' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-600', ring: 'ring-purple-500', bgActive: 'bg-purple-50' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600', ring: 'ring-cyan-500', bgActive: 'bg-cyan-50' },
  red: { bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500', bgActive: 'bg-red-50' },
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', ring: 'ring-indigo-500', bgActive: 'bg-indigo-50' },
}

function getColorClasses(colorName: string) {
  return COLORS[colorName] || COLORS.blue
}

type FilterType = 'group' | 'role' | 'relationship'

interface ActiveFilters {
  groupId: string | null
  role: TeamMemberRole | null
  relationship: TeamMemberRelationship | null
}

export default function TeamInsightsPage() {
  const [timeRange, setTimeRange] = useState<{
    preset: TimeRangePreset
    weekNumber?: number
    year?: number
  }>({ preset: '7d' })

  const [filters, setFilters] = useState<ActiveFilters>({
    groupId: null,
    role: null,
    relationship: null,
  })

  const { data: teamMembersData, isLoading, error } = useSWR<TeamMember[]>(
    '/api/settings/team-members',
    fetcher
  )
  
  const { data: teamGroupsData } = useSWR<TeamGroup[]>(
    '/api/settings/team-groups',
    fetcher
  )
  
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : []
  const teamGroups = Array.isArray(teamGroupsData) ? teamGroupsData : []
  const hasError = !!error

  // Toggle filter
  const toggleFilter = (type: FilterType, value: string | TeamMemberRole | TeamMemberRelationship | null) => {
    if (type === 'group') {
      setFilters(prev => ({
        ...prev,
        groupId: prev.groupId === value ? null : value as string | null,
      }))
    } else if (type === 'role') {
      setFilters(prev => ({
        ...prev,
        role: prev.role === value ? null : value as TeamMemberRole | null,
      }))
    } else if (type === 'relationship') {
      setFilters(prev => ({
        ...prev,
        relationship: prev.relationship === value ? null : value as TeamMemberRelationship | null,
      }))
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({ groupId: null, role: null, relationship: null })
  }

  const hasActiveFilters = filters.groupId || filters.role || filters.relationship
  
  // Get the active group
  const activeGroup = filters.groupId ? teamGroups.find(g => g.id === filters.groupId) : null

  // Filter members based on active filters
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      // Group filter - check if member is in the selected group
      if (filters.groupId) {
        const group = teamGroups.find(g => g.id === filters.groupId)
        if (!group || !group.memberIds.includes(member.id)) return false
      }
      if (filters.role && member.role !== filters.role) return false
      if (filters.relationship && member.relationship !== filters.relationship) return false
      return true
    })
  }, [teamMembers, teamGroups, filters])

  // Stats for filter cards
  const stats = useMemo(() => ({
    total: teamMembers.length,
    directReports: teamMembers.filter(m => m.relationship === 'Direct Report').length,
    skips: teamMembers.filter(m => m.relationship === 'Skip').length,
    managers: teamMembers.filter(m => m.role === 'M').length,
    ics: teamMembers.filter(m => m.role === 'IC').length,
  }), [teamMembers])

  // Get group name for summary
  const getFilterGroupName = () => {
    const parts: string[] = []
    if (activeGroup) parts.push(activeGroup.name)
    if (filters.role) parts.push(filters.role === 'M' ? 'Managers' : 'ICs')
    if (filters.relationship) parts.push(filters.relationship === 'Direct Report' ? 'Direct Reports' : 'Skip-Level')
    return parts.length > 0 ? parts.join(' - ') : 'All Team Members'
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Team Insights</h1>
            </div>
            <p className="text-muted-foreground">
              AI-powered analysis of team member activity, sentiment, and communication patterns
            </p>
          </div>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Filter Cards */}
        {teamMembers.length > 0 && (
          <div className="space-y-4 mb-8">
            {/* Active Filters Badge */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {activeGroup && (
                  <Badge variant="secondary" className="gap-1">
                    {activeGroup.name}
                    <button onClick={() => toggleFilter('group', null)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.role && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.role === 'M' ? 'Managers' : 'ICs'}
                    <button onClick={() => toggleFilter('role', null)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.relationship && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.relationship}
                    <button onClick={() => toggleFilter('relationship', null)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Clear all
                </Button>
              </div>
            )}

            {/* Built-in Filter Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Relationship Filters */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  filters.relationship === 'Direct Report' && "ring-2 ring-emerald-500 bg-emerald-50"
                )}
                onClick={() => toggleFilter('relationship', 'Direct Report')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      filters.relationship === 'Direct Report' ? "bg-emerald-500/20" : "bg-emerald-500/10"
                    )}>
                      <UserCheck className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.directReports}</p>
                      <p className="text-xs text-muted-foreground">Direct Reports</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  filters.relationship === 'Skip' && "ring-2 ring-blue-500 bg-blue-50"
                )}
                onClick={() => toggleFilter('relationship', 'Skip')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      filters.relationship === 'Skip' ? "bg-blue-500/20" : "bg-blue-500/10"
                    )}>
                      <UserMinus className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.skips}</p>
                      <p className="text-xs text-muted-foreground">Skip-Level</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Role Filters */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  filters.role === 'M' && "ring-2 ring-amber-500 bg-amber-50"
                )}
                onClick={() => toggleFilter('role', 'M')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      filters.role === 'M' ? "bg-amber-500/20" : "bg-amber-500/10"
                    )}>
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.managers}</p>
                      <p className="text-xs text-muted-foreground">Managers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  filters.role === 'IC' && "ring-2 ring-purple-500 bg-purple-50"
                )}
                onClick={() => toggleFilter('role', 'IC')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      filters.role === 'IC' ? "bg-purple-500/20" : "bg-purple-500/10"
                    )}>
                      <User className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.ics}</p>
                      <p className="text-xs text-muted-foreground">ICs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Custom Team Groups */}
            {teamGroups.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {teamGroups.map((group) => {
                  const colorClasses = getColorClasses(group.color)
                  const memberCount = group.memberIds.length
                  const isActive = filters.groupId === group.id
                  
                  return (
                    <Card 
                      key={group.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md",
                        isActive && `ring-2 ${colorClasses.ring} ${colorClasses.bgActive}`
                      )}
                      onClick={() => toggleFilter('group', group.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            isActive ? colorClasses.bg.replace('/10', '/20') : colorClasses.bg
                          )}>
                            <Users className={cn("h-5 w-5", colorClasses.text)} />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{memberCount}</p>
                            <p className="text-xs text-muted-foreground">{group.name}</p>
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
        ) : hasError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              Unable to load team members. Please check that Upstash Redis is properly configured.
            </AlertDescription>
          </Alert>
        ) : teamMembers.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No team members configured</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>Add team members in Settings to start getting insights.</span>
              <Button variant="outline" size="sm" asChild>
                <a href="/settings">Go to Settings</a>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-8">
            {/* Team Summary Card - shows for filtered groups */}
            {filteredMembers.length > 0 && (
              <TeamSummaryCard
                groupName={getFilterGroupName()}
                members={filteredMembers}
                timeRange={timeRange}
              />
            )}

            {/* Filtered Team Members */}
            {filteredMembers.length > 0 ? (
              <section>
                <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">
                    {hasActiveFilters ? `Filtered Results` : 'All Team Members'}
                  </h2>
                  <Badge variant="secondary" className="ml-auto">{filteredMembers.length}</Badge>
                </div>
                <div className="space-y-4">
                  {filteredMembers.map((member) => (
                    <TeamMemberCard
                      key={member.id}
                      member={member}
                      timeRange={timeRange}
                    />
                  ))}
                </div>
              </section>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No matching team members</AlertTitle>
                <AlertDescription>
                  No team members match the current filters. Try adjusting your filters.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
