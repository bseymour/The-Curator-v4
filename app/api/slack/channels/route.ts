import { NextResponse } from 'next/server'
import { getChannels } from '@/lib/slack'

export async function GET() {
  try {
    const channels = await getChannels()
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Failed to fetch Slack channels:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Slack channels' },
      { status: 500 }
    )
  }
}
