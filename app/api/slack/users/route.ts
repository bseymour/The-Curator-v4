import { NextResponse } from 'next/server'
import { getUsers } from '@/lib/slack'

export async function GET() {
  try {
    const users = await getUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to fetch Slack users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch Slack users' },
      { status: 500 }
    )
  }
}
