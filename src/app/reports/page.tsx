'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  BarChart3, 
  Download, 
  FileText,
  TrendingUp,
  Users,
  BookOpen,
  Target,
  Filter
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

interface ReportData {
  type: 'course-attainment' | 'assessment-comparison'
  courseId?: string
  sectionId?: string
  scope: 'overall' | 'section'
}

export default function ReportsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reportData, setReportData] = useState<ReportData>({
    type: 'course-attainment',
    scope: 'overall'
  })
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedSection, setSelectedSection] = useState('')
  const [reportPreview, setReportPreview] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
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
      const [coursesRes] = await Promise.all([
        fetch('/api/user/courses', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses || [])
      }
    } catch (error) {
      setError('Failed to fetch data')
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

  const generateReport = async () => {
    if (!reportData.courseId) {
      setError('Please select a course')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const data = await response.json()
        setReportPreview(data.report)
        setShowPreview(true)
        setSuccess('Report generated successfully')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to generate report')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!reportPreview) return

    try {
      const response = await fetch('/api/reports/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportData.type}-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSuccess('PDF downloaded successfully')
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to download PDF')
      }
    } catch (error) {
      setError('Network error')
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
      showFilters={['ADMIN', 'UNIVERSITY', 'DEPARTMENT', 'PC', 'TEACHER'].includes(user.role)}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Generate and download attainment reports</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>Configure report parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Report Type</label>
                <Select
                  value={reportData.type}
                  onValueChange={(value: any) => setReportData({ ...reportData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course-attainment">Course Attainment Summary</SelectItem>
                    <SelectItem value="assessment-comparison">Assessment Comparison Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Course</label>
                <Select
                  value={reportData.courseId}
                  onValueChange={(value: any) => setReportData({ ...reportData, courseId: value })}
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

              {reportData.type === 'course-attainment' && (
                <div>
                  <label className="text-sm font-medium">Scope</label>
                  <Select
                    value={reportData.scope}
                    onValueChange={(value: any) => setReportData({ ...reportData, scope: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overall">Overall Course</SelectItem>
                      <SelectItem value="section">Specific Section</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {reportData.type === 'course-attainment' && reportData.scope === 'section' && (
                <div>
                  <label className="text-sm font-medium">Section</label>
                  <Select
                    value={reportData.sectionId}
                    onValueChange={(value: any) => setReportData({ ...reportData, sectionId: value })}
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

              <div className="flex space-x-2">
                <Button 
                  onClick={generateReport}
                  disabled={loading || !reportData.courseId}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Statistics</CardTitle>
              <CardDescription>System overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium">Total Students</p>
                      <p className="text-sm text-gray-500">Across all programs</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">150</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium">Active Courses</p>
                      <p className="text-sm text-gray-500">This semester</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">24</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium">Avg. Attainment</p>
                      <p className="text-sm text-gray-500">Across all COs</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-lg">78%</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-orange-500 mr-3" />
                    <div>
                      <p className="font-medium">Improvement</p>
                      <p className="text-sm text-gray-500">vs last semester</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-lg">+12%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Preview */}
        {reportPreview && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Report Preview</CardTitle>
                  <CardDescription>Preview of generated report</CardDescription>
                </div>
                <Button onClick={downloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {reportData.type === 'course-attainment' ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Course Attainment Summary</h3>
                      <div className="text-sm text-gray-600 mb-4">
                        {reportPreview.courseInfo?.name} - {reportPreview.courseInfo?.code}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Overall CO Attainment</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="border px-4 py-2 text-left">CO Code</th>
                              <th className="border px-4 py-2 text-left">Description</th>
                              <th className="border px-4 py-2 text-center">Students Meeting Target</th>
                              <th className="border px-4 py-2 text-center">Percentage</th>
                              <th className="border px-4 py-2 text-center">Attainment Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportPreview.coAttainments?.map((co: any) => (
                              <tr key={co.code} className="hover:bg-gray-50">
                                <td className="border px-4 py-2 font-medium">{co.code}</td>
                                <td className="border px-4 py-2">{co.description}</td>
                                <td className="border px-4 py-2 text-center">{co.studentsMeetingTarget}</td>
                                <td className="border px-4 py-2 text-center">{co.percentageMeetingTarget.toFixed(1)}%</td>
                                <td className="border px-4 py-2 text-center">
                                  <Badge className={
                                    co.attainmentLevel === 3 ? 'bg-green-100 text-green-800' :
                                    co.attainmentLevel === 2 ? 'bg-yellow-100 text-yellow-800' :
                                    co.attainmentLevel === 1 ? 'bg-orange-100 text-orange-800' :
                                    'bg-red-100 text-red-800'
                                  }>
                                    Level {co.attainmentLevel}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Assessment Comparison</h3>
                    <div className="text-sm text-gray-600 mb-4">
                      Performance across different assessments
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}