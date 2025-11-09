import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function deleteUser(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (params.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Check dependencies before deletion
    const [managedPrograms, teacherCourses] = await Promise.all([
      db.program.count({ where: { coordinatorId: params.id } }),
      db.course.count({ where: { teacherId: params.id } })
    ])

    if (managedPrograms > 0 || teacherCourses > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing assignments' },
        { status: 400 }
      )
    }

    // Delete the user
    await db.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = requireRole(['ADMIN'])(deleteUser)