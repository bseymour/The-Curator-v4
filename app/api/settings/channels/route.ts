import { NextResponse } from 'next/server'
import { getChannels, addChannel, deleteChannel, updateChannel } from '@/lib/redis'
import type { Channel } from '@/lib/types'

export async function GET() {
  try {
    const channels = await getChannels()
    return NextResponse.json(channels)
  } catch (error) {
    console.error('Failed to get channels:', error)
    return NextResponse.json(
      { error: 'Failed to get channels' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const channel: Channel = await request.json()
    // Generate ID if not provided
    if (!channel.id) {
      channel.id = crypto.randomUUID()
    }
    await addChannel(channel)
    return NextResponse.json(channel, { status: 201 })
  } catch (error) {
    console.error('Failed to add channel:', error)
    return NextResponse.json(
      { error: 'Failed to add channel' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates }: Partial<Channel> & { id: string } = await request.json()
    await updateChannel(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update channel:', error)
    return NextResponse.json(
      { error: 'Failed to update channel' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      )
    }
    await deleteChannel(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete channel:', error)
    return NextResponse.json(
      { error: 'Failed to delete channel' },
      { status: 500 }
    )
  }
}
