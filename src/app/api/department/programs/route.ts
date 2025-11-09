import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getPrograms(request: NextRequest, user: AuthUser) {
  try {
    let programs

    if (user.role === 'ADMIN') {
      programs = await db.program.findMany({
        where: {
          collegeId: user.collegeId
        },
        include: {
          coordinator: {
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
    } else if (user.role === 'DEPARTMENT') {
      programs = await db.program.findMany({
        where: {
          collegeId: user.collegeId
        },
        include: {
          coordinator: {
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
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

export const GET = requireRole(['ADMIN', 'DEPARTMENT'])(getPrograms)