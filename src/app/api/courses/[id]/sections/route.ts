import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    // Check if user has permission for this course
    const course = await db.course.findUnique({
      where: { id: params.id }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const hasPermission = user.role === 'ADMIN' || 
                         (user.role === 'PC' && course.creatorId === user.id) ||
                         (user.role === 'TEACHER' && course.teacherId === user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized to access this course' },
        { status: 403 }
      )
    }

    const sections = await db.section.findMany({
      where: {
        batchId: course.batchId
      },
      include: {
        batch: {
          include: {
            program: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Failed to fetch course sections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}