import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getSections(request: NextRequest, user: AuthUser) {
  try {
    const sections = await db.section.findMany({
      include: {
        batch: {
          include: {
            program: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createSection(request: NextRequest, user: AuthUser) {
  try {
    const { name, batchId } = await request.json()

    if (!name || !batchId) {
      return NextResponse.json(
        { error: 'Name and batch are required' },
        { status: 400 }
      )
    }

    // Check if section already exists
    const existingSection = await db.section.findFirst({
      where: {
        name,
        batchId
      }
    })

    if (existingSection) {
      return NextResponse.json(
        { error: 'Section with this name already exists in the batch' },
        { status: 400 }
      )
    }

    const section = await db.section.create({
      data: {
        name,
        batchId
      },
      include: {
        batch: {
          include: {
            program: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            students: true
          }
        }
      }
    })

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Failed to create section:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN'])(getSections)
export const POST = requireRole(['ADMIN'])(createSection)