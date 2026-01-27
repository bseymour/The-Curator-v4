// Custom Team Group (user-defined, like "Sales Engineers", "Dev Success", "Leadership")
export interface TeamGroup {
  id: string
  name: string
  color: string // Tailwind color name like "pink", "blue", "emerald"
  memberIds: string[] // IDs of team members in this group
}

// Custom Channel Category (user-defined, like "HQ", "Sales", "Team")
export interface ChannelCategory {
  id: string
  name: string
  color: string // Tailwind color name
}

export interface Channel {
  id: string
  name: string
  slackId: string // Required - we now select from Slack directly
  isPrivate?: boolean
  categoryIds: string[] // IDs of categories this channel belongs to
}

// Team Member Types
export type TeamMemberRole = 'IC' | 'M' // Individual Contributor or Manager
export type TeamMemberRelationship = 'Direct Report' | 'Skip'

export interface TeamMember {
  id: string
  name: string
  slackUserId?: string
  role: TeamMemberRole
  relationship: TeamMemberRelationship
  avatarUrl?: string
}

// Time Range Types
export type TimeRangePreset = '24h' | '7d' | '30d' | 'week'

export interface TimeRange {
  preset: TimeRangePreset
  weekNumber?: number // For specific week selection
  year?: number
  startDate: Date
  endDate: Date
}

// Sentiment Analysis
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed'

export interface SentimentIndicator {
  type: SentimentType
  score: number // -1 to 1
  highlights: string[] // Key phrases that indicate sentiment
}

// Channel Summary
export interface ChannelSummary {
  channelId: string
  channelName: string
  categories: ChannelCategory[]
  timeRange: TimeRange
  summary: string
  keyTopics: string[]
  messageCount: number
  activeParticipants: number
  generatedAt: Date
}

// Team Member Activity
export interface TeamMemberActivity {
  memberId: string
  memberName: string
  timeRange: TimeRange
  activitySummary: string
  keyActivities: string[]
  wins: string[]
  concerns: string[]
  sentiment: SentimentIndicator
  messageCount: number
  channelsActive: string[]
  generatedAt: Date
}

// To-Do Item
export interface TodoItem {
  id: string
  text: string
  slackLink: string | null
  channelName: string | null
  completed: boolean
  createdAt: string
  completedAt: string | null
}

// To-Know Item (informational, can be archived but not completed)
export interface ToKnowItem {
  id: string
  text: string
  slackLink: string | null
  channelName: string | null
  archived: boolean
  createdAt: string
  archivedAt: string | null
}

// Settings stored in KV
export interface CuratorSettings {
  channels: Channel[]
  teamMembers: TeamMember[]
  teamGroups: TeamGroup[]
  channelCategories: ChannelCategory[]
  todos: TodoItem[]
  toKnows: ToKnowItem[]
  lastUpdated: string
}

// Slack API Types
export interface SlackMessageAttachment {
  fallback?: string
  text?: string
  pretext?: string
  title?: string
  title_link?: string
  fields?: Array<{ title: string; value: string; short?: boolean }>
}

export interface SlackMessageBlock {
  type: string
  text?: { type: string; text: string }
  fields?: Array<{ type: string; text: string }>
  elements?: Array<{ type: string; text?: string; elements?: Array<{ type: string; text?: string }> }>
}

export interface SlackMessage {
  ts: string
  user: string
  text: string
  thread_ts?: string
  reply_count?: number
  reactions?: Array<{ name: string; count: number }>
  permalink?: string // Direct link to message in Slack
  channel?: {
    id: string
    name: string
  }
  // Bot/integration message content (Tray.io, Zapier, etc.)
  attachments?: SlackMessageAttachment[]
  blocks?: SlackMessageBlock[]
  bot_id?: string
  subtype?: string
}

export interface SlackChannel {
  id: string
  name: string
  is_member: boolean
  is_private: boolean
}

export interface SlackUser {
  id: string
  name: string
  real_name: string
  profile: {
    display_name: string
    image_48?: string
    image_72?: string
  }
}
