import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getTeacherAssignments(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    const assignments = await db.teacherAssignment.findMany({
      where: {
        teacherId: params.id
      },
      select: {
        pcId: true
      }
    })

    const pcIds = assignments.map(a => a.pcId)
    return NextResponse.json({ pcIds })
  } catch (error) {
    console.error('Failed to fetch teacher assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function saveTeacherAssignments(request: NextRequest, user: AuthUser) {
  try {
    const { teacherId, pcIds } = await request.json()

    if (!teacherId || !Array.isArray(pcIds)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      )
    }

    // Delete existing assignments for this teacher
    await db.teacherAssignment.deleteMany({
      where: { teacherId }
    })

    // Create new assignments
    if (pcIds.length > 0) {
      // Get programs for these PCs
      const programs = await db.program.findMany({
        where: {
          coordinatorId: { in: pcIds }
        },
        select: {
          id: true,
          coordinatorId: true
        }
      })

      const newAssignments = programs.map(program => ({
        teacherId,
        pcId: program.coordinatorId!,
        programId: program.id
      }))

      await db.teacherAssignment.createMany({
        data: newAssignments
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

export const GET = requireRole(['ADMIN', 'DEPARTMENT'])(getTeacherAssignments)
export const POST = requireRole(['ADMIN', 'DEPARTMENT'])(saveTeacherAssignments)