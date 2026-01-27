import { NextResponse } from 'next/server'
import { getTeamMembers, addTeamMember, deleteTeamMember, updateTeamMember } from '@/lib/redis'
import type { TeamMember } from '@/lib/types'

export async function GET() {
  try {
    const members = await getTeamMembers()
    return NextResponse.json(members)
  } catch (error) {
    console.error('Failed to get team members:', error)
    return NextResponse.json(
      { error: 'Failed to get team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const member: TeamMember = await request.json()
    // Generate ID if not provided
    if (!member.id) {
      member.id = crypto.randomUUID()
    }
    await addTeamMember(member)
    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Failed to add team member:', error)
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updates }: Partial<TeamMember> & { id: string } = await request.json()
    await updateTeamMember(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
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
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }
    await deleteTeamMember(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
