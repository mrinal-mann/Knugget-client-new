'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, Chrome, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useLogin } from '@/hooks/use-auth-form'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'


// Form validation schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { login, isLoading, error, clearError } = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  // Get return URL and source from query params
  const returnUrl = searchParams.get('returnUrl')
  const source = searchParams.get('source')
  const isFromExtension = source === 'extension'

  // Form setup
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(returnUrl || '/dashboard')
    }
  }, [isAuthenticated, authLoading, router, returnUrl])

  // Clear error when form changes
  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timeout)
    }
  }, [error, clearError])

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      // Navigation is handled by the auth context
    } catch (err) {
      // Error is handled by the useLogin hook
      console.error('Login error:', err)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  // Show loading spinner if checking auth state
  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <CardHeader className="space-y-4">
          {/* Back to website link for extension users */}
          {isFromExtension && (
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to website
            </Link>
          )}

          {/* Logo */}
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-xl knugget-gradient flex items-center justify-center">
              <span className="text-white font-bold text-xl">K</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Welcome back to Knugget
            </CardTitle>
            <CardDescription>
              {isFromExtension ? (
                <>
                  Sign in to sync your account with the Chrome extension
                  <div className="flex items-center justify-center mt-2 text-knugget-600">
                    <Chrome className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Chrome Extension Login</span>
                  </div>
                </>
              ) : (
                'Enter your credentials to access your AI-powered summaries'
              )}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <FormItem>
                <FormLabel htmlFor="email">Email address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...form.register('email')}
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.email?.message}
                </FormMessage>
              </FormItem>

              {/* Password Field */}
              <FormItem>
                <FormLabel htmlFor="password">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      {...form.register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage>
                  {form.formState.errors.password?.message}
                </FormMessage>
              </FormItem>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/auth/reset-password"
                  className="text-sm text-knugget-600 hover:text-knugget-500 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </FormProvider>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Divider */}
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Don&apos;t have an account?
              </span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <Link
              href={`/auth/signup${isFromExtension ? '?source=extension' : ''}${returnUrl ? `&returnUrl=${encodeURIComponent(returnUrl)}` : ''}`}
              className="text-sm text-knugget-600 hover:text-knugget-500 transition-colors font-medium"
            >
              Create a new account
            </Link>
          </div>

          {/* Extension Benefits */}
          {isFromExtension && (
            <div className="mt-6 p-4 bg-knugget-50 dark:bg-knugget-950 rounded-lg border border-knugget-200 dark:border-knugget-800">
              <div className="flex items-start space-x-3">
                <Chrome className="h-5 w-5 text-knugget-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-knugget-900 dark:text-knugget-100">
                    Chrome Extension Benefits
                  </h4>
                  <ul className="text-xs text-knugget-700 dark:text-knugget-300 space-y-1">
                    <li>• Generate summaries directly on YouTube</li>
                    <li>• Sync across all your devices</li>
                    <li>• Access your saved summaries anywhere</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}