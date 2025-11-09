import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function deleteBatch(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    // Check if batch has sections or students
    const [sectionsCount, studentsCount] = await Promise.all([
      db.section.count({ where: { batchId: params.id } }),
      db.student.count({ where: { batchId: params.id } })
    ])

    if (sectionsCount > 0 || studentsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete batch with existing sections or students' },
        { status: 400 }
      )
    }

    // Delete the batch
    await db.batch.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Batch deleted successfully' })
  } catch (error) {
    console.error('Failed to delete batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = requireRole(['ADMIN'])(deleteBatch)