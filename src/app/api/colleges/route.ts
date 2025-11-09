import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const colleges = await db.college.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ colleges })
  } catch (error) {
    console.error('Failed to fetch colleges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}