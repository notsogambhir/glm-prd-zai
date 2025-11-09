import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function deleteCollege(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    // Check if college has programs
    const programsCount = await db.program.count({
      where: { collegeId: params.id }
    })

    if (programsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete college with existing programs' },
        { status: 400 }
      )
    }

    // Delete the college
    await db.college.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'College deleted successfully' })
  } catch (error) {
    console.error('Failed to delete college:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = requireRole(['ADMIN'])(deleteCollege)