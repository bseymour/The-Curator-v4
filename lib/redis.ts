import { Redis } from '@upstash/redis'
import type { CuratorSettings, Channel, TeamMember, TeamGroup, ChannelCategory, TodoItem, ToKnowItem } from './types'

// Initialize Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Keys
const SETTINGS_KEY = 'curator:settings'

// Default settings
const defaultSettings: CuratorSettings = {
  channels: [],
  teamMembers: [],
  teamGroups: [],
  channelCategories: [],
  todos: [],
  toKnows: [],
  lastUpdated: new Date().toISOString(),
}

// Get all settings
export async function getSettings(): Promise<CuratorSettings> {
  const settings = await redis.get<CuratorSettings>(SETTINGS_KEY)
  return settings || defaultSettings
}

// Save all settings
export async function saveSettings(settings: CuratorSettings): Promise<void> {
  settings.lastUpdated = new Date().toISOString()
  await redis.set(SETTINGS_KEY, settings)
}

// Channel operations
export async function getChannels(): Promise<Channel[]> {
  const settings = await getSettings()
  return settings.channels
}

export async function addChannel(channel: Channel): Promise<void> {
  const settings = await getSettings()
  settings.channels.push(channel)
  await saveSettings(settings)
}

export async function updateChannel(id: string, updates: Partial<Channel>): Promise<void> {
  const settings = await getSettings()
  const index = settings.channels.findIndex(c => c.id === id)
  if (index !== -1) {
    settings.channels[index] = { ...settings.channels[index], ...updates }
    await saveSettings(settings)
  }
}

export async function deleteChannel(id: string): Promise<void> {
  const settings = await getSettings()
  settings.channels = settings.channels.filter(c => c.id !== id)
  await saveSettings(settings)
}

// Team member operations
export async function getTeamMembers(): Promise<TeamMember[]> {
  const settings = await getSettings()
  return settings.teamMembers
}

export async function addTeamMember(member: TeamMember): Promise<void> {
  const settings = await getSettings()
  settings.teamMembers.push(member)
  await saveSettings(settings)
}

export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  const settings = await getSettings()
  const index = settings.teamMembers.findIndex(m => m.id === id)
  if (index !== -1) {
    settings.teamMembers[index] = { ...settings.teamMembers[index], ...updates }
    await saveSettings(settings)
  }
}

export async function deleteTeamMember(id: string): Promise<void> {
  const settings = await getSettings()
  settings.teamMembers = settings.teamMembers.filter(m => m.id !== id)
  // Also remove from any team groups
  settings.teamGroups = settings.teamGroups.map(g => ({
    ...g,
    memberIds: g.memberIds.filter(memberId => memberId !== id)
  }))
  await saveSettings(settings)
}

// Team group operations
export async function getTeamGroups(): Promise<TeamGroup[]> {
  const settings = await getSettings()
  return settings.teamGroups || []
}

export async function addTeamGroup(group: TeamGroup): Promise<void> {
  const settings = await getSettings()
  if (!settings.teamGroups) settings.teamGroups = []
  settings.teamGroups.push(group)
  await saveSettings(settings)
}

export async function updateTeamGroup(id: string, updates: Partial<TeamGroup>): Promise<void> {
  const settings = await getSettings()
  if (!settings.teamGroups) return
  const index = settings.teamGroups.findIndex(g => g.id === id)
  if (index !== -1) {
    settings.teamGroups[index] = { ...settings.teamGroups[index], ...updates }
    await saveSettings(settings)
  }
}

export async function deleteTeamGroup(id: string): Promise<void> {
  const settings = await getSettings()
  if (!settings.teamGroups) return
  settings.teamGroups = settings.teamGroups.filter(g => g.id !== id)
  await saveSettings(settings)
}

// Channel category operations
export async function getChannelCategories(): Promise<ChannelCategory[]> {
  const settings = await getSettings()
  return settings.channelCategories || []
}

export async function addChannelCategory(category: ChannelCategory): Promise<void> {
  const settings = await getSettings()
  if (!settings.channelCategories) settings.channelCategories = []
  settings.channelCategories.push(category)
  await saveSettings(settings)
}

export async function updateChannelCategory(id: string, updates: Partial<ChannelCategory>): Promise<void> {
  const settings = await getSettings()
  if (!settings.channelCategories) return
  const index = settings.channelCategories.findIndex(c => c.id === id)
  if (index !== -1) {
    settings.channelCategories[index] = { ...settings.channelCategories[index], ...updates }
    await saveSettings(settings)
  }
}

export async function deleteChannelCategory(id: string): Promise<void> {
  const settings = await getSettings()
  if (!settings.channelCategories) return
  settings.channelCategories = settings.channelCategories.filter(c => c.id !== id)
  // Also remove from any channels
  settings.channels = settings.channels.map(ch => ({
    ...ch,
    categoryIds: ch.categoryIds?.filter(catId => catId !== id) || []
  }))
  await saveSettings(settings)
}

// Todo operations
export async function getTodos(): Promise<TodoItem[]> {
  const settings = await getSettings()
  return settings.todos || []
}

export async function addTodo(todo: TodoItem): Promise<void> {
  const settings = await getSettings()
  if (!settings.todos) settings.todos = []
  settings.todos.push(todo)
  await saveSettings(settings)
}

export async function updateTodo(id: string, updates: Partial<TodoItem>): Promise<void> {
  const settings = await getSettings()
  if (!settings.todos) return
  const index = settings.todos.findIndex(t => t.id === id)
  if (index !== -1) {
    settings.todos[index] = { ...settings.todos[index], ...updates }
    await saveSettings(settings)
  }
}

export async function deleteTodo(id: string): Promise<void> {
  const settings = await getSettings()
  if (!settings.todos) return
  settings.todos = settings.todos.filter(t => t.id !== id)
  await saveSettings(settings)
}

// ToKnow operations
export async function getToKnows(): Promise<ToKnowItem[]> {
  const settings = await getSettings()
  return settings.toKnows || []
}

export async function addToKnow(toKnow: ToKnowItem): Promise<void> {
  const settings = await getSettings()
  if (!settings.toKnows) settings.toKnows = []
  settings.toKnows.push(toKnow)
  await saveSettings(settings)
}

export async function updateToKnow(id: string, updates: Partial<ToKnowItem>): Promise<void> {
  const settings = await getSettings()
  if (!settings.toKnows) return
  const index = settings.toKnows.findIndex(t => t.id === id)
  if (index !== -1) {
    settings.toKnows[index] = { ...settings.toKnows[index], ...updates }
    await saveSettings(settings)
  }
}

export async function deleteToKnow(id: string): Promise<void> {
  const settings = await getSettings()
  if (!settings.toKnows) return
  settings.toKnows = settings.toKnows.filter(t => t.id !== id)
  await saveSettings(settings)
}
