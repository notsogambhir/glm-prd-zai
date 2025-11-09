import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getPrograms(request: NextRequest, user: AuthUser) {
  try {
    const programs = await db.program.findMany({
      include: {
        college: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            batches: true,
            courses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Failed to fetch programs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createProgram(request: NextRequest, user: AuthUser) {
  try {
    const { name, code, collegeId, duration } = await request.json()

    if (!name || !code || !collegeId || !duration) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if program with same code already exists
    const existingProgram = await db.program.findUnique({
      where: { code }
    })

    if (existingProgram) {
      return NextResponse.json(
        { error: 'Program with this code already exists' },
        { status: 400 }
      )
    }

    const program = await db.program.create({
      data: {
        name,
        code,
        collegeId,
        duration: parseInt(duration),
        target: 60.0,
        level1: 40.0,
        level2: 60.0,
        level3: 80.0
      },
      include: {
        college: {
          select: {
            name: true
          }
        },
        _count: {
          select: {
            batches: true,
            courses: true
          }
        }
      }
    })

    return NextResponse.json({ program })
  } catch (error) {
    console.error('Failed to create program:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN'])(getPrograms)
export const POST = requireRole(['ADMIN'])(createProgram)