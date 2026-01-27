'use client'

import useSWR from 'swr'
import Link from 'next/link'
import { Building2, Users, Hash, AlertCircle, Loader2, ArrowRight, Settings, Zap, ListTodo, CheckCircle2 } from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Channel, TeamMember, TodoItem } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch data')
    throw error
  }
  return res.json()
}

export default function DashboardPage() {
  const { data: channelsData, isLoading: channelsLoading, error: channelsError } = useSWR<Channel[]>(
    '/api/settings/channels',
    fetcher
  )
  const { data: teamMembersData, isLoading: membersLoading, error: membersError } = useSWR<TeamMember[]>(
    '/api/settings/team-members',
    fetcher
  )
  const { data: todosData } = useSWR<TodoItem[]>(
    '/api/todos',
    fetcher
  )

  const channels = Array.isArray(channelsData) ? channelsData : []
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : []
  const todos = Array.isArray(todosData) ? todosData : []
  const activeTodos = todos.filter(t => !t.completed)
  const completedTodos = todos.filter(t => t.completed)
  const isLoading = channelsLoading || membersLoading
  const hasError = channelsError || membersError
  const hasNoConfig = !isLoading && !hasError && channels.length === 0 && teamMembers.length === 0

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Zap className="h-4 w-4" />
            AI-Powered Insights
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Your Slack Intelligence Hub
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get actionable insights from your team communications with AI-powered analysis of sentiment, activities, and trends.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : hasError ? (
          <div className="max-w-xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">Unable to connect to the storage backend. Please check that Upstash Redis is properly configured.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Check Settings
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : hasNoConfig ? (
          <div className="max-w-xl mx-auto">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Get started with Pulse</AlertTitle>
              <AlertDescription className="mt-2">
                <p className="mb-3">Add channels and team members in Settings to start getting AI-powered insights.</p>
                <Button asChild>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    Go to Settings
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Team Insights Card */}
            <Link href="/team" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group-hover:bg-muted/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-2xl mt-4">Team Insights</CardTitle>
                  <CardDescription className="text-base">
                    Monitor team member activity, sentiment, and communication patterns. Get early warning indicators for 1:1 conversations.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">
                        {teamMembers.length}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Team Members</span>
                    </div>
                    {teamMembers.filter(m => m.relationship === 'Direct Report').length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {teamMembers.filter(m => m.relationship === 'Direct Report').length}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Direct Reports</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Company Insights Card */}
            <Link href="/company" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group-hover:bg-muted/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Hash className="h-8 w-8 text-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-2xl mt-4">Company Insights</CardTitle>
                  <CardDescription className="text-base">
                    Summarize channel activity across your organization. Track key topics, decisions, and action items.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">
                        {channels.length}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Channels</span>
                    </div>
                    {channels.filter(c => c.isPrivate).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {channels.filter(c => c.isPrivate).length}
                        </Badge>
                        <span className="text-sm text-muted-foreground">Private</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* To-Dos Card */}
            <Link href="/todos" className="block group">
              <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group-hover:bg-muted/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <ListTodo className="h-8 w-8 text-primary" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-2xl mt-4">To-Dos</CardTitle>
                  <CardDescription className="text-base">
                    Track action items from your insights. Mark tasks complete and stay on top of follow-ups.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-semibold">
                        {activeTodos.length}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    {completedTodos.length > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">{completedTodos.length} completed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        {!hasNoConfig && !isLoading && (
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Manage Settings
              </Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
