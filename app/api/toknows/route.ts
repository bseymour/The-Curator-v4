import { NextResponse } from 'next/server'
import { getToKnows, addToKnow, updateToKnow, deleteToKnow } from '@/lib/redis'
import type { ToKnowItem } from '@/lib/types'

// GET - Fetch all to-knows
export async function GET() {
  try {
    const toKnows = await getToKnows()
    return NextResponse.json(toKnows)
  } catch (error) {
    console.error('Failed to fetch to-knows:', error)
    return NextResponse.json({ error: 'Failed to fetch to-knows' }, { status: 500 })
  }
}

// POST - Add a new to-know
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, slackLink, channelName } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const toKnow: ToKnowItem = {
      id: crypto.randomUUID(),
      text,
      slackLink: slackLink || null,
      channelName: channelName || null,
      archived: false,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    }

    await addToKnow(toKnow)
    return NextResponse.json(toKnow)
  } catch (error) {
    console.error('Failed to add to-know:', error)
    return NextResponse.json({ error: 'Failed to add to-know' }, { status: 500 })
  }
}

// PUT - Update a to-know (archive/unarchive)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, archived } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const updates: Partial<ToKnowItem> = {}
    if (typeof archived === 'boolean') {
      updates.archived = archived
      updates.archivedAt = archived ? new Date().toISOString() : null
    }

    await updateToKnow(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update to-know:', error)
    return NextResponse.json({ error: 'Failed to update to-know' }, { status: 500 })
  }
}

// DELETE - Delete a to-know
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await deleteToKnow(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete to-know:', error)
    return NextResponse.json({ error: 'Failed to delete to-know' }, { status: 500 })
  }
}
