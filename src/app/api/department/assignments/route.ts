import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getAssignments(request: NextRequest, user: AuthUser) {
  try {
    let assignments

    if (user.role === 'ADMIN') {
      assignments = await db.teacherAssignment.findMany({
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          pc: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          program: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      })
    } else if (user.role === 'DEPARTMENT') {
      assignments = await db.teacherAssignment.findMany({
        where: {
          program: {
            collegeId: user.collegeId
          }
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          pc: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          program: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      })
    } else {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN', 'DEPARTMENT'])(getAssignments)