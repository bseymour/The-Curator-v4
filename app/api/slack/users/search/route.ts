import { NextResponse } from 'next/server'
import { searchUsers, getUser } from '@/lib/slack'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const id = searchParams.get('id')

  try {
    // If ID is provided, look up that specific user
    if (id) {
      const user = await getUser(id)
      if (user) {
        return NextResponse.json([user])
      }
      return NextResponse.json([])
    }

    // Otherwise search by name/email
    const users = await searchUsers(query)
    return NextResponse.json(users)
  } catch (error) {
    console.error('Failed to search Slack users:', error)
    return NextResponse.json(
      { error: `Failed to search users: ${error}` },
      { status: 500 }
    )
  }
}
