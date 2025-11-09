import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function updateCourseStatus(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    const { status } = await request.json()

    if (!status || !['FUTURE', 'ACTIVE', 'COMPLETED'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      )
    }

    // Check if course exists and user has permission
    const existingCourse = await db.course.findUnique({
      where: { id: params.id }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const hasPermission = user.role === 'ADMIN' || 
                         (user.role === 'PC' && existingCourse.creatorId === user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized to update this course' },
        { status: 403 }
      )
    }

    // If activating course, auto-enroll students
    if (status === 'ACTIVE' && existingCourse.status !== 'ACTIVE') {
      // Get all active students in the batch
      const students = await db.student.findMany({
        where: {
          batchId: existingCourse.batchId,
          status: 'ACTIVE'
        }
      })

      // Create enrollments
      if (students.length > 0) {
        await db.enrollment.createMany({
          data: students.map(student => ({
            studentId: student.id,
            courseId: existingCourse.id,
            batchId: existingCourse.batchId
          })),
          skipDuplicates: true
        })
      }
    }

    const updatedCourse = await db.course.update({
      where: { id: params.id },
      data: { status }
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error('Failed to update course status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PATCH = requireAuth(updateCourseStatus)