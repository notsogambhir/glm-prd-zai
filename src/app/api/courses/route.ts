import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getCourses(request: NextRequest, user: AuthUser) {
  try {
    let courses

    if (user.role === 'ADMIN') {
      courses = await db.course.findMany({
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
          teacher: {
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
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else if (user.role === 'PC') {
      // Get programs where user is coordinator
      const userPrograms = await db.program.findMany({
        where: { coordinatorId: user.id },
        select: { id: true }
      })
      const programIds = userPrograms.map(p => p.id)

      courses = await db.course.findMany({
        where: {
          programId: { in: programIds }
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
          teacher: {
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
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else if (user.role === 'TEACHER') {
      courses = await db.course.findMany({
        where: {
          teacherId: user.id
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
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createCourse(request: NextRequest, user: AuthUser) {
  try {
    const { 
      code, 
      name, 
      description, 
      credits, 
      type, 
      programId, 
      batchId, 
      target, 
      level1, 
      level2, 
      level3 
    } = await request.json()

    if (!code || !name || !credits || !type || !programId || !batchId) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if course code already exists for this program
    const existingCourse = await db.course.findFirst({
      where: {
        code,
        programId
      }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course with this code already exists in the program' },
        { status: 400 }
      )
    }

    const newCourse = await db.course.create({
      data: {
        code,
        name,
        description,
        credits: parseInt(credits),
        type,
        programId,
        batchId,
        target: parseFloat(target),
        level1: parseFloat(level1),
        level2: parseFloat(level2),
        level3: parseFloat(level3),
        creatorId: user.id
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

    return NextResponse.json({ course: newCourse })
  } catch (error) {
    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getCourses)
export const POST = requireAuth(createCourse)