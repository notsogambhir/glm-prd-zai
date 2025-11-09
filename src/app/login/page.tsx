'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

interface LoginData {
  username: string
  password: string
  collegeId?: string
}

interface College {
  id: string
  name: string
  code: string
}

export default function LoginPage() {
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: '',
    collegeId: ''
  })
  const [colleges, setColleges] = useState<College[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Fetch colleges on mount
  useEffect(() => {
    fetchColleges()
  }, [])

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Redirect based on role
        switch (data.user.role) {
          case 'ADMIN':
          case 'UNIVERSITY':
          case 'DEPARTMENT':
            router.push('/dashboard')
            break
          case 'PC':
          case 'TEACHER':
            router.push('/program-selection')
            break
          default:
            router.push('/dashboard')
        }
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const demoUsers = [
    { username: 'admin', role: 'Administrator', description: 'Full system access' },
    { username: 'university', role: 'University', description: 'Read-only access to all data' },
    { username: 'dept_head', role: 'Department Head', description: 'Manage department and faculty' },
    { username: 'pc_ece', role: 'Program Coordinator', description: 'Manage ECE program' },
    { username: 'teacher1', role: 'Teacher', description: 'Manage assigned courses' }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            NBA OBE Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Outcome Based Education Management System
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="college">College</Label>
                <Select
                  value={loginData.collegeId}
                  onValueChange={(value) => setLoginData({ ...loginData, collegeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your college" />
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

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </form>

            <div className="mt-6 border-t pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Demo Accounts</h4>
              <div className="space-y-2 text-xs">
                {demoUsers.map((user) => (
                  <div key={user.username} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{user.username}</span>
                      <span className="text-gray-500 ml-2">({user.role})</span>
                    </div>
                    <span className="text-gray-500">{user.description}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                <strong>Password:</strong> password (for all demo accounts)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}