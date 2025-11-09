import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthUser } from '@/lib/auth'

async function getDashboardActivity(request: NextRequest, user: AuthUser) {
  try {
    // Mock recent activity data - in a real app, this would come from a database
    const activities = [
      {
        id: '1',
        type: 'course_created',
        description: 'New course "Digital Signal Processing" was created',
        timestamp: '2 hours ago',
        status: 'success' as const
      },
      {
        id: '2',
        type: 'assessment_created',
        description: 'Mid-term assessment for "Electronics Lab" was created',
        timestamp: '4 hours ago',
        status: 'success' as const
      },
      {
        id: '3',
        type: 'student_enrolled',
        description: '15 students were enrolled in "Communication Systems"',
        timestamp: '1 day ago',
        status: 'success' as const
      },
      {
        id: '4',
        type: 'report_generated',
        description: 'CO attainment report was generated for ECE program',
        timestamp: '2 days ago',
        status: 'success' as const
      },
      {
        id: '5',
        type: 'assessment_created',
        description: 'Lab assessment pending approval',
        timestamp: '3 days ago',
        status: 'pending' as const
      }
    ]

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Failed to fetch dashboard activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = requireAuth(getDashboardActivity)