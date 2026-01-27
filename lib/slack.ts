import type { SlackMessage, SlackChannel, SlackUser, TimeRange } from './types'

// Extract readable text from a Slack message, handling different formats
// (plain text, attachments from Tray.io/Zapier, blocks, etc.)
export function extractMessageText(message: SlackMessage): string {
  const textParts: string[] = []
  
  // 1. Primary text field
  if (message.text && message.text.trim()) {
    textParts.push(message.text.trim())
  }
  
  // 2. Extract from attachments (common for Tray.io, Zapier, etc.)
  if (message.attachments && message.attachments.length > 0) {
    for (const attachment of message.attachments) {
      // Title
      if (attachment.title) {
        textParts.push(attachment.title)
      }
      // Pretext
      if (attachment.pretext) {
        textParts.push(attachment.pretext)
      }
      // Main text
      if (attachment.text) {
        textParts.push(attachment.text)
      }
      // Fallback (used when rich content can't be displayed)
      if (attachment.fallback && !attachment.text) {
        textParts.push(attachment.fallback)
      }
      // Fields (key-value pairs)
      if (attachment.fields && attachment.fields.length > 0) {
        for (const field of attachment.fields) {
          textParts.push(`${field.title}: ${field.value}`)
        }
      }
    }
  }
  
  // 3. Extract from blocks (Block Kit format)
  if (message.blocks && message.blocks.length > 0) {
    for (const block of message.blocks) {
      // Section block text
      if (block.text?.text) {
        textParts.push(block.text.text)
      }
      // Section block fields
      if (block.fields) {
        for (const field of block.fields) {
          if (field.text) {
            textParts.push(field.text)
          }
        }
      }
      // Rich text elements
      if (block.elements) {
        for (const element of block.elements) {
          if (element.text) {
            textParts.push(element.text)
          }
          // Nested elements (rich_text_section contains elements)
          if (element.elements) {
            for (const nested of element.elements) {
              if (nested.text) {
                textParts.push(nested.text)
              }
            }
          }
        }
      }
    }
  }
  
  // Deduplicate and join (sometimes text appears in multiple places)
  const uniqueParts = [...new Set(textParts.filter(p => p && p.trim()))]
  return uniqueParts.join('\n')
}

const SLACK_API_BASE = 'https://slack.com/api'

function getSlackToken(): string {
  const token = process.env.SLACK_USER_OAUTH_TOKEN
  if (!token) {
    throw new Error('SLACK_USER_OAUTH_TOKEN is not configured')
  }
  return token
}

async function slackFetch<T>(endpoint: string, params: Record<string, string> = {}, retries = 3): Promise<T> {
  const url = new URL(`${SLACK_API_BASE}/${endpoint}`)
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value)
  })

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${getSlackToken()}`,
      'Content-Type': 'application/json',
    },
  })

  const data = await response.json()
  
  // Handle rate limiting with exponential backoff - check BEFORE other error handling
  if (data.error === 'ratelimited') {
    if (retries > 0) {
      const retryAfter = response.headers.get('Retry-After')
      const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, 4 - retries) * 1000
      console.log(`Slack rate limited, waiting ${waitTime}ms before retry (${retries} retries left)`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return slackFetch<T>(endpoint, params, retries - 1)
    }
    // Out of retries - throw a user-friendly error
    throw new Error('Slack API is rate limited. Please wait a minute and try again.')
  }
  
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`)
  }

  return data
}

