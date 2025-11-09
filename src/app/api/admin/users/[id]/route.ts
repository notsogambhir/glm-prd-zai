import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, AuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

async function updateUser(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    const { username, email, name, password, role, collegeId } = await request.json()

    if (!username || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Username, email, name, and role are required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if username is taken by another user
    const usernameTaken = await db.user.findFirst({
      where: {
        username,
        id: { not: params.id }
      }
    })

    if (usernameTaken) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    // Check if email is taken by another user
    const emailTaken = await db.user.findFirst({
      where: {
        email,
        id: { not: params.id }
      }
    })

    if (emailTaken) {
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

    // Prepare update data
    const updateData: any = {
      username,
      email,
      name,
      role,
      collegeId: ['DEPARTMENT', 'PC', 'TEACHER'].includes(role) ? collegeId : null
    }

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await db.user.update({
      where: { id: params.id },
      data: updateData,
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
        updatedAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Failed to update user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function deleteUser(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: AuthUser
) {
  try {
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of the last admin
    if (existingUser.role === 'ADMIN') {
      const adminCount = await db.user.count({
        where: { role: 'ADMIN' }
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last administrator' },
          { status: 400 }
        )
      }
    }

    // Delete user
    await db.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Failed to delete user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const PATCH = requireRole(['ADMIN'])(updateUser)
export const DELETE = requireRole(['ADMIN'])(deleteUser)