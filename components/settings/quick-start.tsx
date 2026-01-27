'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Rocket, Loader2, Check, Hash, FolderOpen, Plus } from 'lucide-react'
import type { ChannelCategory, Channel } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Default categories to seed
const DEFAULT_CATEGORIES: Omit<ChannelCategory, 'id'>[] = [
  { name: 'HQ', color: 'purple' },
  { name: 'Sales', color: 'blue' },
  { name: 'Product', color: 'emerald' },
  { name: 'Engineering', color: 'orange' },
  { name: 'Support', color: 'pink' },
]

// Suggested channels to add (these are example IDs - replace with your own)
// To find your channel IDs: Right-click a channel in Slack → "View channel details" → scroll to bottom
const SUGGESTED_CHANNELS: { name: string; slackId: string }[] = [
  // Add your own channels here, e.g.:
  // { name: 'General', slackId: 'C0EXAMPLE1' },
  // { name: 'Announcements', slackId: 'C0EXAMPLE2' },
]

export function QuickStart() {
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoriesCreated, setCategoriesCreated] = useState(false)
  const [addingChannel, setAddingChannel] = useState<string | null>(null)
  const [addedChannels, setAddedChannels] = useState<Set<string>>(new Set())

  const { data: categories } = useSWR<ChannelCategory[]>('/api/settings/channel-categories', fetcher)
  const { data: channels } = useSWR<Channel[]>('/api/settings/channels', fetcher)

  const hasCategories = categories && categories.length > 0
  const hasChannels = channels && channels.length > 0

  // Hide if already set up
  if (hasCategories && hasChannels) {
    return null
  }

  const handleCreateCategories = async () => {
    setLoadingCategories(true)
    try {
      for (const category of DEFAULT_CATEGORIES) {
        await fetch('/api/settings/channel-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category),
        })
      }
      setCategoriesCreated(true)
      mutate('/api/settings/channel-categories')
    } catch (error) {
      console.error('Failed to create categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleAddChannel = async (channelSlackId: string, channelName: string) => {
    setAddingChannel(channelSlackId)
    try {
      // First lookup the channel to verify it exists
      const lookupRes = await fetch(`/api/slack/channel?id=${channelSlackId}`)
      if (!lookupRes.ok) {
        throw new Error('Channel not found')
      }
      const channelData = await lookupRes.json()

      // Find HQ category if it exists
      const hqCategory = categories?.find(c => c.name === 'HQ')

      // Add the channel
      await fetch('/api/settings/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: channelData.name || channelName,
          slackId: channelSlackId,
          isPrivate: channelData.is_private || false,
          categoryIds: hqCategory ? [hqCategory.id] : [],
        }),
      })

      setAddedChannels(prev => new Set([...prev, channelSlackId]))
      mutate('/api/settings/channels')
    } catch (error) {
      console.error('Failed to add channel:', error)
    } finally {
      setAddingChannel(null)
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Quick Start
        </CardTitle>
        <CardDescription>
          Get started quickly with default categories and suggested channels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Default Categories</span>
            </div>
            {(hasCategories || categoriesCreated) ? (
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                <Check className="h-3 w-3 mr-1" />
                Created
              </Badge>
            ) : (
              <Button 
                size="sm" 
                onClick={handleCreateCategories}
                disabled={loadingCategories}
              >
                {loadingCategories ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Categories'
                )}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <Badge key={cat.name} variant="secondary" className="text-xs">
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Suggested Channels Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Suggested Channels</span>
          </div>
          <div className="space-y-2">
            {SUGGESTED_CHANNELS.map((channel) => {
              const isAdded = addedChannels.has(channel.slackId) || 
                channels?.some(c => c.slackId === channel.slackId)
              const isAdding = addingChannel === channel.slackId

              return (
                <div 
                  key={channel.slackId}
                  className="flex items-center justify-between p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{channel.name}</span>
                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {channel.slackId}
                    </code>
                  </div>
                  {isAdded ? (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      <Check className="h-3 w-3 mr-1" />
                      Added
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddChannel(channel.slackId, channel.name)}
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            These are common channels to follow. You can add more channels below.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
