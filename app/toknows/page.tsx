'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { 
  Bookmark, 
  Archive, 
  ArchiveRestore,
  Trash2, 
  ExternalLink, 
  Hash,
  Loader2,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { ToKnowItem } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ToKnowsPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')
  const [newToKnowText, setNewToKnowText] = useState('')
  const [addingToKnow, setAddingToKnow] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: toKnowsData, isLoading, mutate } = useSWR<ToKnowItem[]>(
    '/api/toknows',
    fetcher
  )

  const toKnows = Array.isArray(toKnowsData) ? toKnowsData : []

  // Filter to-knows
  const filteredToKnows = toKnows.filter(toKnow => {
    if (filter === 'active') return !toKnow.archived
    if (filter === 'archived') return toKnow.archived
    return true
  })

  // Stats
  const activeToKnows = toKnows.filter(t => !t.archived).length
  const archivedToKnows = toKnows.filter(t => t.archived).length

  // Add new to-know
  const handleAddToKnow = async () => {
    if (!newToKnowText.trim()) return
    
    setAddingToKnow(true)
    try {
      await fetch('/api/toknows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newToKnowText.trim() }),
      })
      setNewToKnowText('')
      setDialogOpen(false)
      mutate()
    } catch (error) {
      console.error('Failed to add to-know:', error)
    } finally {
      setAddingToKnow(false)
    }
  }

  // Toggle archive status
  const toggleArchive = async (id: string, archived: boolean) => {
    setUpdatingIds(prev => new Set([...prev, id]))
    try {
      await fetch('/api/toknows', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, archived: !archived }),
      })
      mutate()
    } catch (error) {
      console.error('Failed to update to-know:', error)
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Delete to-know
  const deleteToKnow = async (id: string) => {
    setDeletingIds(prev => new Set([...prev, id]))
    try {
      await fetch(`/api/toknows?id=${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Failed to delete to-know:', error)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Clear all archived
  const clearArchived = async () => {
    const archivedIds = toKnows.filter(t => t.archived).map(t => t.id)
    for (const id of archivedIds) {
      await deleteToKnow(id)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Bookmark className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">To-Know</h1>
            </div>
            <p className="text-muted-foreground">
              Track informational highlights from your company and team insights
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add To-Know
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New To-Know</DialogTitle>
                <DialogDescription>
                  Add an informational item to remember.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="What should you know?"
                  value={newToKnowText}
                  onChange={(e) => setNewToKnowText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddToKnow()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddToKnow} disabled={addingToKnow || !newToKnowText.trim()}>
                  {addingToKnow ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add To-Know
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Bookmark className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{toKnows.length}</p>
                  <p className="text-xs text-muted-foreground">Total Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Bookmark className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeToKnows}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Archive className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{archivedToKnows}</p>
                  <p className="text-xs text-muted-foreground">Archived</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : toKnows.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No to-knows yet</AlertTitle>
            <AlertDescription>
              Add informational items from Company Insights or create your own to-knows to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Your To-Knows</CardTitle>
                  <CardDescription>
                    {filteredToKnows.length} {filter === 'all' ? 'total' : filter} items
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'active' | 'archived')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="all" className="text-xs px-3 h-7">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="active" className="text-xs px-3 h-7">
                          Active
                        </TabsTrigger>
                        <TabsTrigger value="archived" className="text-xs px-3 h-7">
                          Archived
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {archivedToKnows > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearArchived} className="text-xs">
                      Clear Archived
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredToKnows.map((toKnow) => {
                  const isUpdating = updatingIds.has(toKnow.id)
                  const isDeleting = deletingIds.has(toKnow.id)
                  
                  return (
                    <div
                      key={toKnow.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border transition-all",
                        toKnow.archived 
                          ? "bg-muted/50 border-muted" 
                          : "bg-card border-border hover:border-blue-500/30",
                        isDeleting && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-full",
                        toKnow.archived 
                          ? "bg-muted text-muted-foreground" 
                          : "bg-blue-500/10 text-blue-600"
                      )}>
                        <Bookmark className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-relaxed",
                          toKnow.archived && "text-muted-foreground"
                        )}>
                          {toKnow.text}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {toKnow.channelName && (
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {toKnow.channelName}
                            </Badge>
                          )}
                          
                          <span className="text-xs text-muted-foreground">
                            Added {new Date(toKnow.createdAt).toLocaleDateString()}
                          </span>
                          
                          {toKnow.archivedAt && (
                            <span className="text-xs text-amber-600">
                              Archived {new Date(toKnow.archivedAt).toLocaleDateString()}
                            </span>
                          )}
                          
                          {toKnow.slackLink && (
                            <a 
                              href={toKnow.slackLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                            >
                              View in Slack
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                          onClick={() => toggleArchive(toKnow.id, toKnow.archived)}
                          disabled={isUpdating}
                          title={toKnow.archived ? 'Restore' : 'Archive'}
                        >
                          {isUpdating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : toKnow.archived ? (
                            <ArchiveRestore className="h-4 w-4" />
                          ) : (
                            <Archive className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteToKnow(toKnow.id)}
                          disabled={isDeleting}
                          title="Delete"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
