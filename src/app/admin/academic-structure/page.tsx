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
  Building, 
  GraduationCap, 
  Calendar,
  Users
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
  description?: string
  _count?: {
    programs: number
  }
}

interface Program {
  id: string
  name: string
  code: string
  collegeId: string
  duration: number
  college: {
    name: string
  }
  _count?: {
    batches: number
    courses: number
  }
}

interface Batch {
  id: string
  name: string
  startYear: number
  programId: string
  program: {
    name: string
    code: string
  }
  _count?: {
    sections: number
    students: number
  }
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
  _count?: {
    students: number
  }
}

export default function AcademicStructurePage() {
  const [user, setUser] = useState<User | null>(null)
  const [colleges, setColleges] = useState<College[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  // Form states
  const [collegeForm, setCollegeForm] = useState({ name: '', code: '', description: '' })
  const [programForm, setProgramForm] = useState({ name: '', code: '', collegeId: '', duration: 4 })
  const [batchForm, setBatchForm] = useState({ startYear: new Date().getFullYear() })
  const [sectionForm, setSectionForm] = useState({ name: '', batchId: '' })

  // Edit states
  const [editingCollege, setEditingCollege] = useState<College | null>(null)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [editingSection, setEditingSection] = useState<Section | null>(null)

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.role !== 'ADMIN') {
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
      
      const [collegesRes, programsRes, batchesRes, sectionsRes] = await Promise.all([
        fetch('/api/admin/colleges', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/programs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/batches', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/sections', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (collegesRes.ok) {
        const collegesData = await collegesRes.json()
        setColleges(collegesData.colleges || [])
      }

      if (programsRes.ok) {
        const programsData = await programsRes.json()
        setPrograms(programsData.programs || [])
      }

      if (batchesRes.ok) {
        const batchesData = await batchesRes.json()
        setBatches(batchesData.batches || [])
      }

      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json()
        setSections(sectionsData.sections || [])
      }
    } catch (error) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCollege = async () => {
    try {
      const response = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(collegeForm)
      })

      if (response.ok) {
        setSuccess('College created successfully')
        setCollegeForm({ name: '', code: '', description: '' })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create college')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleCreateProgram = async () => {
    try {
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(programForm)
      })

      if (response.ok) {
        setSuccess('Program created successfully')
        setProgramForm({ name: '', code: '', collegeId: '', duration: 4 })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create program')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleCreateBatch = async () => {
    if (!programForm.collegeId) {
      setError('Please select a program first')
      return
    }

    try {
      const response = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...batchForm,
          programId: programForm.collegeId
        })
      })

      if (response.ok) {
        setSuccess('Batch created successfully')
        setBatchForm({ startYear: new Date().getFullYear() })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create batch')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleCreateSection = async () => {
    try {
      const response = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(sectionForm)
      })

      if (response.ok) {
        setSuccess('Section created successfully')
        setSectionForm({ name: '', batchId: '' })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create section')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleDelete = async (type: string, id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return

    try {
      const response = await fetch(`/api/admin/${type}s/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`)
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || `Failed to delete ${type}`)
      }
    } catch (error) {
      setError('Network error')
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout user={user} showFilters={false}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Structure</h1>
          <p className="text-gray-600">Manage colleges, programs, batches, and sections</p>
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

        <Tabs defaultValue="colleges" className="space-y-4">
          <TabsList>
            <TabsTrigger value="colleges">Colleges</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="batches">Batches</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="colleges">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Colleges</CardTitle>
                    <CardDescription>Manage educational institutions</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add College
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New College</DialogTitle>
                        <DialogDescription>
                          Create a new college in the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="college-name">Name</Label>
                          <Input
                            id="college-name"
                            value={collegeForm.name}
                            onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })}
                            placeholder="Enter college name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="college-code">Code</Label>
                          <Input
                            id="college-code"
                            value={collegeForm.code}
                            onChange={(e) => setCollegeForm({ ...collegeForm, code: e.target.value })}
                            placeholder="Enter college code"
                          />
                        </div>
                        <div>
                          <Label htmlFor="college-description">Description</Label>
                          <Input
                            id="college-description"
                            value={collegeForm.description}
                            onChange={(e) => setCollegeForm({ ...collegeForm, description: e.target.value })}
                            placeholder="Enter description (optional)"
                          />
                        </div>
                        <Button onClick={handleCreateCollege} className="w-full">
                          Create College
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {colleges.map((college) => (
                    <div key={college.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Building className="h-8 w-8 text-gray-400" />
                        <div>
                          <h3 className="font-medium">{college.name}</h3>
                          <p className="text-sm text-gray-500">{college.code}</p>
                          {college.description && (
                            <p className="text-sm text-gray-600">{college.description}</p>
                          )}
                          <Badge variant="secondary" className="mt-1">
                            {college._count?.programs || 0} programs
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete('college', college.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Programs</CardTitle>
                    <CardDescription>Manage academic programs</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Program
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Program</DialogTitle>
                        <DialogDescription>
                          Create a new academic program
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="program-name">Name</Label>
                          <Input
                            id="program-name"
                            value={programForm.name}
                            onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                            placeholder="Enter program name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="program-code">Code</Label>
                          <Input
                            id="program-code"
                            value={programForm.code}
                            onChange={(e) => setProgramForm({ ...programForm, code: e.target.value })}
                            placeholder="Enter program code"
                          />
                        </div>
                        <div>
                          <Label htmlFor="program-college">College</Label>
                          <Select
                            value={programForm.collegeId}
                            onValueChange={(value) => setProgramForm({ ...programForm, collegeId: value })}
                          >
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
                        <div>
                          <Label htmlFor="program-duration">Duration (years)</Label>
                          <Input
                            id="program-duration"
                            type="number"
                            value={programForm.duration}
                            onChange={(e) => setProgramForm({ ...programForm, duration: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                          />
                        </div>
                        <Button onClick={handleCreateProgram} className="w-full">
                          Create Program
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
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
                          <p className="text-sm text-gray-600">{program.college.name}</p>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="secondary">{program.duration} years</Badge>
                            <Badge variant="outline">{program._count?.batches || 0} batches</Badge>
                            <Badge variant="outline">{program._count?.courses || 0} courses</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete('program', program.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batches">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Batches</CardTitle>
                    <CardDescription>Manage student batches</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Batch
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Batch</DialogTitle>
                        <DialogDescription>
                          Create a new student batch
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="batch-program">Program</Label>
                          <Select
                            value={programForm.collegeId}
                            onValueChange={(value) => setProgramForm({ ...programForm, collegeId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              {programs.map((program) => (
                                <SelectItem key={program.id} value={program.id}>
                                  {program.name} ({program.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="batch-year">Start Year</Label>
                          <Input
                            id="batch-year"
                            type="number"
                            value={batchForm.startYear}
                            onChange={(e) => setBatchForm({ ...batchForm, startYear: parseInt(e.target.value) })}
                            min="2000"
                            max="2030"
                          />
                        </div>
                        <Button onClick={handleCreateBatch} className="w-full">
                          Create Batch
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-8 w-8 text-gray-400" />
                        <div>
                          <h3 className="font-medium">{batch.name}</h3>
                          <p className="text-sm text-gray-500">Started: {batch.startYear}</p>
                          <p className="text-sm text-gray-600">{batch.program.name}</p>
                          <div className="flex space-x-2 mt-1">
                            <Badge variant="outline">{batch._count?.sections || 0} sections</Badge>
                            <Badge variant="outline">{batch._count?.students || 0} students</Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete('batch', batch.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Sections</CardTitle>
                    <CardDescription>Manage class sections</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Section
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Section</DialogTitle>
                        <DialogDescription>
                          Create a new class section
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="section-name">Section Name</Label>
                          <Input
                            id="section-name"
                            value={sectionForm.name}
                            onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                            placeholder="Enter section name (e.g., A, B, C)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="section-batch">Batch</Label>
                          <Select
                            value={sectionForm.batchId}
                            onValueChange={(value) => setSectionForm({ ...sectionForm, batchId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select batch" />
                            </SelectTrigger>
                            <SelectContent>
                              {batches.map((batch) => (
                                <SelectItem key={batch.id} value={batch.id}>
                                  {batch.name} - {batch.program.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleCreateSection} className="w-full">
                          Create Section
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Users className="h-8 w-8 text-gray-400" />
                        <div>
                          <h3 className="font-medium">Section {section.name}</h3>
                          <p className="text-sm text-gray-500">{section.batch.name}</p>
                          <p className="text-sm text-gray-600">{section.batch.program.name}</p>
                          <Badge variant="outline" className="mt-1">
                            {section._count?.students || 0} students
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete('section', section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}