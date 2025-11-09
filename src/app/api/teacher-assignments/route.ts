import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getTeacherAssignments(request: NextRequest, user: AuthUser) {
  try {
    const assignments = await db.teacherAssignment.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        pc: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Failed to fetch teacher assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createTeacherAssignments(request: NextRequest, user: AuthUser) {
  try {
    const { teacherId, pcIds } = await request.json()

    if (!teacherId || !pcIds || !Array.isArray(pcIds)) {
      return NextResponse.json(
        { error: 'Teacher ID and PC IDs array are required' },
        { status: 400 }
      )
    }

    // Create assignments
    const assignments = await db.teacherAssignment.createMany({
      data: pcIds.map((pcId: string) => ({
        teacherId,
        pcId
      }))
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Failed to create teacher assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getTeacherAssignments)
export const POST = requireAuth(createTeacherAssignments)