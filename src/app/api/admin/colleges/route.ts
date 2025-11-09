import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getColleges(request: NextRequest, user: AuthUser) {
  try {
    const colleges = await db.college.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        _count: {
          select: {
            programs: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ colleges })
  } catch (error) {
    console.error('Failed to fetch colleges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createCollege(request: NextRequest, user: AuthUser) {
  try {
    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if college with same code already exists
    const existingCollege = await db.college.findUnique({
      where: { code }
    })

    if (existingCollege) {
      return NextResponse.json(
        { error: 'College with this code already exists' },
        { status: 400 }
      )
    }

    const college = await db.college.create({
      data: {
        name,
        code,
        description
      },
      include: {
        _count: {
          select: {
            programs: true
          }
        }
      }
    })

    return NextResponse.json({ college })
  } catch (error) {
    console.error('Failed to create college:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN'])(getColleges)
export const POST = requireRole(['ADMIN'])(createCollege)