import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getCurrentUser(request: NextRequest, user: AuthUser) {
  try {
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
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
        }
      }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: currentUser })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getCurrentUser)