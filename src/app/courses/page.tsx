'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  Search,
  Filter,
  Upload,
  Eye,
  Users,
  Calendar
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

interface Course {
  id: string
  code: string
  name: string
  description?: string
  credits: number
  type: string
  status: string
  target: number
  level1: number
  level2: number
  level3: number
  programId: string
  program: {
    name: string
    code: string
  }
  batch: {
    name: string
  }
  creatorId: string
  creator: {
    name: string
  }
  teacherId?: string
  teacher?: {
    name: string
  }
  _count?: {
    courseOutcomes: number
    assessments: number
    enrollments: number
  }
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

export default function CoursesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedProgram, setSelectedProgram] = useState('')
  const [selectedBatch, setSelectedBatch] = useState('')
  const router = useRouter()

  // Form states
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3,
    type: 'THEORY',
    programId: '',
    batchId: '',
    target: 60.0,
    level1: 40.0,
    level2: 60.0,
    level3: 80.0
  })
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (!['ADMIN', 'PC', 'TEACHER'].includes(parsedUser.role)) {
        router.push('/dashboard')
        return
      }
    } else {
      router.push('/login')
      return
    }
    fetchData()
  }, [router])

  useEffect(() => {
    if (selectedProgram) {
      fetchBatches(selectedProgram)
    }
  }, [selectedProgram])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [coursesRes, programsRes] = await Promise.all([
        fetch('/api/courses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/user/programs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }

      if (programsRes.ok) {
        const programsData = await programsRes.json()
        setPrograms(programsData.programs || [])
      }
    } catch (error) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchBatches = async (programId: string) => {
    try {
      const response = await fetch(`/api/programs/${programId}/batches`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setBatches(data.batches || [])
      }
    } catch (error) {
      console.error('Failed to fetch batches:', error)
    }
  }

  const handleCreateCourse = async () => {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(courseForm)
      })

      if (response.ok) {
        setSuccess('Course created successfully')
        setCourseForm({
          code: '',
          name: '',
          description: '',
          credits: 3,
          type: 'THEORY',
          programId: '',
          batchId: '',
          target: 60.0,
          level1: 40.0,
          level2: 60.0,
          level3: 80.0
        })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create course')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return

    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(courseForm)
      })

      if (response.ok) {
        setSuccess('Course updated successfully')
        setEditingCourse(null)
        setCourseForm({
          code: '',
          name: '',
          description: '',
          credits: 3,
          type: 'THEORY',
          programId: '',
          batchId: '',
          target: 60.0,
          level1: 40.0,
          level2: 60.0,
          level3: 80.0
        })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update course')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleStatusChange = async (courseId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setSuccess('Course status updated successfully')
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update course status')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccess('Course deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to delete course')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const openEditDialog = (course: Course) => {
    setEditingCourse(course)
    setCourseForm({
      code: course.code,
      name: course.name,
      description: course.description || '',
      credits: course.credits,
      type: course.type,
      programId: course.programId,
      batchId: course.batch?.id || '',
      target: course.target,
      level1: course.level1,
      level2: course.level2,
      level3: course.level3
    })
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter
    const matchesProgram = !selectedProgram || course.programId === selectedProgram
    return matchesSearch && matchesStatus && matchesProgram
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'FUTURE': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'THEORY': return 'bg-purple-100 text-purple-800'
      case 'LAB': return 'bg-orange-100 text-orange-800'
      case 'ELECTIVE': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout 
      user={user} 
      selectedProgram={selectedProgram}
      selectedBatch={selectedBatch}
      onProgramChange={setSelectedProgram}
      onBatchChange={setSelectedBatch}
      showFilters={['ADMIN', 'PC'].includes(user.role)}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600">Manage academic courses and curriculum</p>
          </div>
          {['ADMIN', 'PC'].includes(user.role) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? 'Edit Course' : 'Add New Course'}</DialogTitle>
                  <DialogDescription>
                    {editingCourse ? 'Update course information' : 'Create a new academic course'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="code">Course Code</Label>
                      <Input
                        id="code"
                        value={courseForm.code}
                        onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Course Name</Label>
                      <Input
                        id="name"
                        value={courseForm.name}
                        onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        placeholder="Enter course name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      placeholder="Course description (optional)"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="credits">Credits</Label>
                      <Input
                        id="credits"
                        type="number"
                        value={courseForm.credits}
                        onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) })}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={courseForm.type}
                        onValueChange={(value) => setCourseForm({ ...courseForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="THEORY">Theory</SelectItem>
                          <SelectItem value="LAB">Lab</SelectItem>
                          <SelectItem value="ELECTIVE">Elective</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="program">Program</Label>
                      <Select
                        value={courseForm.programId}
                        onValueChange={(value) => setCourseForm({ ...courseForm, programId: value })}
                      >
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
                  </div>

                  {courseForm.programId && (
                    <div>
                      <Label htmlFor="batch">Batch</Label>
                      <Select
                        value={courseForm.batchId}
                        onValueChange={(value) => setCourseForm({ ...courseForm, batchId: value })}
                      >
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

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="target">Target %</Label>
                      <Input
                        id="target"
                        type="number"
                        value={courseForm.target}
                        onChange={(e) => setCourseForm({ ...courseForm, target: parseFloat(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level1">Level 1 %</Label>
                      <Input
                        id="level1"
                        type="number"
                        value={courseForm.level1}
                        onChange={(e) => setCourseForm({ ...courseForm, level1: parseFloat(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level2">Level 2 %</Label>
                      <Input
                        id="level2"
                        type="number"
                        value={courseForm.level2}
                        onChange={(e) => setCourseForm({ ...courseForm, level2: parseFloat(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="level3">Level 3 %</Label>
                      <Input
                        id="level3"
                        type="number"
                        value={courseForm.level3}
                        onChange={(e) => setCourseForm({ ...courseForm, level3: parseFloat(e.target.value) })}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={editingCourse ? handleUpdateCourse : handleCreateCourse} 
                    className="w-full"
                  >
                    {editingCourse ? 'Update Course' : 'Create Course'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Course List</CardTitle>
                <CardDescription>Manage academic courses and their settings</CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="FUTURE">Future</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading courses...</div>
            ) : (
              <div className="space-y-4">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{course.name}</h3>
                        <p className="text-sm text-gray-500">{course.code}</p>
                        {course.description && (
                          <p className="text-sm text-gray-600">{course.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                          <Badge className={getTypeColor(course.type)}>
                            {course.type}
                          </Badge>
                          <Badge variant="outline">{course.credits} credits</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {course.program.name} • {course.batch?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {['ADMIN', 'PC'].includes(user.role) && (
                        <>
                          <Select
                            value={course.status}
                            onValueChange={(value) => handleStatusChange(course.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FUTURE">Future</SelectItem>
                              <SelectItem value="ACTIVE">Active</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/courses/${course.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredCourses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No courses found matching your criteria
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}