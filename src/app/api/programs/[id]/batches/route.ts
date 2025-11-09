import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batches = await db.batch.findMany({
      where: { programId: params.id },
      select: {
        id: true,
        name: true,
        startYear: true
      },
      orderBy: {
        startYear: 'desc'
      }
    })

    return NextResponse.json({ batches })
  } catch (error) {
    console.error('Failed to fetch batches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}