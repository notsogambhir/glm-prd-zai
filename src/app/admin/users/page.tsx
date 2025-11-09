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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Search,
  Filter,
  Building,
  GraduationCap
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
  createdAt: string
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

export default function UserManagementPage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [colleges, setColleges] = useState<College[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const router = useRouter()

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    name: '',
    password: '',
    role: 'TEACHER',
    collegeId: '',
    programId: ''
  })
  const [editingUser, setEditingUser] = useState<User | null>(null)

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
      
      const [usersRes, collegesRes, programsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/colleges', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/admin/programs', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ])

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (collegesRes.ok) {
        const collegesData = await collegesRes.json()
        setColleges(collegesData.colleges || [])
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

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        setSuccess('User created successfully')
        setUserForm({
          username: '',
          email: '',
          name: '',
          password: '',
          role: 'TEACHER',
          collegeId: '',
          programId: ''
        })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to create user')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userForm)
      })

      if (response.ok) {
        setSuccess('User updated successfully')
        setEditingUser(null)
        setUserForm({
          username: '',
          email: '',
          name: '',
          password: '',
          role: 'TEACHER',
          collegeId: '',
          programId: ''
        })
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to update user')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        setSuccess('User deleted successfully')
        fetchData()
      } else {
        const error = await response.json()
        setError(error.error || 'Failed to delete user')
      }
    } catch (error) {
      setError('Network error')
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      collegeId: user.collegeId || '',
      programId: ''
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

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

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <DashboardLayout user={user} showFilters={false}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage system users and their roles</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user information' : 'Create a new user account'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="Enter username"
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      placeholder="Enter password"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={userForm.role}
                    onValueChange={(value) => setUserForm({ ...userForm, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="UNIVERSITY">University</SelectItem>
                      <SelectItem value="DEPARTMENT">Department Head</SelectItem>
                      <SelectItem value="PC">Program Coordinator</SelectItem>
                      <SelectItem value="TEACHER">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {['DEPARTMENT', 'PC', 'TEACHER'].includes(userForm.role) && (
                  <div>
                    <Label htmlFor="college">College</Label>
                    <Select
                      value={userForm.collegeId}
                      onValueChange={(value) => setUserForm({ ...userForm, collegeId: value })}
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
                )}
                <Button 
                  onClick={editingUser ? handleUpdateUser : handleCreateUser} 
                  className="w-full"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage system users and their permissions</CardDescription>
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="UNIVERSITY">University</SelectItem>
                    <SelectItem value="DEPARTMENT">Department</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="TEACHER">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((userItem) => (
                  <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Users className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{userItem.name}</h3>
                        <p className="text-sm text-gray-500">{userItem.email}</p>
                        <p className="text-sm text-gray-600">@{userItem.username}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRoleColor(userItem.role)}>
                            {userItem.role}
                          </Badge>
                          {userItem.college && (
                            <Badge variant="outline" className="flex items-center">
                              <Building className="h-3 w-3 mr-1" />
                              {userItem.college.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(userItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(userItem.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No users found matching your criteria
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