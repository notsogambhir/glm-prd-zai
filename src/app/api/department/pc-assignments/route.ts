import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function savePcAssignments(request: NextRequest, user: AuthUser) {
  try {
    const { assignments } = await request.json()

    if (!assignments || typeof assignments !== 'object') {
      return NextResponse.json(
        { error: 'Invalid assignments data' },
        { status: 400 }
      )
    }

    // Update each program's coordinator
    for (const [programId, pcId] of Object.entries(assignments)) {
      await db.program.update({
        where: { id: programId },
        data: {
          coordinatorId: pcId || null
        }
      })
    }

    return NextResponse.json({ message: 'PC assignments saved successfully' })
  } catch (error) {
    console.error('Failed to save PC assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireRole(['ADMIN', 'DEPARTMENT'])(savePcAssignments)