'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Plus, Trash2, Users, Pencil, UserPlus, X } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { TeamGroup, TeamMember } from '@/lib/types'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }
  return res.json()
}

const COLORS = [
  { name: 'pink', bg: 'bg-pink-500/10', text: 'text-pink-600', ring: 'ring-pink-500' },
  { name: 'blue', bg: 'bg-blue-500/10', text: 'text-blue-600', ring: 'ring-blue-500' },
  { name: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', ring: 'ring-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', ring: 'ring-amber-500' },
  { name: 'purple', bg: 'bg-purple-500/10', text: 'text-purple-600', ring: 'ring-purple-500' },
  { name: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-600', ring: 'ring-cyan-500' },
  { name: 'red', bg: 'bg-red-500/10', text: 'text-red-600', ring: 'ring-red-500' },
  { name: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600', ring: 'ring-indigo-500' },
]

function getColorClasses(colorName: string) {
  return COLORS.find(c => c.name === colorName) || COLORS[0]
}

export function TeamGroupSettings() {
  const { data: groupsData, isLoading, error } = useSWR<TeamGroup[]>('/api/settings/team-groups', fetcher)
  const { data: membersData } = useSWR<TeamMember[]>('/api/settings/team-members', fetcher)
  
  const groups = Array.isArray(groupsData) ? groupsData : []
  const members = Array.isArray(membersData) ? membersData : []

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<TeamGroup | null>(null)
  const [managingGroup, setManagingGroup] = useState<TeamGroup | null>(null)
  
  const [name, setName] = useState('')
  const [color, setColor] = useState('pink')
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('pink')

  const resetForm = () => {
    setName('')
    setColor('pink')
  }

  const handleAddGroup = async () => {
    if (!name.trim()) return

    const group: TeamGroup = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color,
      memberIds: [],
    }

    await fetch('/api/settings/team-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    })

    mutate('/api/settings/team-groups')
    resetForm()
    setDialogOpen(false)
  }

  const handleEditGroup = (group: TeamGroup) => {
    setEditingGroup(group)
    setEditName(group.name)
    setEditColor(group.color)
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingGroup || !editName.trim()) return

    await fetch('/api/settings/team-groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingGroup.id,
        name: editName.trim(),
        color: editColor,
      }),
    })

    mutate('/api/settings/team-groups')
    setEditDialogOpen(false)
    setEditingGroup(null)
  }

  const handleDeleteGroup = async (id: string) => {
    await fetch(`/api/settings/team-groups?id=${id}`, { method: 'DELETE' })
    mutate('/api/settings/team-groups')
  }

  const handleManageMembers = (group: TeamGroup) => {
    setManagingGroup(group)
    setMembersDialogOpen(true)
  }

  const handleToggleMember = async (memberId: string) => {
    if (!managingGroup) return

    const newMemberIds = managingGroup.memberIds.includes(memberId)
      ? managingGroup.memberIds.filter(id => id !== memberId)
      : [...managingGroup.memberIds, memberId]

    await fetch('/api/settings/team-groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: managingGroup.id,
        memberIds: newMemberIds,
      }),
    })

    setManagingGroup({ ...managingGroup, memberIds: newMemberIds })
    mutate('/api/settings/team-groups')
  }

  if (isLoading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
            <p className="font-medium">Failed to load team groups</p>
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
              <Users className="h-5 w-5" />
              Team Groups
            </CardTitle>
            <CardDescription>
              Create custom groups to organize team members (e.g., Sales Engineers, Dev Success).
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Team Group</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Group Name</Label>
                  <Input
                    placeholder="e.g., Sales Engineers"
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

                <Button className="w-full" onClick={handleAddGroup} disabled={!name.trim()}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No team groups created yet.</p>
            <p className="text-sm">Create groups to organize your team members.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {groups.map((group) => {
              const colorClasses = getColorClasses(group.color)
              const groupMembers = members.filter(m => group.memberIds.includes(m.id))
              
              return (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", colorClasses.bg)}>
                      <Users className={cn("h-5 w-5", colorClasses.text)} />
                    </div>
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{groupMembers.length} members</span>
                        {groupMembers.length > 0 && (
                          <div className="flex -space-x-2">
                            {groupMembers.slice(0, 4).map((member) => (
                              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
                                <AvatarFallback className="text-xs">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {groupMembers.length > 4 && (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                                +{groupMembers.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleManageMembers(group)}
                      title="Manage members"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEditGroup(group)}
                      title="Edit group"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteGroup(group.id)}
                      title="Delete group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Edit Group Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) setEditingGroup(null)
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Group</DialogTitle>
            </DialogHeader>
            
            {editingGroup && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Group Name</Label>
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

        {/* Manage Members Dialog */}
        <Dialog open={membersDialogOpen} onOpenChange={(open) => {
          setMembersDialogOpen(open)
          if (!open) setManagingGroup(null)
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {managingGroup && (
                  <span className="flex items-center gap-2">
                    Manage Members - {managingGroup.name}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {managingGroup && (
              <div className="space-y-4 pt-4">
                {members.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No team members available.</p>
                    <p className="text-sm">Add team members first in the Team Members section.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {members.map((member) => {
                      const isInGroup = managingGroup.memberIds.includes(member.id)
                      return (
                        <label
                          key={member.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                            isInGroup ? "bg-primary/5 border-primary/20" : "hover:bg-muted/50"
                          )}
                        >
                          <Checkbox
                            checked={isInGroup}
                            onCheckedChange={() => handleToggleMember(member.id)}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatarUrl || "/placeholder.svg"} alt={member.name} />
                            <AvatarFallback className="text-xs">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{member.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {member.role === 'IC' ? 'Individual Contributor' : 'Manager'} · {member.relationship}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
                
                <div className="pt-2 border-t text-sm text-muted-foreground">
                  {managingGroup.memberIds.length} of {members.length} members selected
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
