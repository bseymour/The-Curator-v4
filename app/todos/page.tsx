'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { 
  ListTodo, 
  Check, 
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
import { Checkbox } from '@/components/ui/checkbox'
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
import type { TodoItem } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TodosPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [newTodoText, setNewTodoText] = useState('')
  const [addingTodo, setAddingTodo] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: todosData, isLoading, mutate } = useSWR<TodoItem[]>(
    '/api/todos',
    fetcher
  )

  const todos = Array.isArray(todosData) ? todosData : []

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  // Stats
  const activeTodos = todos.filter(t => !t.completed).length
  const completedTodos = todos.filter(t => t.completed).length

  // Add new todo
  const handleAddTodo = async () => {
    if (!newTodoText.trim()) return
    
    setAddingTodo(true)
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodoText.trim() }),
      })
      setNewTodoText('')
      setDialogOpen(false)
      mutate()
    } catch (error) {
      console.error('Failed to add todo:', error)
    } finally {
      setAddingTodo(false)
    }
  }

  // Toggle todo completion
  const toggleTodo = async (id: string, completed: boolean) => {
    setUpdatingIds(prev => new Set([...prev, id]))
    try {
      await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: !completed }),
      })
      mutate()
    } catch (error) {
      console.error('Failed to update todo:', error)
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Delete todo
  const deleteTodo = async (id: string) => {
    setDeletingIds(prev => new Set([...prev, id]))
    try {
      await fetch(`/api/todos?id=${id}`, { method: 'DELETE' })
      mutate()
    } catch (error) {
      console.error('Failed to delete todo:', error)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Clear all completed todos
  const clearCompleted = async () => {
    const completedIds = todos.filter(t => t.completed).map(t => t.id)
    for (const id of completedIds) {
      await deleteTodo(id)
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
              <div className="p-2 rounded-lg bg-primary/10">
                <ListTodo className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">To-Dos</h1>
            </div>
            <p className="text-muted-foreground">
              Track action items from your company and team insights
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add To-Do
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New To-Do</DialogTitle>
                <DialogDescription>
                  Create a new task to track.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="What needs to be done?"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTodo} disabled={addingTodo || !newTodoText.trim()}>
                  {addingTodo ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add To-Do
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
                <div className="p-2 rounded-lg bg-primary/10">
                  <ListTodo className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todos.length}</p>
                  <p className="text-xs text-muted-foreground">Total To-Dos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeTodos}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedTodos}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : todos.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No to-dos yet</AlertTitle>
            <AlertDescription>
              Add action items from Company Insights or create your own to-dos to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Your To-Dos</CardTitle>
                  <CardDescription>
                    {filteredTodos.length} {filter === 'all' ? 'total' : filter} items
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'active' | 'completed')}>
                      <TabsList className="h-8">
                        <TabsTrigger value="all" className="text-xs px-3 h-7">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="active" className="text-xs px-3 h-7">
                          Active
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="text-xs px-3 h-7">
                          Completed
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  {completedTodos > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-xs">
                      Clear Completed
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredTodos.map((todo) => {
                  const isUpdating = updatingIds.has(todo.id)
                  const isDeleting = deletingIds.has(todo.id)
                  
                  return (
                    <div
                      key={todo.id}
                      className={cn(
                        "flex items-start gap-3 p-4 rounded-lg border transition-all",
                        todo.completed 
                          ? "bg-muted/50 border-muted" 
                          : "bg-card border-border hover:border-primary/30",
                        isDeleting && "opacity-50"
                      )}
                    >
                      <div className="pt-0.5">
                        {isUpdating ? (
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : (
                          <Checkbox
                            checked={todo.completed}
                            onCheckedChange={() => toggleTodo(todo.id, todo.completed)}
                            className="h-5 w-5"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm leading-relaxed",
                          todo.completed && "line-through text-muted-foreground"
                        )}>
                          {todo.text}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {todo.channelName && (
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {todo.channelName}
                            </Badge>
                          )}
                          
                          <span className="text-xs text-muted-foreground">
                            Added {new Date(todo.createdAt).toLocaleDateString()}
                          </span>
                          
                          {todo.completedAt && (
                            <span className="text-xs text-emerald-600">
                              Completed {new Date(todo.completedAt).toLocaleDateString()}
                            </span>
                          )}
                          
                          {todo.slackLink && (
                            <a 
                              href={todo.slackLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              View in Slack
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTodo(todo.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
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