// Get list of channels the user is a member of (including private channels)
export async function getChannels(): Promise<SlackChannel[]> {
  const allChannels: SlackChannel[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = {
      types: 'public_channel,private_channel',
      limit: '1000', // Request more per page
      exclude_archived: 'true',
    }
    if (cursor) {
      params.cursor = cursor
    }

    const data = await slackFetch<{
      channels: Array<SlackChannel & { is_member?: boolean }>
      response_metadata?: { next_cursor?: string }
    }>('conversations.list', params)

    // Include all channels returned - conversations.list with these types
    // already returns channels the user has access to
    // Private channels require membership, public channels are visible to all
    allChannels.push(...data.channels)
    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return allChannels
}

// Get a channel by ID
export async function getChannelById(channelId: string): Promise<SlackChannel | null> {
  try {
    const data = await slackFetch<{ channel: SlackChannel }>('conversations.info', {
      channel: channelId,
    })
    return data.channel
  } catch {
    return null
  }
}

// Get channel info by name
export async function getChannelByName(name: string): Promise<SlackChannel | null> {
  const channels = await getChannels()
  return channels.find(c => c.name === name || c.name === name.replace('#', '')) || null
}

// Get messages from a channel within a time range
export async function getChannelMessages(
  channelId: string,
  timeRange: TimeRange
): Promise<SlackMessage[]> {
  const oldest = Math.floor(timeRange.startDate.getTime() / 1000).toString()
  const latest = Math.floor(timeRange.endDate.getTime() / 1000).toString()

  const allMessages: SlackMessage[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = {
      channel: channelId,
      oldest,
      latest,
      limit: '200',
    }
    if (cursor) {
      params.cursor = cursor
    }

    const data = await slackFetch<{
      messages: SlackMessage[]
      response_metadata?: { next_cursor?: string }
    }>('conversations.history', params)

    allMessages.push(...data.messages)
    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return allMessages
}

// Get messages from a user across channels
export async function getUserMessages(
  userId: string,
  channelIds: string[],
  timeRange: TimeRange
): Promise<{ channelId: string; messages: SlackMessage[] }[]> {
  const results: { channelId: string; messages: SlackMessage[] }[] = []

  for (const channelId of channelIds) {
    const messages = await getChannelMessages(channelId, timeRange)
    const userMessages = messages.filter(m => m.user === userId)
    if (userMessages.length > 0) {
      results.push({ channelId, messages: userMessages })
    }
  }

  return results
}

// Search for messages from a user across ALL accessible channels
export async function searchUserMessagesGlobal(
  userId: string,
  timeRange: TimeRange
): Promise<{ messages: Array<SlackMessage & { channel?: { id: string; name: string } }>; channelNames: string[] }> {
  const oldest = Math.floor(timeRange.startDate.getTime() / 1000)
  const latest = Math.floor(timeRange.endDate.getTime() / 1000)

  // Build date filter for search query
  const afterDate = timeRange.startDate.toISOString().split('T')[0]
  const beforeDate = timeRange.endDate.toISOString().split('T')[0]

  try {
    // First, get the user's username from their ID
    // The search API requires username, not user ID
    const user = await getUser(userId)
    if (!user) {
      console.error('Could not find user with ID:', userId)
      return { messages: [], channelNames: [] }
    }
    
    // Use the username (not display name) for the from: filter
    const username = user.name
    
    // Use search.messages which searches across all channels the user has access to
    const allMessages: Array<SlackMessage & { channel?: { id: string; name: string } }> = []
    let page = 1
    const maxPages = 5 // Limit to avoid rate limiting
    
    while (page <= maxPages) {
      // Use from:<username> syntax for Slack search
      const searchQuery = `from:${username} after:${afterDate} before:${beforeDate}`
      
      const data = await slackFetch<{
        messages: { 
          matches: Array<SlackMessage & { channel?: { id: string; name: string }; permalink?: string }>
          paging?: { pages: number; page: number; total: number }
        }
      }>('search.messages', {
        query: searchQuery,
        sort: 'timestamp',
        sort_dir: 'desc',
        count: '100',
        page: page.toString(),
      })

      if (data.messages?.matches) {
        // Filter by exact time range (search uses date, not timestamp)
        const filtered = data.messages.matches.filter(m => {
          const ts = parseFloat(m.ts)
          return ts >= oldest && ts <= latest
        })
        allMessages.push(...filtered)
      }

      // Check if there are more pages
      const paging = data.messages?.paging
      if (!paging || page >= paging.pages) {
        break
      }
      page++
    }

    // Extract unique channel names
    const channelNames = [...new Set(
      allMessages
        .filter(m => m.channel?.name)
        .map(m => m.channel!.name)
    )]

    return { messages: allMessages, channelNames }
  } catch (error) {
    console.error('search.messages error:', error)
    // search.messages may not be available with all token types
    // Fall back to empty results
    return { messages: [], channelNames: [] }
  }
}

// Get user info
export async function getUser(userId: string): Promise<SlackUser | null> {
  try {
    const data = await slackFetch<{ user: SlackUser }>('users.info', {
      user: userId,
    })
    return data.user
  } catch {
    return null
  }
}

// Search for users by name/email (more efficient than loading all)
export async function searchUsers(query: string): Promise<SlackUser[]> {
  if (!query || query.length < 2) {
    return []
  }
  
  // Use the first page of users and filter - more efficient for search
  const data = await slackFetch<{
    members: SlackUser[]
  }>('users.list', {
    limit: '500',
  })

  const lowerQuery = query.toLowerCase()
  return data.members.filter(u => 
    !u.is_bot && 
    !u.deleted && 
    u.id !== 'USLACKBOT' &&
    (
      u.name.toLowerCase().includes(lowerQuery) ||
      u.real_name?.toLowerCase().includes(lowerQuery) ||
      u.profile?.display_name?.toLowerCase().includes(lowerQuery) ||
      u.profile?.email?.toLowerCase().includes(lowerQuery)
    )
  ).slice(0, 50) // Limit results
}

// Search for channels by name (more efficient than loading all)
export async function searchChannels(query: string): Promise<SlackChannel[]> {
  if (!query || query.length < 2) {
    return []
  }
  
  // Get first page of channels and filter
  const data = await slackFetch<{
    channels: SlackChannel[]
  }>('conversations.list', {
    types: 'public_channel,private_channel',
    limit: '500',
    exclude_archived: 'true',
  })

  const lowerQuery = query.toLowerCase()
  return data.channels.filter(c => 
    c.name.toLowerCase().includes(lowerQuery)
  ).slice(0, 50) // Limit results
}

// Get all users in the workspace (with pagination) - use searchUsers for better perf
export async function getUsers(): Promise<SlackUser[]> {
  const allUsers: SlackUser[] = []
  let cursor: string | undefined

  do {
    const params: Record<string, string> = {
      limit: '200',
    }
    if (cursor) {
      params.cursor = cursor
    }

    const data = await slackFetch<{
      members: SlackUser[]
      response_metadata?: { next_cursor?: string }
    }>('users.list', params)

    // Filter out bots and deleted users
    const realUsers = data.members.filter(u => 
      !u.is_bot && 
      !u.deleted && 
      u.id !== 'USLACKBOT' &&
      !u.name.includes('bot')
    )
    allUsers.push(...realUsers)
    cursor = data.response_metadata?.next_cursor
  } while (cursor)

  return allUsers
}

// Calculate time range dates
export function calculateTimeRange(preset: string, weekNumber?: number, year?: number): TimeRange {
  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  switch (preset) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'week':
      if (weekNumber && year) {
        // Calculate start of the specified week
        const jan1 = new Date(year, 0, 1)
        const daysToFirstMonday = (8 - jan1.getDay()) % 7
        startDate = new Date(year, 0, 1 + daysToFirstMonday + (weekNumber - 1) * 7)
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      } else {
        // Default to current week
        const dayOfWeek = now.getDay()
        const monday = new Date(now)
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        monday.setHours(0, 0, 0, 0)
        startDate = monday
      }
      break
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }

  return {
    preset: preset as TimeRange['preset'],
    weekNumber,
    year,
    startDate,
    endDate,
  }
}
