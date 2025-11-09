import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function updateCourse(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    const { 
      code, 
      name, 
      description, 
      credits, 
      type, 
      target, 
      level1, 
      level2, 
      level3 
    } = await request.json()

    if (!code || !name || !credits || !type) {
      return NextResponse.json(
        { error: 'Code, name, credits, and type are required' },
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
                         (user.role === 'PC' && existingCourse.creatorId === user.id) ||
                         (user.role === 'TEACHER' && existingCourse.teacherId === user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized to update this course' },
        { status: 403 }
      )
    }

    // Check if course code is taken by another course in the same program
    const codeTaken = await db.course.findFirst({
      where: {
        code,
        programId: existingCourse.programId,
        id: { not: params.id }
      }
    })

    if (codeTaken) {
      return NextResponse.json(
        { error: 'Course with this code already exists in the program' },
        { status: 400 }
      )
    }

    const updatedCourse = await db.course.update({
      where: { id: params.id },
      data: {
        code,
        name,
        description,
        credits: parseInt(credits),
        type,
        target: parseFloat(target),
        level1: parseFloat(level1),
        level2: parseFloat(level2),
        level3: parseFloat(level3)
      },
      include: {
        program: {
          select: {
            name: true,
            code: true
          }
        },
        batch: {
          select: {
            name: true
          }
        },
        creator: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            courseOutcomes: true,
            assessments: true,
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function deleteCourse(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    // Check if course exists and user has permission
    const existingCourse = await db.course.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            courseOutcomes: true,
            assessments: true,
            enrollments: true
          }
        }
      }
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
        { error: 'Unauthorized to delete this course' },
        { status: 403 }
      )
    }

    // Prevent deletion if course has data
    if (existingCourse._count.courseOutcomes > 0 || 
        existingCourse._count.assessments > 0 || 
        existingCourse._count.enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with existing outcomes, assessments, or enrollments' },
        { status: 400 }
      )
    }

    await db.course.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PATCH = requireAuth(updateCourse)
export const DELETE = requireAuth(deleteCourse)