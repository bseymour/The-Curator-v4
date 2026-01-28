import { NextRequest, NextResponse } from 'next/server'
import { generateObject } from 'ai'
import { gateway } from '@ai-sdk/gateway'
import { z } from 'zod'
import { searchUserMessagesGlobal, calculateTimeRange } from '@/lib/slack'
import type { TeamMember, TimeRangePreset } from '@/lib/types'

const teamSummarySchema = z.object({
  overallHealth: z.enum(['healthy', 'attention_needed', 'concerning']).describe('Overall team health assessment'),
  healthScore: z.number().min(0).max(100).describe('Team health score from 0-100'),
  summary: z.string().describe('2-3 sentence summary of team activity and morale'),
  highlights: z.array(z.string()).describe('Top 3-5 positive highlights from the team'),
  concerns: z.array(z.string()).describe('Any concerns or issues that need attention'),
  topContributors: z.array(z.object({
    name: z.string(),
    contribution: z.string().describe('Brief description of their key contribution'),
  })).describe('Team members who stood out positively'),
  suggestedActions: z.array(z.string()).describe('1-3 recommended actions based on the analysis'),
})

function getTimeRangeDates(preset: TimeRangePreset, weekNumber?: number, year?: number) {
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
        const jan1 = new Date(year, 0, 1)
        const daysToAdd = (weekNumber - 1) * 7
        startDate = new Date(jan1.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        const dayOfWeek = startDate.getDay()
        startDate.setDate(startDate.getDate() - dayOfWeek + 1)
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }
      break
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  }

  return { startDate, endDate }
}

export async function POST(request: NextRequest) {
  try {
    const {
      members,
      groupName,
      timeRange
    }: {
      members: TeamMember[]
      groupName: string
      timeRange: { preset: TimeRangePreset; weekNumber?: number; year?: number }
    } = await request.json()

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No team members provided' }, { status: 400 })
    }

    const { startDate, endDate } = getTimeRangeDates(
      timeRange.preset,
      timeRange.weekNumber,
      timeRange.year
    )

    // Collect messages from all team members
    const allMessages: { memberName: string; text: string }[] = []

    for (const member of members) {
      if (!member.slackUserId) continue

      try {
        const timeRangeObj = calculateTimeRange(timeRange.preset, timeRange.weekNumber, timeRange.year)
        const result = await searchUserMessagesGlobal(member.slackUserId, timeRangeObj)

        // Limit messages per member to avoid too much data
        const memberMessages = result.messages.slice(0, 30)

        for (const msg of memberMessages) {
          allMessages.push({
            memberName: member.name,
            text: msg.text,
          })
        }
      } catch (err) {
        console.error(`Failed to fetch messages for ${member.name}:`, err)
      }
    }

    if (allMessages.length === 0) {
      return NextResponse.json({
        groupName,
        overallHealth: 'healthy',
        healthScore: 50,
        summary: 'No recent messages found for this team in the selected time range.',
        highlights: [],
        concerns: [],
        topContributors: [],
        suggestedActions: ['Check if team members have Slack IDs configured'],
        memberCount: members.length,
        messageCount: 0,
        generatedAt: new Date(),
      })
    }

    // Prepare content for AI
    const messageContent = allMessages
      .slice(0, 150) // Limit total messages
      .map(m => `[${m.memberName}] ${m.text}`)
      .join('\n\n')

    const memberNames = members.map(m => m.name).join(', ')

    const { object } = await generateObject({
      model: gateway('anthropic/claude-sonnet-4'),  // Higher quality, slower, more expensive
      // model: gateway('anthropic/claude-3-5-haiku-latest'),  // Faster, cheaper
      schema: teamSummarySchema,
      messages: [
        {
          role: 'system',
          content: `You are analyzing Slack messages from a team called "${groupName}" with ${members.length} members: ${memberNames}.

Provide a quick team health assessment that helps a manager understand:
1. Overall team health and morale
2. Key highlights and wins from the team
3. Any concerns or issues worth addressing
4. Who is standing out positively
5. Suggested actions for the manager

Be concise and actionable. Focus on patterns across the team rather than individual details.`,
        },
        {
          role: 'user',
          content: `Here are the recent messages from the ${groupName} team:\n\n${messageContent}`,
        },
      ],
    })

    return NextResponse.json({
      groupName,
      ...object,
      memberCount: members.length,
      messageCount: allMessages.length,
      generatedAt: new Date(),
    })
  } catch (error) {
    console.error('Team summary error:', error)
    return NextResponse.json(
      { error: 'Failed to generate team summary' },
      { status: 500 }
    )
  }
}
