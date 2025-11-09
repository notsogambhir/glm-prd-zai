import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const collegeId = searchParams.get('collegeId');

    const users = await db.user.findMany({
      where: {
        ...(role && { role: role as any }),
        ...(collegeId && { collegeId })
      },
      include: {
        college: true,
        department: true,
        managedPrograms: {
          include: {
            college: true
          }
        },
        assignedTeachers: {
          include: {
            teacher: true,
            pc: true
          }
        },
        teacherCourses: {
          include: {
            program: true
          }
        },
        _count: {
          select: {
            managedPrograms: true,
            teacherCourses: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json({ users: usersWithoutPasswords });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, name, role, collegeId, departmentId } = await request.json();

    if (!username || !email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Username, email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role,
        collegeId: collegeId || null,
        departmentId: departmentId || null
      },
      include: {
        college: true,
        department: true
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword });

  } catch (error: any) {
    console.error('Error creating user:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this username or email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}