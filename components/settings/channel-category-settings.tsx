'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Plus, Trash2, FolderOpen, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { cn } from '@/lib/utils'
import type { ChannelCategory, Channel } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

const COLORS = [
  { name: 'slate', bg: 'bg-slate-500/10', text: 'text-slate-600', ring: 'ring-slate-500' },
  { name: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-600', ring: 'ring-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500' },
  { name: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-600', ring: 'ring-purple-500' },
  { name: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-600', ring: 'ring-rose-500' },
  { name: 'teal', bg: 'bg-teal-500/10', text: 'text-teal-600', ring: 'ring-teal-500' },
  { name: 'orange', bg: 'bg-orange-500/10', text: 'text-orange-600', ring: 'ring-orange-500' },
]

function getColorClasses(colorName: string) {
  return COLORS.find(c => c.name === colorName) || COLORS[0]
}

export function ChannelCategorySettings() {
  const { data: categoriesData, isLoading, error } = useSWR<ChannelCategory[]>('/api/settings/channel-categories', fetcher)
  const { data: channelsData } = useSWR<Channel[]>('/api/settings/channels', fetcher)
  
  const categories = Array.isArray(categoriesData) ? categoriesData : []
  const channels = Array.isArray(channelsData) ? channelsData : []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ChannelCategory | null>(null)
  
  const [name, setName] = useState('')
  const [color, setColor] = useState('slate')
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('slate')

  const resetForm = () => {
    setName('')
    setColor('slate')
  }

  const handleAddCategory = async () => {
    if (!name.trim()) return

    const category: ChannelCategory = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
    }

    await fetch('/api/settings/channel-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })

    mutate('/api/settings/channel-categories')
    resetForm()
    setDialogOpen(false)
  }

  const handleEditCategory = (category: ChannelCategory) => {
    setEditingCategory(category)
    setEditName(category.name)
    setEditColor(category.color)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingCategory || !editName.trim()) return

    await fetch('/api/settings/channel-categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingCategory.id,
        name: editName.trim(),
        color: editColor,
      }),
    })

    mutate('/api/settings/channel-categories')
    setEditDialogOpen(false)
    setEditingCategory(null)
  }

  const handleDeleteCategory = async (id: string) => {
    await fetch(`/api/settings/channel-categories?id=${id}`, { method: 'DELETE' })
    mutate('/api/settings/channel-categories')
    mutate('/api/settings/channels') // Refresh channels as they may have been updated
  }

  // Count channels in each category
  const getChannelCount = (categoryId: string) => {
    return channels.filter(ch => ch.categoryIds?.includes(categoryId)).length
  }

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Channel Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium">Failed to load channel categories</p>
            <p className="text-sm mt-1 opacity-80">
              There was an error connecting to the storage.
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
              <FolderOpen className="h-5 w-5" />
              Channel Categories
            </CardTitle>
            <CardDescription>
              Create categories to organize your Slack channels (e.g., HQ, Sales, Team).
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Channel Category</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    placeholder="e.g., HQ, Sales, Team"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setColor(c.name)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          c.bg,
                          color === c.name && `ring-2 ${c.ring} ring-offset-2`
                        )}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={handleAddCategory} disabled={!name.trim()}>
                  Create Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No channel categories created yet.</p>
            <p className="text-sm">Create categories to organize your channels.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {categories.map((category) => {
              const colorClasses = getColorClasses(category.color)
              const channelCount = getChannelCount(category.id)
              
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
                      <FolderOpen className={cn("h-5 w-5", colorClasses.text)} />
                    </div>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEditCategory(category)}
                      title="Edit category"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteCategory(category.id)}
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit Category Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Channel Category</DialogTitle>
            </DialogHeader>
            
            {editingCategory && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Category Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setEditColor(c.name)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          c.bg,
                          editColor === c.name && `ring-2 ${c.ring} ring-offset-2`
                        )}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <Button className="w-full" onClick={handleSaveEdit} disabled={!editName.trim()}>
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
