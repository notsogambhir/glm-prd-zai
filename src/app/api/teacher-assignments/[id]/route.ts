import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function deleteTeacherAssignments(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    // Delete all assignments for this teacher
    await db.teacherAssignment.deleteMany({
      where: { teacherId: params.id }
    })

    return NextResponse.json({ message: 'Teacher assignments deleted successfully' })
  } catch (error) {
    console.error('Failed to delete teacher assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = requireAuth(deleteTeacherAssignments)