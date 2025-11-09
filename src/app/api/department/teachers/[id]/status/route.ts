import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function updateTeacherStatus(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    const { status } = await request.json()

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    await db.user.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json({ message: 'Teacher status updated successfully' })
  } catch (error) {
    console.error('Failed to update teacher status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PATCH = requireRole(['ADMIN', 'DEPARTMENT'])(updateTeacherStatus)