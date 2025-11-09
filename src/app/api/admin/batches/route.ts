import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'

async function getBatches(request: NextRequest, user: AuthUser) {
  try {
    const batches = await db.batch.findMany({
      include: {
        program: {
          select: {
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            sections: true,
            students: true
          }
        }
      },
      orderBy: {
        startYear: 'desc'
      }
    })

    return NextResponse.json({ batches })
  } catch (error) {
    console.error('Failed to fetch batches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createBatch(request: NextRequest, user: AuthUser) {
  try {
    const { programId, startYear } = await request.json()

    if (!programId || !startYear) {
      return NextResponse.json(
        { error: 'Program and start year are required' },
        { status: 400 }
      )
    }

    // Get program to calculate end year
    const program = await db.program.findUnique({
      where: { id: programId },
      select: { duration: true }
    })

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      )
    }

    const endYear = startYear + program.duration
    const batchName = `${startYear}-${endYear}`

    // Check if batch already exists
    const existingBatch = await db.batch.findFirst({
      where: {
        programId,
        name: batchName
      }
    })

    if (existingBatch) {
      return NextResponse.json(
        { error: 'Batch already exists for this program and year' },
        { status: 400 }
      )
    }

    const batch = await db.batch.create({
      data: {
        name: batchName,
        startYear: parseInt(startYear),
        programId
      },
      include: {
        program: {
          select: {
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            sections: true,
            students: true
          }
        }
      }
    })

    return NextResponse.json({ batch })
  } catch (error) {
    console.error('Failed to create batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN'])(getBatches)
export const POST = requireRole(['ADMIN'])(createBatch)