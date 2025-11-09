import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function saveTeacherAssignments(request: NextRequest, user: AuthUser) {
  try {
    const { teacherId, pcIds } = await request.json()

    if (!teacherId || !Array.isArray(pcIds)) {
      return NextResponse.json(
        { error: 'Invalid assignment data' },
        { status: 400 }
      )
    }

    // Delete existing assignments for this teacher
    await db.teacherAssignment.deleteMany({
      where: { teacherId }
    })

    // Create new assignments
    if (pcIds.length > 0) {
      // Get programs for the PCs
      const pcs = await db.user.findMany({
        where: {
          id: { in: pcIds },
          role: 'PC'
        },
        include: {
          managedPrograms: {
            select: {
              id: true
            }
          }
        }
      })

      const assignments = pcs.flatMap(pc => 
        pc.managedPrograms.map(program => ({
          teacherId,
          pcId: pc.id,
          programId: program.id
        }))
      )

      await db.teacherAssignment.createMany({
        data: assignments
      })
    }

    return NextResponse.json({ message: 'Teacher assignments saved successfully' })
  } catch (error) {
    console.error('Failed to save teacher assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireRole(['ADMIN', 'DEPARTMENT'])(saveTeacherAssignments)