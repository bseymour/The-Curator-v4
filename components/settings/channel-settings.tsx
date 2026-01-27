'use client'

import { useState, useMemo, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Plus, Trash2, Hash, Lock, FolderOpen, Check, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Channel, ChannelCategory, SlackChannel } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch data')
    const data = await res.json().catch(() => ({}))
    ;(error as Error & { info?: unknown }).info = data
    throw error
  }
  return res.json()
}

const COLORS: Record<string, { bg: string; text: string }> = {
  slate: { bg: 'bg-slate-500/10', text: 'text-slate-600' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-600' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-600' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
}

function getColorClasses(colorName: string) {
  return COLORS[colorName] || COLORS.slate
}

export function ChannelSettings() {
  const { data: channelsData, isLoading, error } = useSWR<Channel[]>('/api/settings/channels', fetcher)
  const { data: categoriesData } = useSWR<ChannelCategory[]>('/api/settings/channel-categories', fetcher)
  
  const channels = Array.isArray(channelsData) ? channelsData : []
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [manualChannelId, setManualChannelId] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [selectedSlackChannel, setSelectedSlackChannel] = useState<SlackChannel | null>(null)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search for channels on-demand
  const { data: searchResults, isLoading: searchLoading } = useSWR<SlackChannel[]>(
    debouncedSearch.length >= 2 ? `/api/slack/channels/search?q=${encodeURIComponent(debouncedSearch)}` : null,
    fetcher
  )

  // Filter out already-added channels from search results
  const filteredChannels = useMemo(() => {
    const results = Array.isArray(searchResults) ? searchResults : []
    const addedIds = new Set(channels.map(c => c.slackId))
    return results.filter(sc => !addedIds.has(sc.id))
  }, [searchResults, channels])

  // Lookup channel by ID
  const handleLookupChannelById = async () => {
    if (!manualChannelId.trim()) return
    
    setIsLookingUp(true)
    setLookupError(null)
    
    try {
      const response = await fetch(`/api/slack/channels/search?id=${encodeURIComponent(manualChannelId.trim())}`)
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        const channel = data[0]
        if (channels.some(c => c.slackId === channel.id)) {
          setLookupError('This channel has already been added')
        } else {
          setSelectedSlackChannel(channel)
          setLookupError(null)
        }
      } else {
        setLookupError('Channel not found. Check the ID and ensure you have access.')
      }
    } catch {
      setLookupError('Failed to lookup channel')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleAddChannel = async () => {
    if (!selectedSlackChannel) return

    const channel: Channel = {
      id: crypto.randomUUID(),
      name: selectedSlackChannel.name,
      slackId: selectedSlackChannel.id,
      isPrivate: selectedSlackChannel.is_private,
      categoryIds: selectedCategoryIds,
    }

    await fetch('/api/settings/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel),
    })

    mutate('/api/settings/channels')
    resetForm()
    setDialogOpen(false)
  }

  const resetForm = () => {
    setSelectedSlackChannel(null)
    setSelectedCategoryIds([])
    setSearchQuery('')
    setDebouncedSearch('')
    setManualChannelId('')
    setLookupError(null)
  }

  const handleDeleteChannel = async (id: string) => {
    await fetch(`/api/settings/channels?id=${id}`, { method: 'DELETE' })
    mutate('/api/settings/channels')
  }

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel)
    setEditCategoryIds(channel.categoryIds || [])
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingChannel) return

    await fetch('/api/settings/channels', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingChannel.id,
        categoryIds: editCategoryIds,
      }),
    })

    mutate('/api/settings/channels')
    setEditDialogOpen(false)
    setEditingChannel(null)
    setEditCategoryIds([])
  }

  const toggleEditCategory = (categoryId: string) => {
    setEditCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Get category names for a channel
  const getCategoryNames = (categoryIds: string[]) => {
    return categoryIds
      .map(id => categories.find(c => c.id === id))
      .filter(Boolean) as ChannelCategory[]
  }

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium">Failed to load channel settings</p>
            <p className="text-sm mt-1 opacity-80">
              There was an error connecting to the storage. Please check that Upstash Redis is properly configured.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Channels
            </CardTitle>
            <CardDescription>
              Select Slack channels to monitor. Channels can belong to multiple categories.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Channel</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Channel ID</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., C01234567"
                      value={manualChannelId}
                      onChange={(e) => {
                        setManualChannelId(e.target.value)
                        setLookupError(null)
                        setSelectedSlackChannel(null)
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={handleLookupChannelById}
                      disabled={!manualChannelId.trim() || isLookingUp}
                    >
                      {isLookingUp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Lookup'
                      )}
                    </Button>
                  </div>
                  {lookupError && (
                    <p className="text-xs text-destructive">{lookupError}</p>
                  )}
                  {selectedSlackChannel && (
                    <div className="p-3 rounded-lg border bg-muted/50 flex items-center gap-2">
                      {selectedSlackChannel.is_private ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Hash className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{selectedSlackChannel.name}</span>
                      {selectedSlackChannel.is_private && (
                        <Badge variant="outline" className="text-xs">Private</Badge>
                      )}
                      <Check className="h-4 w-4 text-green-500 ml-auto" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Find the channel ID in Slack: right-click channel → View channel details → scroll to bottom.
                  </p>
                </div>
              </div>

              {selectedSlackChannel && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-3">
                    <Label>Categories (optional)</Label>
                    {categories.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No categories created yet. Create categories in the Channel Categories section above.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => {
                          const colorClasses = getColorClasses(category.color)
                          const isSelected = selectedCategoryIds.includes(category.id)
                          
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => toggleCategory(category.id)}
                              className={cn(
                                "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                                isSelected 
                                  ? "border-primary bg-primary/5" 
                                  : "border-border hover:border-primary/50"
                              )}
                            >
                              <Checkbox 
                                checked={isSelected}
                                className="pointer-events-none"
                              />
                              <div className={cn("p-1.5 rounded", colorClasses.bg)}>
                                <FolderOpen className={cn("h-3 w-3", colorClasses.text)} />
                              </div>
                              <span className="font-medium text-sm">{category.name}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleAddChannel}
                  >
                    Add Channel
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {channels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No channels configured yet.</p>
            <p className="text-sm">Add Slack channels to start monitoring.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {channels.map((channel) => {
              const channelCategories = getCategoryNames(channel.categoryIds || [])
              
              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {channel.isPrivate ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      {channelCategories.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {channelCategories.map((cat) => {
                            const colorClasses = getColorClasses(cat.color)
                            return (
                              <Badge 
                                key={cat.id} 
                                variant="secondary" 
                                className={cn("text-xs", colorClasses.bg, colorClasses.text)}
                              >
                                {cat.name}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEditChannel(channel)}
                      title="Edit categories"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteChannel(channel.id)}
                      title="Remove channel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit Channel Categories Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingChannel(null)
            setEditCategoryIds([])
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Channel Categories</DialogTitle>
            </DialogHeader>
            
            {editingChannel && (
              <div className="space-y-4 pt-4">
                <div className="p-3 rounded-lg border bg-muted/50 flex items-center gap-2">
                  {editingChannel.isPrivate ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Hash className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-medium">{editingChannel.name}</span>
                </div>

                <div className="space-y-3">
                  <Label>Categories</Label>
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No categories created yet. Create categories in the Channel Categories section.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => {
                        const colorClasses = getColorClasses(category.color)
                        const isSelected = editCategoryIds.includes(category.id)
                        
                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => toggleEditCategory(category.id)}
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-lg border text-left transition-colors",
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <Checkbox 
                              checked={isSelected}
                              className="pointer-events-none"
                            />
                            <div className={cn("p-1.5 rounded", colorClasses.bg)}>
                              <FolderOpen className={cn("h-3 w-3", colorClasses.text)} />
                            </div>
                            <span className="font-medium text-sm">{category.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Button className="w-full" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
