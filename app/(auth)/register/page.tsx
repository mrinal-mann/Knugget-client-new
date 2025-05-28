'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/use-auth'
import { RegisterFormData } from '@/types'

const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    terms: z.boolean().refine(val => val === true, {
        message: 'You must accept the terms and conditions',
    }),
})

type RegisterFormFields = RegisterFormData & { terms: boolean }

export default function RegisterPage() {
    const router = useRouter()
    const { register: registerUser, isRegistering, isAuthenticated } = useAuth()
    const [showPassword, setShowPassword] = React.useState(false)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormFields>({
        resolver: zodResolver(registerSchema),
    })

    const password = watch('password', '')

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, router])

    const onSubmit = async (data: RegisterFormFields) => {
        const { terms, ...registerData } = data
        registerUser(registerData)
    }

    // Password strength checker
    const getPasswordStrength = (password: string) => {
        let strength = 0
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        }

        strength = Object.values(checks).filter(Boolean).length
        return { strength, checks }
    }

    const { strength, checks } = getPasswordStrength(password)

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-background dark:to-muted/20 p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
                        <CardDescription>
                            Start generating AI summaries for YouTube videos
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name (optional)</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Your name"
                                        className="pl-10"
                                        {...register('name')}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        className="pl-10"
                                        {...register('email')}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        className="pl-10 pr-10"
                                        {...register('password')}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Password strength indicator */}
                                {password && (
                                    <div className="space-y-2">
                                        <div className="flex space-x-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 w-full rounded-full transition-colors ${i < strength
                                                        ? strength <= 2
                                                            ? 'bg-red-500'
                                                            : strength <= 3
                                                                ? 'bg-yellow-500'
                                                                : 'bg-green-500'
                                                        : 'bg-muted'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            {Object.entries(checks).map(([key, passed]) => (
                                                <div
                                                    key={key}
                                                    className={`flex items-center space-x-2 ${passed ? 'text-green-600' : 'text-muted-foreground'
                                                        }`}
                                                >
                                                    <Check className={`h-3 w-3 ${passed ? 'visible' : 'invisible'}`} />
                                                    <span>
                                                        {key === 'length' && '8+ characters'}
                                                        {key === 'lowercase' && 'Lowercase letter'}
                                                        {key === 'uppercase' && 'Uppercase letter'}
                                                        {key === 'number' && 'Number'}
                                                        {key === 'special' && 'Special character'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="terms" {...register('terms')} />
                                <Label htmlFor="terms" className="text-sm leading-none">
                                    I agree to the{' '}
                                    <Link href="/terms" className="text-primary hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link href="/privacy" className="text-primary hover:underline">
                                        Privacy Policy
                                    </Link>
                                </Label>
                            </div>
                            {errors.terms && (
                                <p className="text-sm text-destructive">{errors.terms.message}</p>
                            )}
                        </CardContent>

                        <CardFooter className="flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isRegistering}
                            >
                                {isRegistering ? 'Creating account...' : 'Create Account'}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                            <div className="text-center text-sm">
                                Already have an account?{' '}
                                <Link
                                    href="/auth/login"
                                    className="text-primary hover:text-primary/80 font-medium hover:underline"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                {/* Sign up benefits */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="mt-8"
                >
                    <div className="text-center mb-4">
                        <h3 className="font-semibold text-sm">What you get with Knugget:</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center space-x-3 bg-white/50 dark:bg-muted/50 rounded-lg p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                                <Check className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">10 Free Credits</p>
                                <p className="text-xs text-muted-foreground">Generate 10 summaries to start</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white/50 dark:bg-muted/50 rounded-lg p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                                <Sparkles className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium">AI-Powered Summaries</p>
                                <p className="text-xs text-muted-foreground">Get key insights from any YouTube video</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 bg-white/50 dark:bg-muted/50 rounded-lg p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                                <ArrowRight className="h-4 w-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium">Chrome Extension</p>
                                <p className="text-xs text-muted-foreground">Seamless YouTube integration</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}