import { NextResponse } from 'next/server'
import { getTodos, addTodo, updateTodo, deleteTodo } from '@/lib/redis'
import type { TodoItem } from '@/lib/types'

// GET - Fetch all todos
export async function GET() {
  try {
    const todos = await getTodos()
    return NextResponse.json(todos)
  } catch (error) {
    console.error('Failed to fetch todos:', error)
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 })
  }
}

// POST - Add a new todo
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { text, slackLink, channelName } = body

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const todo: TodoItem = {
      id: crypto.randomUUID(),
      text,
      slackLink: slackLink || null,
      channelName: channelName || null,
      completed: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    }

    await addTodo(todo)
    return NextResponse.json(todo)
  } catch (error) {
    console.error('Failed to add todo:', error)
    return NextResponse.json({ error: 'Failed to add todo' }, { status: 500 })
  }
}

// PUT - Update a todo (mark complete/incomplete)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, completed } = body

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const updates: Partial<TodoItem> = {}
    if (typeof completed === 'boolean') {
      updates.completed = completed
      updates.completedAt = completed ? new Date().toISOString() : null
    }

    await updateTodo(id, updates)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update todo:', error)
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}

// DELETE - Delete a todo
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await deleteTodo(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete todo:', error)
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 })
  }
}
