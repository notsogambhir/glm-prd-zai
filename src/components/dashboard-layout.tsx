'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Grid3X3
} from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: string
  collegeId?: string
  college?: {
    id: string
    name: string
    code: string
  }
}

interface College {
  id: string
  name: string
  code: string
}

interface Program {
  id: string
  name: string
  code: string
  collegeId: string
}

interface Batch {
  id: string
  name: string
  startYear: number
  programId: string
}

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User
  selectedCollege?: string
  selectedProgram?: string
  selectedBatch?: string
  onCollegeChange?: (collegeId: string) => void
  onProgramChange?: (programId: string) => void
  onBatchChange?: (batchId: string) => void
  showFilters?: boolean
}

export default function DashboardLayout({
  children,
  user,
  selectedCollege,
  selectedProgram,
  selectedBatch,
  onCollegeChange,
  onProgramChange,
  onBatchChange,
  showFilters = true
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [colleges, setColleges] = useState<College[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchColleges()
  }, [])

  useEffect(() => {
    if (selectedCollege) {
      fetchPrograms(selectedCollege)
    }
  }, [selectedCollege])

  useEffect(() => {
    if (selectedProgram) {
      fetchBatches(selectedProgram)
    }
  }, [selectedProgram])

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges')
      if (response.ok) {
        const data = await response.json()
        setColleges(data.colleges || [])
      }
    } catch (error) {
      console.error('Failed to fetch colleges:', error)
    }
  }

  const fetchPrograms = async (collegeId: string) => {
    try {
      const response = await fetch(`/api/colleges/${collegeId}/programs`)
      if (response.ok) {
        const data = await response.json()
        setPrograms(data.programs || [])
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error)
    }
  }

  const fetchBatches = async (programId: string) => {
    try {
      const response = await fetch(`/api/programs/${programId}/batches`)
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
        roles: ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PC', 'TEACHER']
      },
      {
        title: 'Courses',
        icon: BookOpen,
        href: '/courses',
        roles: ['ADMIN', 'PC', 'TEACHER']
      },
      {
        title: 'Students',
        icon: Users,
        href: '/students',
        roles: ['ADMIN', 'DEPARTMENT', 'PC']
      },
      {
        title: 'Assessments',
        icon: ClipboardList,
        href: '/assessments',
        roles: ['ADMIN', 'PC', 'TEACHER']
      },
      {
        title: 'Reports',
        icon: BarChart3,
        href: '/reports',
        roles: ['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PC', 'TEACHER']
      }
    ]

    const adminItems = [
      {
        title: 'Academic Structure',
        icon: GraduationCap,
        href: '/admin/academic-structure',
        roles: ['ADMIN']
      },
      {
        title: 'User Management',
        icon: Users,
        href: '/admin/users',
        roles: ['ADMIN']
      },
      {
        title: 'Faculty Management',
        icon: Users,
        href: '/department/faculty',
        roles: ['ADMIN', 'DEPARTMENT']
      }
    ]

    return [...baseItems, ...adminItems].filter(item => 
      item.roles.includes(user.role)
    )
  }

  const navigationItems = getNavigationItems()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'UNIVERSITY': return 'bg-purple-100 text-purple-800'
      case 'DEPARTMENT': return 'bg-blue-100 text-blue-800'
      case 'PC': return 'bg-green-100 text-green-800'
      case 'TEACHER': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4"
              >
                {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">
                NBA OBE Portal
              </h1>
              {selectedProgram && selectedBatch && (
                <div className="ml-4 text-sm text-gray-600">
                  {programs.find(p => p.id === selectedProgram)?.name} - {batches.find(b => b.id === selectedBatch)?.name}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/program-selection')}
                title="Program Selection"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white shadow-sm border-r overflow-hidden`}>
          <nav className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            ))}
          </nav>

          {/* Filters */}
          {showFilters && navigationItems.length > 0 && (
            <div className="p-4 border-t">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
              
              {(['ADMIN', 'UNIVERSITY', 'DEPARTMENT'].includes(user.role)) && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      College
                    </label>
                    <Select value={selectedCollege} onValueChange={onCollegeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college.id} value={college.id}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedCollege && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <Select value={selectedProgram} onValueChange={onProgramChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {selectedProgram && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Batch
                      </label>
                      <Select value={selectedBatch} onValueChange={onBatchChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select batch" />
                        </SelectTrigger>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}