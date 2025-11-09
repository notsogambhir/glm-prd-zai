'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, FileText, Settings, LogOut, BarChart3, Award } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  const getWelcomeMessage = () => {
    const roleMessages = {
      ADMIN: 'System Administrator',
      UNIVERSITY: 'University Dean',
      DEPARTMENT: 'Department Head',
      PC: 'Program Coordinator',
      TEACHER: 'Teacher'
    };
    return roleMessages[user.role] || 'User';
  };

  const getRoleBasedStats = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { label: 'Total Colleges', value: '2', icon: Settings },
          { label: 'Total Programs', value: '4', icon: BookOpen },
          { label: 'Total Users', value: '8', icon: Users },
          { label: 'Active Students', value: '20', icon: Award },
        ];
      case 'PC':
        return [
          { label: 'Managed Programs', value: '2', icon: BookOpen },
          { label: 'Active Courses', value: '8', icon: FileText },
          { label: 'Assigned Teachers', value: '2', icon: Users },
          { label: 'Total Students', value: '20', icon: Award },
        ];
      case 'TEACHER':
        return [
          { label: 'My Courses', value: '4', icon: BookOpen },
          { label: 'Active Assessments', value: '6', icon: FileText },
          { label: 'Total Students', value: '40', icon: Users },
          { label: 'Pending Grading', value: '12', icon: BarChart3 },
        ];
      default:
        return [
          { label: 'Programs', value: '4', icon: BookOpen },
          { label: 'Courses', value: '16', icon: FileText },
          { label: 'Students', value: '80', icon: Users },
          { label: 'Faculty', value: '12', icon: Award },
        ];
    }
  };

  const getQuickActions = () => {
    switch (user.role) {
      case 'ADMIN':
        return [
          { label: 'Manage Colleges', href: '/admin/academic-structure', icon: Settings },
          { label: 'User Management', href: '/admin/users', icon: Users },
          { label: 'System Reports', href: '/reports', icon: BarChart3 },
        ];
      case 'PC':
        return [
          { label: 'Manage Courses', href: '/courses', icon: BookOpen },
          { label: 'Program Outcomes', href: '/program-outcomes', icon: Award },
          { label: 'Assessments', href: '/assessments', icon: FileText },
        ];
      case 'TEACHER':
        return [
          { label: 'My Courses', href: '/courses', icon: BookOpen },
          { label: 'Create Assessment', href: '/assessments', icon: FileText },
          { label: 'Student Marks', href: '/marks', icon: BarChart3 },
        ];
      default:
        return [
          { label: 'View Reports', href: '/reports', icon: BarChart3 },
          { label: 'Dashboard', href: '/dashboard', icon: Settings },
        ];
    }
  };

  const stats = getRoleBasedStats();
  const quickActions = getQuickActions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-600">
                  <span className="text-white font-bold text-sm">NBA</span>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">OBE Portal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.name} - {getWelcomeMessage()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.name}!
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Here's what's happening with your {user.role === 'ADMIN' ? 'system' : 'program'} today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you can perform based on your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => router.push(action.href)}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">System initialized successfully</p>
                    <p className="text-xs text-gray-500">Database seeded with demo data</p>
                  </div>
                  <span className="text-xs text-gray-500">Just now</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user accounts created</p>
                    <p className="text-xs text-gray-500">Demo accounts are ready for testing</p>
                  </div>
                  <span className="text-xs text-gray-500">2 mins ago</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Academic structure configured</p>
                    <p className="text-xs text-gray-500">Colleges, programs, and batches created</p>
                  </div>
                  <span className="text-xs text-gray-500">5 mins ago</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}