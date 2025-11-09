'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  UserCheck, 
  Settings,
  Building,
  GraduationCap,
  Save
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
  status: string
}

interface Program {
  id: string
  name: string
  code: string
  collegeId: string
  coordinatorId?: string
  coordinator?: {
    id: string
    name: string
  }
}

interface TeacherAssignment {
  id: string
  teacherId: string
  teacher: User
  pcId: string
  pc: User
  programId: string
  program: Program
}

export default function FacultyManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [teachers, setTeachers] = useState<User[]>([])
  const [pcs, setPcs] = useState<User[]>([])
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const router = useRouter()

  // Form states
  const [pcAssignments, setPcAssignments] = useState<{[key: string]: string}>({})
  const [teacherAssignments, setTeacherAssignments] = useState<{[key: string]: string[]}>({})

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (!['ADMIN', 'DEPARTMENT'].includes(parsedUser.role)) {
        router.push('/dashboard')
        return
      }
    } else {
      router.push('/login')
      return
    }
    fetchData()
  }, [router])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [programsRes, teachersRes, pcsRes, assignmentsRes] = await Promise.all([
        fetch('/api/department/programs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/department/teachers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/department/pcs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/department/assignments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (programsRes.ok) {
        const programsData = await programsRes.json()
        setPrograms(programsData.programs || [])
        
        // Initialize PC assignments
        const pcAssign: {[key: string]: string} = {}
        programsData.programs?.forEach((program: Program) => {
          pcAssign[program.id] = program.coordinatorId || ''
        })
        setPcAssignments(pcAssign)
      }

      if (teachersRes.ok) {
        const teachersData = await teachersRes.json()
        setTeachers(teachersData.teachers || [])
      }

      if (pcsRes.ok) {
        const pcsData = await pcsRes.json()
        setPcs(pcsData.pcs || [])
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData.assignments || [])
        
        // Initialize teacher assignments
        const teacherAssign: {[key: string]: string[]} = {}
        assignmentsData.assignments?.forEach((assignment: TeacherAssignment) => {
          if (!teacherAssign[assignment.teacherId]) {
            teacherAssign[assignment.teacherId] = []
          }
          teacherAssign[assignment.teacherId].push(assignment.pcId)
        })
        setTeacherAssignments(teacherAssign)
      }
    } catch (error) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handlePcAssignmentChange = (programId: string, pcId: string) => {
    setPcAssignments(prev => ({
      ...prev,
      [programId]: pcId
    }))
    setHasChanges(true)
  }

  const handleTeacherAssignmentChange = (teacherId: string, pcId: string, checked: boolean) => {
    setTeacherAssignments(prev => {
      const current = prev[teacherId] || []
      if (checked) {
        return {
          ...prev,
          [teacherId]: [...current, pcId]
        }
      } else {
        return {
          ...prev,
          [teacherId]: current.filter(id => id !== pcId)
        }
      }
    })
    setHasChanges(true)
  }

  const savePcAssignments = async () => {
    try {
      const response = await fetch('/api/department/pc-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assignments: pcAssignments })
      })

      if (response.ok) {
        setSuccess('PC assignments saved successfully')
        setHasChanges(false)
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to save PC assignments')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const saveTeacherAssignments = async (teacherId: string) => {
    try {
      const response = await fetch('/api/department/teacher-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({
          teacherId,
          pcIds: teacherAssignments[teacherId] || []
        })
      })

      if (response.ok) {
        setSuccess('Teacher assignments saved successfully')
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to save teacher assignments')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'PC': return 'bg-green-100 text-green-800'
      case 'TEACHER': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout user={user} showFilters={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-600">Manage program coordinators and teacher assignments</p>
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

        {/* PC Assignments */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Program Coordinator Assignments</CardTitle>
                <CardDescription>Assign PCs to academic programs</CardDescription>
              </div>
              {hasChanges && (
                <Button onClick={savePcAssignments}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programs.map((program) => (
                <div key={program.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <GraduationCap className="h-8 w-8 text-gray-400" />
                    <div>
                      <h3 className="font-medium">{program.name}</h3>
                      <p className="text-sm text-gray-500">{program.code}</p>
                      {program.coordinator && (
                        <Badge className={getRoleColor('PC')} variant="secondary">
                          Current: {program.coordinator.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="w-64">
                    <Label htmlFor={`pc-${program.id}`}>Assign PC</Label>
                    <Select
                      value={pcAssignments[program.id] || ''}
                      onValueChange={(value) => handlePcAssignmentChange(program.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select PC" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No PC Assigned</SelectItem>
                        {pcs.map((pc) => (
                          <SelectItem key={pc.id} value={pc.id}>
                            {pc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teacher Assignments */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Teacher Assignments</CardTitle>
              <CardDescription>Assign teachers to program coordinators</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Users className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{teacher.name}</h3>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                        <Badge className={getRoleColor(teacher.role)}>
                          {teacher.role}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => saveTeacherAssignments(teacher.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                  <div>
                    <Label>Assign to PCs</Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {pcs.map((pc) => (
                        <div key={pc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`teacher-${teacher.id}-pc-${pc.id}`}
                            checked={teacherAssignments[teacher.id]?.includes(pc.id) || false}
                            onCheckedChange={(checked) => 
                              handleTeacherAssignmentChange(teacher.id, pc.id, checked as boolean)
                            }
                          />
                          <Label 
                            htmlFor={`teacher-${teacher.id}-pc-${pc.id}`}
                            className="text-sm"
                          >
                            {pc.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}