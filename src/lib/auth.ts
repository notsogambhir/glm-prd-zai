import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export interface AuthUser {
  id: string
  username: string
  role: string
  collegeId?: string
}

export function verifyToken(request: NextRequest): AuthUser | null {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export function requireAuth(handler: (req: NextRequest, user: AuthUser, params?: any) => Promise<NextResponse>) {
  return async (request: NextRequest, context?: any) => {
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    return handler(request, user, context?.params)
  }
}

export function requireRole(roles: string[]) {
  return (handler: (req: NextRequest, user: AuthUser, params?: any) => Promise<NextResponse>) => {
    return requireAuth(async (request: NextRequest, user: AuthUser, params?: any) => {
      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
      return handler(request, user, params)
    })
  }
}