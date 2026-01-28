import { NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { z } from 'zod'
import { searchUserMessagesGlobal, calculateTimeRange } from '@/lib/slack'
import type { TeamMemberRole, TeamMemberFunction, TeamMemberRelationship } from '@/lib/types'

const teamMemberSummarySchema = z.object({
  activitySummary: z.string().describe('Overview of what this person has been working on'),
  keyActivities: z.array(z.object({
    activity: z.string().describe('Description of the activity'),
    messageIndices: z.array(z.number()).default([]).describe('Indices of relevant messages (0-based) that support this activity'),
  })).describe('Main activities and contributions with message references'),
  wins: z.array(z.object({
    win: z.string().describe('Description of the win or success'),
    messageIndices: z.array(z.number()).default([]).describe('Indices of relevant messages (0-based)'),
  })).describe('Successes, completed tasks, positive outcomes with message references'),
  concerns: z.array(z.object({
    concern: z.string().describe('Description of the concern'),
    messageIndices: z.array(z.number()).default([]).describe('Indices of relevant messages (0-based)'),
  })).describe('Potential blockers, frustrations, or issues raised with message references'),
  sentiment: z.object({
    type: z.enum(['positive', 'neutral', 'negative', 'mixed']).describe('Overall sentiment'),
    score: z.number().min(-1).max(1).describe('Sentiment score from -1 (negative) to 1 (positive)'),
    highlights: z.array(z.object({
      text: z.string().describe('Key phrase indicating sentiment'),
      messageIndex: z.number().optional().describe('Index of the message (0-based) containing this phrase'),
    })).default([]).describe('Key phrases that indicate sentiment with message references'),
  }),
  communicationTone: z.object({
    terseness: z.enum(['normal', 'slightly_terse', 'notably_terse']).default('normal').describe('Whether messages are unusually short or curt'),
    tension: z.enum(['none', 'mild', 'notable']).default('none').describe('Signs of tension or frustration in communication style'),
    warningSignals: z.array(z.object({
      signal: z.string().describe('The warning signal or concerning pattern'),
      context: z.string().describe('Brief context or example from their messages'),
      severity: z.enum(['low', 'medium', 'high']).describe('How concerning this signal is'),
      messageIndex: z.number().optional().describe('Index of the relevant message (0-based)'),
    })).default([]).describe('Early warning indicators that may need attention in a 1:1. Can be empty array if none found.'),
    positiveSignals: z.array(z.object({
      signal: z.string().describe('Positive signal description'),
      messageIndex: z.number().optional().describe('Index of the relevant message (0-based)'),
    })).default([]).describe('Positive communication patterns with message references'),
    suggestedTopicsFor1on1: z.array(z.string()).default([]).describe('Topics worth exploring in a 1:1 based on the analysis. Can be empty array if nothing specific to discuss.'),
  }).default({ terseness: 'normal', tension: 'none', warningSignals: [], positiveSignals: [], suggestedTopicsFor1on1: [] }),
})

export async function POST(request: Request) {
  try {
    const {
      memberId,
      memberName,
      slackUserId,
      role,
      memberFunction,
      relationship,
      preset,
      weekNumber,
      year
    } = await request.json() as {
      memberId: string
      memberName: string
      slackUserId: string
      role: TeamMemberRole
      memberFunction: TeamMemberFunction
      relationship: TeamMemberRelationship
      preset: string
      weekNumber?: number
      year?: number
    }

    if (!slackUserId) {
      return NextResponse.json(
        { error: 'Slack User ID is required' },
        { status: 400 }
      )
    }

    // Calculate time range
    const timeRange = calculateTimeRange(preset, weekNumber, year)

    // Search for user messages across ALL accessible channels (not just configured ones)
    const { messages: userMessages, channelNames: activeChannelNames } = await searchUserMessagesGlobal(
      slackUserId,
      timeRange
    )

    const totalMessages = userMessages.length

    if (totalMessages === 0) {
      return NextResponse.json({
        memberId,
        memberName,
        timeRange,
        activitySummary: 'No activity found in any accessible channels during this period.',
        keyActivities: [],
        wins: [],
        concerns: [],
        sentiment: { type: 'neutral', score: 0, highlights: [] },
        communicationTone: {
          terseness: 'normal',
          tension: 'none',
          warningSignals: [],
          positiveSignals: [],
          suggestedTopicsFor1on1: []
        },
        messageCount: 0,
        channelsActive: [],
        generatedAt: new Date(),
      })
    }

    // Prepare message content for AI with indices
    const messagesToAnalyze = userMessages.slice(0, 100)
    const messageContent = messagesToAnalyze
      .map((m, i) => `[${i}] [#${m.channel?.name || 'channel'}] ${m.text}`)
      .join('\n\n')

    // Build message reference lookup with permalinks
    const messageRefs = messagesToAnalyze.map((m, i) => ({
      index: i,
      text: m.text.substring(0, 100) + (m.text.length > 100 ? '...' : ''),
      channel: m.channel?.name || 'unknown',
      permalink: m.permalink || null,
    }))

    // Generate summary using AI
    const { object } = await generateObject({
      // model: 'anthropic/claude-sonnet-4',  // Higher quality, slower, more expensive
      model: 'anthropic/claude-3-5-haiku-latest',  // Faster, cheaper
      schema: teamMemberSummarySchema,
      messages: [
        {
          role: 'system',
          content: `You are analyzing Slack messages from ${memberName}, who is a ${role === 'IC' ? 'Individual Contributor' : 'Manager'} 
working as a ${memberFunction}. They are a ${relationship.toLowerCase()} to the person reading this summary.

IMPORTANT: Each message is prefixed with its index number in brackets like [0], [1], [2], etc.
When you identify activities, wins, concerns, or notable patterns, include the messageIndices (or messageIndex) 
of the relevant messages so the user can click through to see the original context.

Provide insights that help a manager understand:
1. What this person has been working on (include messageIndices for each activity)
2. Their wins and accomplishments (include messageIndices)
3. Any frustrations, blockers, or concerns they've expressed (include messageIndices)
4. Their overall sentiment and morale (include messageIndex for highlights)
5. Communication tone analysis - look for:
   - Terseness: Are messages unusually short, curt, or lacking their usual warmth/detail?
   - Tension: Signs of frustration, passive-aggressive language, or strained interactions
   - Warning signals: Things that might indicate burnout, conflict, disengagement, or issues worth discussing (include messageIndex)
   - Positive signals: Collaboration, helpfulness, enthusiasm, growth (include messageIndex)

For warning signals, be specific about what you observed and provide context. These help inform 1:1 conversations.
Suggest concrete topics for 1:1 discussions based on your analysis.

Be empathetic and constructive. Focus on actionable insights that help support this team member.`,
        },
        {
          role: 'user',
          content: `Analyze these ${totalMessages} messages from ${memberName} over the last ${preset === '24h' ? '24 hours' : preset === '7d' ? '7 days' : preset === '30d' ? '30 days' : 'week'}:\n\n${messageContent}`,
        },
      ],
    })

    // Provide fallbacks for communicationTone in case AI doesn't generate all fields
    const defaultCommunicationTone = {
      terseness: 'normal' as const,
      tension: 'none' as const,
      warningSignals: [],
      positiveSignals: [],
      suggestedTopicsFor1on1: [],
    }

    return NextResponse.json({
      memberId,
      memberName,
      timeRange,
      activitySummary: object.activitySummary,
      keyActivities: object.keyActivities || [],
      wins: object.wins || [],
      concerns: object.concerns || [],
      sentiment: object.sentiment || { type: 'neutral', score: 0, highlights: [] },
      communicationTone: object.communicationTone
        ? { ...defaultCommunicationTone, ...object.communicationTone }
        : defaultCommunicationTone,
      messageCount: totalMessages,
      channelsActive: activeChannelNames,
      messageRefs, // Include message references with permalinks
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Failed to generate team member summary:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
