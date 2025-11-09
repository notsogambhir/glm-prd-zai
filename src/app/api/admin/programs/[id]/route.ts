import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function deleteProgram(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    // Check if program has batches or courses
    const [batchesCount, coursesCount] = await Promise.all([
      db.batch.count({ where: { programId: params.id } }),
      db.course.count({ where: { programId: params.id } })
    ])

    if (batchesCount > 0 || coursesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete program with existing batches or courses' },
        { status: 400 }
      )
    }

    // Delete the program
    await db.program.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Program deleted successfully' })
  } catch (error) {
    console.error('Failed to delete program:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = requireRole(['ADMIN'])(deleteProgram)