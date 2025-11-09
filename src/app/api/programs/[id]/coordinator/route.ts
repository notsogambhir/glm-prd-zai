import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function updateProgramCoordinator(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    const { coordinatorId } = await request.json()

    if (!coordinatorId) {
      return NextResponse.json(
        { error: 'Coordinator ID is required' },
        { status: 400 }
      )
    }

    // Update program coordinator
    const program = await db.program.update({
      where: { id: params.id },
      data: { coordinatorId: coordinatorId || null },
      include: {
        college: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Failed to update program coordinator:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PATCH = requireAuth(updateProgramCoordinator)