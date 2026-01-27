import { NextResponse } from 'next/server'
import { getTeamGroups, addTeamGroup, deleteTeamGroup, updateTeamGroup } from '@/lib/redis'
import type { TeamGroup } from '@/lib/types'

export async function GET() {
  try {
    const groups = await getTeamGroups()
    return NextResponse.json(groups)
  } catch (error) {
    console.error('Failed to get team groups:', error)
    return NextResponse.json(
      { error: 'Failed to get team groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const group: TeamGroup = await request.json()
    // Generate ID if not provided
    if (!group.id) {
      group.id = crypto.randomUUID()
    }
    await addTeamGroup(group)
    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Failed to add team group:', error)
    return NextResponse.json(
      { error: 'Failed to add team group' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates }: Partial<TeamGroup> & { id: string } = await request.json()
    await updateTeamGroup(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update team group:', error)
    return NextResponse.json(
      { error: 'Failed to update team group' },
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
        { error: 'Team group ID is required' },
        { status: 400 }
      )
    }
    await deleteTeamGroup(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team group:', error)
    return NextResponse.json(
      { error: 'Failed to delete team group' },
      { status: 500 }
    )
  }
}
