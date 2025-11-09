import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getAssessments(request: NextRequest, user: AuthUser) {
  try {
    let assessments

    if (user.role === 'ADMIN') {
      assessments = await db.assessment.findMany({
        include: {
          course: {
            include: {
              program: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          },
          section: {
            include: {
              batch: {
                select: {
                  name: true
                }
              }
            }
          },
          creator: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              questions: true,
              markScores: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (user.role === 'PC') {
      // Get programs where user is coordinator
      const userPrograms = await db.program.findMany({
        where: { coordinatorId: user.id },
        select: { id: true }
      })
      const programIds = userPrograms.map(p => p.id)

      assessments = await db.assessment.findMany({
        where: {
          course: {
            programId: { in: programIds }
          }
        },
        include: {
          course: {
            include: {
              program: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          },
          section: {
            include: {
              batch: {
                select: {
                  name: true
                }
              }
            }
          },
          creator: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              questions: true,
              markScores: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (user.role === 'TEACHER') {
      assessments = await db.assessment.findMany({
        where: {
          course: {
            teacherId: user.id
          }
        },
        include: {
          course: {
            include: {
              program: {
                select: {
                  name: true,
                  code: true
                }
              }
            }
          },
          section: {
            include: {
              batch: {
                select: {
                  name: true
                }
              }
            }
          },
          creator: {
            select: {
              name: true
            }
          },
          _count: {
            select: {
              questions: true,
              markScores: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ assessments })
  } catch (error) {
    console.error('Failed to fetch assessments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createAssessment(request: NextRequest, user: AuthUser) {
  try {
    const { name, type, courseId, sectionId, maxMarks } = await request.json()

    if (!name || !type || !courseId || !sectionId || !maxMarks) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if user has permission for this course
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
        { error: 'Unauthorized to create assessment for this course' },
        { status: 403 }
      )
    }

    const newAssessment = await db.assessment.create({
      data: {
        name,
        type,
        courseId,
        sectionId,
        creatorId: user.id,
        maxMarks: parseInt(maxMarks),
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            program: {
              select: {
                name: true,
                code: true
              }
            }
          }
        },
        section: {
          include: {
            batch: {
              select: {
                name: true
              }
            }
          }
        },
        creator: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            questions: true,
            markScores: true
          }
        }
      }
    })

    return NextResponse.json({ assessment: newAssessment })
  } catch (error) {
    console.error('Failed to create assessment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getAssessments)
export const POST = requireAuth(createAssessment)