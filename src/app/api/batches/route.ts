import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');

    const batches = await db.batch.findMany({
      where: programId ? { programId } : undefined,
      include: {
        program: true,
        sections: {
          include: {
            _count: {
              select: {
                students: true
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
        startYear: 'desc'
      }
    });

    return NextResponse.json({ batches });

  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { programId, startYear } = await request.json();

    if (!programId || !startYear) {
      return NextResponse.json(
        { error: 'Program ID and start year are required' },
        { status: 400 }
      );
    }

    // Get program to calculate batch name
    const program = await db.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const endYear = startYear + program.duration;
    const batchName = `${startYear}-${endYear}`;

    const batch = await db.batch.create({
      data: {
        name: batchName,
        startYear,
        programId
      },
      include: {
        program: true
      }
    });

    return NextResponse.json({ batch });

  } catch (error: any) {
    console.error('Error creating batch:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}