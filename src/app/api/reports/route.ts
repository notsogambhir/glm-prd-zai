import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'
import { AttainmentCalculator } from '@/lib/attainment/calculator'

async function generateReport(request: NextRequest, user: AuthUser) {
  try {
    const { type, courseId, sectionId, scope } = await request.json()

    if (!type || !courseId) {
      return NextResponse.json(
        { error: 'Report type and course ID are required' },
        { status: 400 }
      )
    }

    // Check permissions for course
    const course = await db.course.findUnique({
      where: { id: courseId },
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
        }
      }
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
        { error: 'Unauthorized to generate report for this course' },
        { status: 403 }
      )
    }

    let report: any = {}

    if (type === 'course-attainment') {
      // Calculate CO attainments
      const coAttainments = await AttainmentCalculator.calculateCourseCOAttainments(
        courseId,
        scope === 'section' ? sectionId : undefined
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
      const coResults = cos.map(co => {
        const attainment = coAttainments.find(a => a.coId === co.id)
        return {
          ...co,
          attainmentLevel: attainment?.attainmentLevel || 0,
          percentageMeetingTarget: attainment?.percentageMeetingTarget || 0,
          studentsMeetingTarget: attainment?.studentsMeetingTarget || 0,
          totalStudents: attainment?.totalStudents || 0
        }
      })

      report = {
        type: 'course-attainment',
        courseInfo: {
          name: course.name,
          code: course.code,
          program: course.program.name,
          batch: course.batch.name
        },
        scope,
        coAttainments: coResults,
        generatedAt: new Date().toISOString()
      }
    } else if (type === 'assessment-comparison') {
      // Get assessments for the course
      const assessments = await db.assessment.findMany({
        where: {
          courseId,
          ...(scope === 'section' && sectionId ? { sectionId } : {})
        },
        include: {
          _count: {
            select: {
              markScores: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      // Get students in scope
      let students
      if (scope === 'section' && sectionId) {
        students = await db.student.findMany({
          where: { sectionId }
        })
      } else {
        students = await db.student.findMany({
          where: { batchId: course.batchId }
        })
      }

      // Calculate average scores per assessment
      const assessmentStats = await Promise.all(
        assessments.map(async (assessment) => {
          const totalScore = await db.markScore.aggregate({
            where: {
              question: {
                assessmentId: assessment.id
              }
            }
          })
          
          const avgScore = totalScore._sum.marks / (students.length * assessment._count.markScores || 1)
          
          return {
            id: assessment.id,
            name: assessment.name,
            type: assessment.type,
            avgScore: avgScore,
            maxScore: assessment.maxMarks,
            studentCount: students.length
          }
        })
      )

      report = {
        type: 'assessment-comparison',
        courseInfo: {
          name: course.name,
          code: course.code,
          program: course.program.name,
          batch: course.batch.name
        },
        scope,
        assessmentStats,
        generatedAt: new Date().toISOString()
      }
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Failed to generate report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function downloadPDF(request: NextRequest, user: AuthUser) {
  try {
    const { type, courseId, sectionId, scope } = await request.json()

    // This is a placeholder - in a real implementation, you would use a PDF library
    // like jsPDF with html2canvas to generate actual PDFs
    
    const pdfContent = `
      NBA OBE Portal Report
      =====================
      
      Report Type: ${type}
      Course ID: ${courseId}
      Section ID: ${sectionId || 'N/A'}
      Scope: ${scope}
      
      Generated on: ${new Date().toLocaleString()}
      
      This is a placeholder PDF content.
      In a real implementation, this would be a formatted PDF report
      with tables, charts, and proper formatting.
    `

    // Return as a downloadable file (simplified version)
    const headers = new Headers()
    headers.set('Content-Type', 'text/plain')
    headers.set('Content-Disposition', `attachment; filename="report-${type}-${new Date().toISOString().split('T')[0]}.txt"`)

    return new NextResponse(pdfContent, { headers })
  } catch (error) {
    console.error('Failed to download PDF:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(generateReport)
export const PUT = requireAuth(downloadPDF)