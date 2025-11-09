import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'
import { AttainmentCalculator } from '@/lib/attainment/calculator'

async function calculateCourseAttainment(
  request: NextRequest,
  user: AuthUser
) {
  try {
    const { courseId, sectionId } = await request.json()

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check permissions
    const course = await db.course.findUnique({
      where: { id: courseId }
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
        { error: 'Unauthorized to calculate attainment for this course' },
        { status: 403 }
      )
    }

    // Calculate CO attainments
    const coAttainments = await AttainmentCalculator.calculateCourseCOAttainments(
      courseId,
      sectionId
    )

    // Get CO details
    const cos = await db.courseOutcome.findMany({
      where: { courseId },
      select: {
        id: true,
        code: true,
        description: true
      }
    })

    // Combine CO details with attainments
    const results = cos.map(co => {
      const attainment = coAttainments.find(a => a.coId === co.id)
      return {
        ...co,
        attainmentLevel: attainment?.attainmentLevel || 0,
        percentageMeetingTarget: attainment?.percentageMeetingTarget || 0,
        studentsMeetingTarget: attainment?.studentsMeetingTarget || 0,
        totalStudents: attainment?.totalStudents || 0
      }
    })

    return NextResponse.json({ 
      courseId,
      sectionId,
      coAttainments: results 
    })
  } catch (error) {
    console.error('Failed to calculate course attainment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function calculateProgramAttainment(
  request: NextRequest,
  user: AuthUser
) {
  try {
    const { programId } = await request.json()

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      )
    }

    // Check permissions
    const program = await db.program.findUnique({
      where: { id: programId }
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    const hasPermission = user.role === 'ADMIN' || 
                         (user.role === 'PC' && program.coordinatorId === user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Unauthorized to calculate attainment for this program' },
        { status: 403 }
      )
    }

    // Calculate PO attainments
    const poAttainments = await AttainmentCalculator.calculateProgramPOAttainments(programId)

    // Get PO details
    const pos = await db.programOutcome.findMany({
      where: { programId },
      select: {
        id: true,
        code: true,
        description: true
      }
    })

    // Combine PO details with attainments
    const results = pos.map(po => {
      const attainment = poAttainments.find(a => a.poId === po.id)
      return {
        ...po,
        ...attainment
      }
    })

    return NextResponse.json({ 
      programId,
      poAttainments: results 
    })
  } catch (error) {
    console.error('Failed to calculate program attainment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(calculateCourseAttainment)
export const PUT = requireAuth(calculateProgramAttainment)