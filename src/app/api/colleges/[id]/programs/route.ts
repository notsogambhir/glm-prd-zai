import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const programs = await db.program.findMany({
      where: { collegeId: params.id },
      select: {
        id: true,
        name: true,
        code: true,
        duration: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}