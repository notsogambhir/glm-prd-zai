import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function deleteSection(
  request: NextRequest,
  user: AuthUser,
  params: { id: string }
) {
  try {
    // Update all students in this section to have no section
    await db.student.updateMany({
      where: { sectionId: params.id },
      data: { sectionId: null }
    })

    // Delete the section
    await db.section.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Section deleted successfully' })
  } catch (error) {
    console.error('Failed to delete section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const DELETE = requireRole(['ADMIN'])(deleteSection)