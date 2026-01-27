import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { getChannelById, getChannelMessages, calculateTimeRange, extractMessageText } from '@/lib/slack'
import type { ChannelCategory } from '@/lib/types'

// Channel summary generation API - v2 with proper category handling

// Schema for insights with message references
const insightItemSchema = z.object({
  text: z.string().describe('The insight text'),
  messageIndex: z.number().describe('The index (0-based) of the most relevant message for this insight from the provided message list'),
})

const channelSummarySchema = z.object({
  summary: z.string().describe('A concise summary of the channel activity'),
  keyTopics: z.array(z.string()).describe('Main topics discussed'),
  highlights: z.array(insightItemSchema).describe('Notable messages, updates, or decisions - informational items'),
  actionItems: z.array(insightItemSchema).describe('Action items, follow-ups, or tasks that need attention'),
})

export async function POST(request: Request) {
  try {
    const { channelId, channelName, categories, preset, weekNumber, year } = await request.json() as {
      channelId: string
      channelName: string
      categories: ChannelCategory[]
      preset: string
      weekNumber?: number
      year?: number
    }

    // Verify the channel exists
    const channel = await getChannelById(channelId)
    if (!channel) {
      return NextResponse.json(
        { error: `Channel "${channelName}" not found or not accessible` },
        { status: 404 }
      )
    }

    // Calculate time range
    const timeRange = calculateTimeRange(preset, weekNumber, year)

    // Fetch messages
    const messages = await getChannelMessages(channel.id, timeRange)

    // Get category names for display - safely handle empty or undefined array
    const categoryNames = (categories && Array.isArray(categories) && categories.length > 0)
      ? categories.map((c: ChannelCategory) => c.name).join(', ')
      : 'Uncategorized'

    if (messages.length === 0) {
      return NextResponse.json({
        channelId: channel.id,
        channelName: channel.name,
        categories,
        timeRange,
        summary: 'No messages found in this time period.',
        keyTopics: [],
        highlights: [],
        actionItems: [],
        messageCount: 0,
        activeParticipants: 0,
        generatedAt: new Date(),
      })
    }

    // Get unique participants
    const uniqueUsers = new Set(messages.map(m => m.user))

    // Limit to most recent 100 messages and prepare with indices
    const limitedMessages = messages.slice(0, 100)
    
    // Prepare message content for AI with indices so it can reference them
    // Use extractMessageText to handle bot/integration messages (Tray.io, Zapier, etc.)
    const messageContent = limitedMessages
      .map((m, index) => {
        const text = extractMessageText(m)
        return `[${index}] ${text || '(empty message)'}`
      })
      .join('\n\n')

    // Generate summary using AI
    const { object } = await generateObject({
      model: 'anthropic/claude-sonnet-4',
      schema: channelSummarySchema,
      messages: [
        {
          role: 'system',
          content: `You are analyzing Slack channel messages for a channel called "#${channel.name}" which belongs to the following categories: ${categoryNames}. 
Provide a helpful summary for a manager who wants to stay informed about team activities.
Focus on key decisions, important updates, blockers, and notable discussions.
Be concise but comprehensive.

IMPORTANT: Each message is prefixed with an index number like [0], [1], etc. 
When creating highlights and actionItems, include the messageIndex field with the index of the most relevant message for that insight.`,
        },
        {
          role: 'user',
          content: `Analyze these ${messages.length} messages from the last ${preset === '24h' ? '24 hours' : preset === '7d' ? '7 days' : preset === '30d' ? '30 days' : 'week'}:\n\n${messageContent}`,
        },
      ],
    })

    // Helper to create Slack permalink from message timestamp
    // Format: https://WORKSPACE.slack.com/archives/CHANNEL_ID/pMESSAGE_TS
    const createSlackLink = (messageIndex: number): string | null => {
      if (messageIndex < 0 || messageIndex >= limitedMessages.length) return null
      const msg = limitedMessages[messageIndex]
      // Convert timestamp like "1234567890.123456" to "p1234567890123456"
      const tsForLink = msg.ts.replace('.', '')
      return `https://slack.com/archives/${channel.id}/p${tsForLink}`
    }

    // Convert highlights and actionItems to include slack links
    const highlightsWithLinks = object.highlights.map(h => ({
      text: h.text,
      slackLink: createSlackLink(h.messageIndex),
    }))

    const actionItemsWithLinks = object.actionItems.map(a => ({
      text: a.text,
      slackLink: createSlackLink(a.messageIndex),
    }))

    return NextResponse.json({
      channelId: channel.id,
      channelName: channel.name,
      categories,
      timeRange,
      summary: object.summary,
      keyTopics: object.keyTopics,
      highlights: highlightsWithLinks,
      actionItems: actionItemsWithLinks,
      messageCount: messages.length,
      activeParticipants: uniqueUsers.size,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to generate channel summary:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
