import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getUserPrograms(request: NextRequest, user: AuthUser) {
  try {
    let programs

    if (user.role === 'ADMIN') {
      programs = await db.program.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          collegeId: true
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
        select: {
          id: true,
          name: true,
          code: true,
          collegeId: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else if (user.role === 'TEACHER') {
      // Get programs from courses assigned to teacher
      const courses = await db.course.findMany({
        where: {
          teacherId: user.id
        },
        select: {
          program: {
            select: {
              id: true,
              name: true,
              code: true,
              collegeId: true
            }
          }
        }
      })

      // Extract unique programs
      const uniquePrograms = courses.reduce((acc, course) => {
        const program = course.program
        if (!acc.find(p => p.id === program.id)) {
          acc.push(program)
        }
        return acc
      }, [] as any[])

      programs = uniquePrograms
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Failed to fetch user programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getUserPrograms)