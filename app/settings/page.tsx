'use client'

import { AppHeader } from '@/components/app-header'
import { ChannelSettings } from '@/components/settings/channel-settings'
import { TeamMemberSettings } from '@/components/settings/team-member-settings'
import { TeamGroupSettings } from '@/components/settings/team-group-settings'
import { ChannelCategorySettings } from '@/components/settings/channel-category-settings'
import { QuickStart } from '@/components/settings/quick-start'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoIcon, Key } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure channels and team members to monitor
          </p>
        </div>

        <div className="space-y-6">
          {/* Quick Start - shows when no categories/channels configured */}
          <QuickStart />

          {/* Slack Token Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Key className="h-5 w-5" />
                Slack Connection
              </CardTitle>
              <CardDescription>
                Your Slack User OAuth Token is configured via environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <InfoIcon className="h-4 w-4" />
                <AlertDescription>
                  Set <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs">SLACK_USER_OAUTH_TOKEN</code> in 
                  your environment variables. You can create a Slack app and get a User OAuth Token with the following 
                  scopes: <code className="font-mono text-xs">channels:history</code>, <code className="font-mono text-xs">channels:read</code>, <code className="font-mono text-xs">groups:history</code>, <code className="font-mono text-xs">groups:read</code>, <code className="font-mono text-xs">users:read</code>, <code className="font-mono text-xs">search:read</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Channel Categories */}
          <ChannelCategorySettings />

          {/* Channel Settings */}
          <ChannelSettings />

          {/* Team Groups */}
          <TeamGroupSettings />

          {/* Team Member Settings */}
          <TeamMemberSettings />
        </div>
      </main>
    </div>
  )
}
