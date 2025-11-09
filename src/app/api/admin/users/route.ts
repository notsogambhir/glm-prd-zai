import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

async function getUsers(request: NextRequest, user: AuthUser) {
  try {
    const users = await db.user.findMany({
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
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function createUser(request: NextRequest, user: AuthUser) {
  try {
    const { username, email, name, password, role, collegeId } = await request.json()

    if (!username || !email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingUser = await db.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Validate college assignment
    if (['DEPARTMENT', 'PC', 'TEACHER'].includes(role) && !collegeId) {
      return NextResponse.json(
        { error: 'College assignment is required for this role' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await db.user.create({
      data: {
        username,
        email,
        name,
        password: hashedPassword,
        role,
        collegeId: ['DEPARTMENT', 'PC', 'TEACHER'].includes(role) ? collegeId : null
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
        status: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireRole(['ADMIN'])(getUsers)
export const POST = requireRole(['ADMIN'])(createUser)