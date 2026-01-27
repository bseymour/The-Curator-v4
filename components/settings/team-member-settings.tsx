'use client'

import { useState, useMemo, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Plus, Trash2, Users, User, Check, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { 
  TeamMember, 
  TeamMemberRole, 
  TeamMemberRelationship,
  SlackUser 
} from '@/lib/types'

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

export function TeamMemberSettings() {
  const { data: teamMembersData, isLoading, error } = useSWR<TeamMember[]>('/api/settings/team-members', fetcher)
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [manualUserId, setManualUserId] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<SlackUser | null>(null)
  const [role, setRole] = useState<TeamMemberRole>('IC')
  const [relationship, setRelationship] = useState<TeamMemberRelationship>('Direct Report')
  const [editRole, setEditRole] = useState<TeamMemberRole>('IC')
  const [editRelationship, setEditRelationship] = useState<TeamMemberRelationship>('Direct Report')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search for users on-demand
  const { data: searchResults, isLoading: searchLoading } = useSWR<SlackUser[]>(
    debouncedSearch.length >= 2 ? `/api/slack/users/search?q=${encodeURIComponent(debouncedSearch)}` : null,
    fetcher
  )

  // Filter out already-added users from search results
  const filteredUsers = useMemo(() => {
    const results = Array.isArray(searchResults) ? searchResults : []
    const addedIds = new Set(teamMembers.map(m => m.slackUserId))
    return results.filter(u => !addedIds.has(u.id))
  }, [searchResults, teamMembers])

  // Lookup user by ID
  const handleLookupUserById = async () => {
    if (!manualUserId.trim()) return
    
    setIsLookingUp(true)
    setLookupError(null)
    
    try {
      const response = await fetch(`/api/slack/users/search?id=${encodeURIComponent(manualUserId.trim())}`)
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        const user = data[0]
        if (teamMembers.some(m => m.slackUserId === user.id)) {
          setLookupError('This user has already been added')
        } else {
          setSelectedUser(user)
          setLookupError(null)
        }
      } else {
        setLookupError('User not found. Check the ID.')
      }
    } catch {
      setLookupError('Failed to lookup user')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleAddMember = async () => {
    if (!selectedUser) return
    
    const member: TeamMember = {
      id: crypto.randomUUID(),
      name: selectedUser.real_name || selectedUser.name,
      slackUserId: selectedUser.id,
      role,
      relationship,
      avatarUrl: selectedUser.profile.image_72,
    }

    await fetch('/api/settings/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    })

    mutate('/api/settings/team-members')
    resetForm()
    setDialogOpen(false)
  }

  const resetForm = () => {
    setSelectedUser(null)
    setRole('IC')
    setRelationship('Direct Report')
    setSearchQuery('')
    setDebouncedSearch('')
    setManualUserId('')
    setLookupError(null)
  }

  const handleDeleteMember = async (id: string) => {
    await fetch(`/api/settings/team-members?id=${id}`, { method: 'DELETE' })
    mutate('/api/settings/team-members')
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setEditRole(member.role)
    setEditRelationship(member.relationship)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingMember) return

    await fetch('/api/settings/team-members', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingMember.id,
        role: editRole,
        relationship: editRelationship,
      }),
    })

    mutate('/api/settings/team-members')
    setEditDialogOpen(false)
    setEditingMember(null)
  }

  const groupedMembers = teamMembers.reduce((acc, member) => {
    if (!acc[member.relationship]) {
      acc[member.relationship] = []
    }
    acc[member.relationship].push(member)
    return acc
  }, {} as Record<TeamMemberRelationship, TeamMember[]>)

if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium">Failed to load team member settings</p>
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
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Select team members to monitor their activities and sentiment.
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Slack User ID</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., U01234567"
                      value={manualUserId}
                      onChange={(e) => {
                        setManualUserId(e.target.value)
                        setLookupError(null)
                        setSelectedUser(null)
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      onClick={handleLookupUserById}
                      disabled={!manualUserId.trim() || isLookingUp}
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
                  {selectedUser && (
                    <div className="p-3 rounded-lg border bg-muted/50 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.profile.image_72 || "/placeholder.svg"} alt={selectedUser.real_name} />
                        <AvatarFallback>
                          {(selectedUser.real_name || selectedUser.name).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{selectedUser.real_name || selectedUser.name}</div>
                        {selectedUser.profile.display_name && (
                          <div className="text-xs text-muted-foreground">@{selectedUser.profile.display_name}</div>
                        )}
                      </div>
                      <Check className="h-4 w-4 text-green-500" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Find the user ID in Slack: click on profile → More → Copy member ID.
                  </p>
                </div>
              </div>

              {selectedUser && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={role} onValueChange={(v) => setRole(v as TeamMemberRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IC">IC (Individual Contributor)</SelectItem>
                          <SelectItem value="M">M (Manager)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Relationship</Label>
                      <Select value={relationship} onValueChange={(v) => setRelationship(v as TeamMemberRelationship)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Direct Report">Direct Report</SelectItem>
                          <SelectItem value="Skip">Skip (Skip-level report)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleAddMember}>
                    Add Team Member
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team members configured yet.</p>
            <p className="text-sm">Add team members to track their activities and sentiment.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(['Direct Report', 'Skip'] as TeamMemberRelationship[]).map((rel) => {
              const members = groupedMembers[rel] || []
              if (members.length === 0) return null

              return (
                <div key={rel}>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{rel}s</span>
                    <Badge variant="secondary" className="text-xs">
                      {members.length}
                    </Badge>
                  </div>
                  <div className="grid gap-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback>
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {member.role === 'IC' ? 'Individual Contributor' : 'Manager'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleEditMember(member)}
                            title="Edit member"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteMember(member.id)}
                            title="Remove member"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit Team Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditingMember(null)
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            
            {editingMember && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg border bg-muted/50 flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={editingMember.avatarUrl || "/placeholder.svg"} alt={editingMember.name} />
                    <AvatarFallback>
                      {editingMember.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{editingMember.name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={editRole} onValueChange={(v) => setEditRole(v as TeamMemberRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IC">IC (Individual Contributor)</SelectItem>
                        <SelectItem value="M">M (Manager)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select value={editRelationship} onValueChange={(v) => setEditRelationship(v as TeamMemberRelationship)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Direct Report">Direct Report</SelectItem>
                        <SelectItem value="Skip">Skip (Skip-level report)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
