import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getTeachers(request: NextRequest, user: AuthUser) {
  try {
    let teachers

    if (user.role === 'ADMIN') {
      teachers = await db.user.findMany({
        where: {
          role: 'TEACHER'
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          collegeId: true,
          college: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          status: true
        },
        orderBy: {
          name: 'asc'
        }
      })
    } else if (user.role === 'DEPARTMENT') {
      teachers = await db.user.findMany({
        where: {
          role: 'TEACHER',
          collegeId: user.collegeId
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          role: true,
          collegeId: true,
          college: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          status: true
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

    return NextResponse.json({ teachers })
  } catch (error) {
    console.error('Failed to fetch teachers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN', 'DEPARTMENT'])(getTeachers)