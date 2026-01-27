import { NextResponse } from 'next/server'
import { searchChannels, getChannelById } from '@/lib/slack'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const id = searchParams.get('id')

  try {
    // If ID is provided, look up that specific channel
    if (id) {
      const channel = await getChannelById(id)
      if (channel) {
        return NextResponse.json([channel])
      }
      return NextResponse.json([])
    }

    // Otherwise search by name
    const channels = await searchChannels(query)
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Failed to search Slack channels:', error)
    return NextResponse.json(
      { error: `Failed to search channels: ${error}` },
      { status: 500 }
    )
  }
}
