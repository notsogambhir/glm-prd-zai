import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getUserCourses(request: NextRequest, user: AuthUser) {
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
    console.error('Failed to fetch user courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getUserCourses)