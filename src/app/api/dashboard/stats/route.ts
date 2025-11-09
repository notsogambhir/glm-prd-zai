import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getDashboardStats(request: NextRequest, user: AuthUser) {
  try {
    let stats = {
      totalStudents: 0,
      totalCourses: 0,
      totalPrograms: 0,
      totalBatches: 0,
      activeCourses: 0,
      completedCourses: 0,
      pendingAssessments: 0
    }

    // Based on user role, fetch different stats
    switch (user.role) {
      case 'ADMIN':
        stats.totalStudents = await db.student.count()
        stats.totalCourses = await db.course.count()
        stats.totalPrograms = await db.program.count()
        stats.totalBatches = await db.batch.count()
        stats.activeCourses = await db.course.count({ where: { status: 'ACTIVE' } })
        stats.completedCourses = await db.course.count({ where: { status: 'COMPLETED' } })
        stats.pendingAssessments = await db.assessment.count()
        break

      case 'DEPARTMENT':
        if (user.collegeId) {
          stats.totalPrograms = await db.program.count({ where: { collegeId: user.collegeId } })
          const programs = await db.program.findMany({ where: { collegeId: user.collegeId } })
          const programIds = programs.map(p => p.id)
          
          stats.totalBatches = await db.batch.count({ where: { programId: { in: programIds } } })
          stats.totalCourses = await db.course.count({ where: { programId: { in: programIds } } })
          stats.activeCourses = await db.course.count({ 
            where: { 
              programId: { in: programIds },
              status: 'ACTIVE'
            } 
          })
          
          // Count students in these programs
          const batches = await db.batch.findMany({ where: { programId: { in: programIds } } })
          const batchIds = batches.map(b => b.id)
          stats.totalStudents = await db.student.count({ where: { batchId: { in: batchIds } } })
        }
        break

      case 'PC':
        // Get programs where user is coordinator
        const userPrograms = await db.program.findMany({
          where: { coordinatorId: user.id }
        })
        const pcProgramIds = userPrograms.map(p => p.id)
        
        stats.totalPrograms = userPrograms.length
        stats.totalBatches = await db.batch.count({ where: { programId: { in: pcProgramIds } } })
        stats.totalCourses = await db.course.count({ where: { programId: { in: pcProgramIds } } })
        stats.activeCourses = await db.course.count({ 
          where: { 
            programId: { in: pcProgramIds },
            status: 'ACTIVE'
          } 
        })
        
        const pcBatches = await db.batch.findMany({ where: { programId: { in: pcProgramIds } } })
        const pcBatchIds = pcBatches.map(b => b.id)
        stats.totalStudents = await db.student.count({ where: { batchId: { in: pcBatchIds } } })
        break

      case 'TEACHER':
        // Get courses assigned to teacher
        const teacherCourses = await db.course.findMany({
          where: { teacherId: user.id }
        })
        const teacherCourseIds = teacherCourses.map(c => c.id)
        
        stats.totalCourses = teacherCourses.length
        stats.activeCourses = teacherCourses.filter(c => c.status === 'ACTIVE').length
        
        // Count students in teacher's courses
        const enrollments = await db.enrollment.findMany({
          where: { courseId: { in: teacherCourseIds } }
        })
        stats.totalStudents = enrollments.length
        break
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getDashboardStats)