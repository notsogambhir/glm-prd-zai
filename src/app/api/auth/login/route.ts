import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { username, password, collegeId } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: { username },
      include: {
        college: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check college assignment if collegeId is provided
    if (collegeId && user.role !== 'ADMIN' && user.collegeId !== collegeId) {
      return NextResponse.json(
        { error: 'User is not assigned to this college' },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        collegeId: user.collegeId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}