import { NextResponse } from 'next/server'
import { getChannelCategories, addChannelCategory, deleteChannelCategory, updateChannelCategory } from '@/lib/redis'
import type { ChannelCategory } from '@/lib/types'

export async function GET() {
  try {
    const categories = await getChannelCategories()
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Failed to get channel categories:', error)
    return NextResponse.json(
      { error: 'Failed to get channel categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const category: ChannelCategory = await request.json()
    // Generate ID if not provided
    if (!category.id) {
      category.id = crypto.randomUUID()
    }
    await addChannelCategory(category)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Failed to add channel category:', error)
    return NextResponse.json(
      { error: 'Failed to add channel category' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates }: Partial<ChannelCategory> & { id: string } = await request.json()
    await updateChannelCategory(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update channel category:', error)
    return NextResponse.json(
      { error: 'Failed to update channel category' },
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
        { error: 'Channel category ID is required' },
        { status: 400 }
      )
    }
    await deleteChannelCategory(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete channel category:', error)
    return NextResponse.json(
      { error: 'Failed to delete channel category' },
      { status: 500 }
    )
  }
}
