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
  ClipboardList, 
  Search,
  Filter,
  FileText,
  Users,
  Calendar,
  Download,
  Upload
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
  programId: string
  program: {
    name: string
    code: string
  }
  batch: {
    name: string
  }
  status: string
}

interface Section {
  id: string
  name: string
  batchId: string
  batch: {
    name: string
    program: {
      name: string
    }
  }
}

interface Assessment {
  id: string
  name: string
  type: string
  courseId: string
  course: {
    code: string
    name: string
    program: {
      name: string
    }
  }
  sectionId: string
  section: {
    name: string
    batch: {
      name: string
    }
  }
  creatorId: string
  creator: {
    name: string
  }
  status: string
  maxMarks: number
  _count?: {
    questions: number
    markScores: number
  }
}

export default function AssessmentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const router = useRouter()

  // Form states
  const [assessmentForm, setAssessmentForm] = useState({
    name: '',
    type: 'INTERNAL',
    courseId: '',
    sectionId: '',
    maxMarks: 100
  })
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)

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
    if (selectedCourse) {
      fetchSections(selectedCourse)
    }
  }, [selectedCourse])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [assessmentsRes, coursesRes] = await Promise.all([
        fetch('/api/assessments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/user/courses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json()
        setAssessments(assessmentsData.assessments || [])
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }
    } catch (error) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchSections = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/sections`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || [])
      }
    } catch (error) {
      console.error('Failed to fetch sections:', error)
    }
  }

  const handleCreateAssessment = async () => {
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(assessmentForm)
      })

      if (response.ok) {
        setSuccess('Assessment created successfully')
        setAssessmentForm({
          name: '',
          type: 'INTERNAL',
          courseId: '',
          sectionId: '',
          maxMarks: 100
        })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create assessment')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this assessment? This will also delete all questions and marks.')) return

    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccess('Assessment deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to delete assessment')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const openEditDialog = (assessment: Assessment) => {
    setEditingAssessment(assessment)
    setAssessmentForm({
      name: assessment.name,
      type: assessment.type,
      courseId: assessment.courseId,
      sectionId: assessment.sectionId,
      maxMarks: assessment.maxMarks
    })
  }

  const filteredAssessments = assessments.filter(assessment => {
    const matchesSearch = assessment.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'ALL' || assessment.type === typeFilter
    const matchesStatus = statusFilter === 'ALL' || assessment.status === statusFilter
    const matchesCourse = !selectedCourse || assessment.courseId === selectedCourse
    const matchesSection = !selectedSection || assessment.sectionId === selectedSection
    return matchesSearch && matchesType && matchesStatus && matchesCourse && matchesSection
  })

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INTERNAL': return 'bg-blue-100 text-blue-800'
      case 'EXTERNAL': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout 
      user={user} 
      selectedProgram={selectedCourse}
      selectedBatch={selectedSection}
      onProgramChange={setSelectedCourse}
      onBatchChange={setSelectedSection}
      showFilters={['ADMIN', 'PC'].includes(user.role)}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="text-gray-600">Manage course assessments and grading</p>
          </div>
          {['ADMIN', 'PC', 'TEACHER'].includes(user.role) && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assessment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingAssessment ? 'Edit Assessment' : 'Add New Assessment'}</DialogTitle>
                  <DialogDescription>
                    {editingAssessment ? 'Update assessment information' : 'Create a new assessment'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Assessment Name</Label>
                    <Input
                      id="name"
                      value={assessmentForm.name}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, name: e.target.value })}
                      placeholder="e.g., Mid-Term Exam"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={assessmentForm.type}
                        onValueChange={(value) => setAssessmentForm({ ...assessmentForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INTERNAL">Internal</SelectItem>
                          <SelectItem value="EXTERNAL">External</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="maxMarks">Max Marks</Label>
                      <Input
                        id="maxMarks"
                        type="number"
                        value={assessmentForm.maxMarks}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, maxMarks: parseInt(e.target.value) })}
                        min="1"
                        max="1000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="course">Course</Label>
                    <Select
                      value={assessmentForm.courseId}
                      onValueChange={(value) => setAssessmentForm({ ...assessmentForm, courseId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {assessmentForm.courseId && (
                    <div>
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={assessmentForm.sectionId}
                        onValueChange={(value) => setAssessmentForm({ ...assessmentForm, sectionId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name} - {section.batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button 
                    onClick={handleCreateAssessment} 
                    className="w-full"
                  >
                    Create Assessment
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
                <CardTitle>Assessment List</CardTitle>
                <CardDescription>Manage course assessments and questions</CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search assessments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="INTERNAL">Internal</SelectItem>
                    <SelectItem value="EXTERNAL">External</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading assessments...</div>
            ) : (
              <div className="space-y-4">
                {filteredAssessments.map((assessment) => (
                  <div key={assessment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <ClipboardList className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{assessment.name}</h3>
                        <p className="text-sm text-gray-500">
                          {assessment.course.code} - {assessment.course.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {assessment.section.name} • {assessment.section.batch.name}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getTypeColor(assessment.type)}>
                            {assessment.type}
                          </Badge>
                          <Badge className={getStatusColor(assessment.status)}>
                            {assessment.status}
                          </Badge>
                          <Badge variant="outline">{assessment.maxMarks} marks</Badge>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Created by {assessment.creator.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/assessments/${assessment.id}`)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteAssessment(assessment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredAssessments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No assessments found matching your criteria
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