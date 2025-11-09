import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getPrograms(request: NextRequest, user: AuthUser) {
  try {
    let programs

    if (user.role === 'ADMIN') {
      programs = await db.program.findMany({
        include: {
          college: {
            select: {
              name: true,
              code: true
            }
          },
          batches: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else if (user.role === 'PC') {
      programs = await db.program.findMany({
        where: {
          coordinatorId: user.id
        },
        include: {
          college: {
            select: {
              name: true,
              code: true
            }
          },
          batches: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else if (user.role === 'TEACHER') {
      // Get programs from teacher's assigned courses
      const teacherCourses = await db.course.findMany({
        where: {
          teacherId: user.id
        },
        select: {
          programId: true
        },
        distinct: ['programId']
      })

      const programIds = teacherCourses.map(c => c.programId)
      
      programs = await db.program.findMany({
        where: {
          id: { in: programIds }
        },
        include: {
          college: {
            select: {
              name: true,
              code: true
            }
          },
          batches: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else {
      programs = []
    }

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN', 'PC', 'TEACHER'])(getPrograms)