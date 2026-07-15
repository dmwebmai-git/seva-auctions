
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { canAccessAdmin } from '@/lib/roles'

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      })

      if (result?.error) {
        setErrors({ general: 'Invalid email or password' })
        toast.error('Login failed', {
          description: 'Please check your credentials and try again'
        })
      } else {
        toast.success('Welcome back!', {
          description: 'You have been logged in successfully'
        })
        
        // Fetch the session to get user role
        const response = await fetch('/api/auth/session')
        const session = await response.json()
        
        // Redirect based on role
        if (canAccessAdmin(session?.user?.role)) {
          router.replace('/admin')
        } else {
          router.replace('/profile')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      setErrors({ general: 'Something went wrong. Please try again.' })
      toast.error('Login failed', {
        description: 'An unexpected error occurred'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {errors.general}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="mt-1 relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`seva-input transition-all ${formData.email ? 'pl-3' : 'pl-12'}`}
              disabled={isLoading}
            />
            {!formData.email && (
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-opacity" />
            )}
          </div>
          {errors.email && (
            <p className="seva-form-error">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="mt-1 relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`seva-input transition-all ${formData.password ? 'pl-3' : 'pl-12'} pr-10`}
              disabled={isLoading}
            />
            {!formData.password && (
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-opacity" />
            )}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="seva-form-error">{errors.password}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            className="h-4 w-4 text-[#94B957] border-gray-300 rounded focus:ring-[#94B957]"
          />
          <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
            Remember me
          </label>
        </div>

        <button 
          type="button"
          className="text-sm text-[#94B957] hover:text-[#7A9941] transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full seva-button-primary h-11"
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="seva-spinner mr-2"></div>
            Signing in...
          </div>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}
