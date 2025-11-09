import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getPcs(request: NextRequest, user: AuthUser) {
  try {
    let pcs

    if (user.role === 'ADMIN') {
      pcs = await db.user.findMany({
        where: {
          role: 'PC'
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
      pcs = await db.user.findMany({
        where: {
          role: 'PC',
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

    return NextResponse.json({ pcs })
  } catch (error) {
    console.error('Failed to fetch PCs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN', 'DEPARTMENT'])(getPcs)