// app/dashboard/page.tsx - Main dashboard

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
    FileText,
    TrendingUp,
    Clock,
    Zap,
    Plus,
    ArrowRight,
    Calendar,
    Target,
    BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { StatsCard } from '@/components/ui/stats-card'
import { UsageChart } from '@/components/charts/usage-chart'
import { useAuth } from '@/hooks/use-auth'
import { useUserStats } from '@/hooks/use-auth'
import { useRecentSummaries } from '@/hooks/use-summaries'

export default function DashboardPage() {
    const { user } = useAuth()
    const { data: stats, isLoading: statsLoading } = useUserStats()
    const { data: recentSummaries, isLoading: summariesLoading } = useRecentSummaries(6)

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    // Calculate progress for monthly goals
    const monthlyGoal = user?.plan === 'PREMIUM' ? 100 : 10
    const monthlyProgress = stats ? (stats.summariesThisMonth / monthlyGoal) * 100 : 0

    // Mock usage data for chart
    const usageData = [
        { month: 'Jan', summaries: 12, credits: 15 },
        { month: 'Feb', summaries: 19, credits: 22 },
        { month: 'Mar', summaries: 8, credits: 10 },
        { month: 'Apr', summaries: 25, credits: 30 },
        { month: 'May', summaries: 22, credits: 25 },
        { month: 'Jun', summaries: stats?.summariesThisMonth || 15, credits: stats?.creditsUsed || 18 }
    ]

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="container mx-auto px-4 py-8">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-8"
                >
                    {/* Welcome Section */}
                    <motion.div variants={itemVariants} className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome back, {user?.name || 'there'}! 👋
                        </h1>
                        <p className="text-muted-foreground">
                            Here's what's happening with your YouTube summaries
                        </p>
                    </motion.div>

                    {/* Quick Stats */}
                    <motion.div variants={itemVariants}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <StatsCard
                                title="Total Summaries"
                                value={stats?.totalSummaries || 0}
                                description="All time"
                                icon={<FileText className="h-4 w-4" />}
                                trend={{ value: 12, isPositive: true }}
                            />
                            <StatsCard
                                title="This Month"
                                value={stats?.summariesThisMonth || 0}
                                description={`of ${monthlyGoal} goal`}
                                icon={<Calendar className="h-4 w-4" />}
                            />
                            <StatsCard
                                title="Credits Left"
                                value={user?.credits || 0}
                                description={`${user?.plan || 'Free'} plan`}
                                icon={<Zap className="h-4 w-4" />}
                            />
                            <StatsCard
                                title="Plan Status"
                                value={user?.plan || 'FREE'}
                                description="Current subscription"
                                icon={<BarChart3 className="h-4 w-4" />}
                            />
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left Column - Charts and Activity */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Usage Overview */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Usage Overview
                                        </CardTitle>
                                        <CardDescription>
                                            Your summary generation activity over time
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <UsageChart data={usageData} />
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Recent Summaries */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Recent Summaries</CardTitle>
                                            <CardDescription>
                                                Your latest YouTube video summaries
                                            </CardDescription>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <a href="/summaries">
                                                View All
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </a>
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {summariesLoading ? (
                                            <div className="space-y-3">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="animate-pulse">
                                                        <div className="h-20 bg-muted rounded-lg" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : recentSummaries && recentSummaries.length > 0 ? (
                                            <div className="space-y-3">
                                                {recentSummaries.slice(0, 3).map((summary) => (
                                                    <div key={summary.id} className="p-4 border rounded-lg">
                                                        <h4 className="font-medium text-sm line-clamp-1">{summary.title}</h4>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {summary.videoMetadata.channelName}
                                                        </p>
                                                        <Badge variant="secondary" className="mt-2 text-xs">
                                                            {summary.status}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                                <h3 className="text-lg font-medium mb-2">No summaries yet</h3>
                                                <p className="text-muted-foreground mb-4">
                                                    Generate your first YouTube video summary to get started
                                                </p>
                                                <Button asChild>
                                                    <a href="/generate">
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Create Summary
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Right Column - Quick Actions and Activity */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quick Actions</CardTitle>
                                        <CardDescription>Common tasks and shortcuts</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button variant="default" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                                                <a href="/generate">
                                                    <Plus className="h-5 w-5" />
                                                    <span className="text-sm">New Summary</span>
                                                </a>
                                            </Button>
                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                                                <a href="/summaries">
                                                    <FileText className="h-5 w-5" />
                                                    <span className="text-sm">Browse</span>
                                                </a>
                                            </Button>
                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                                                <a href="/settings">
                                                    <Target className="h-5 w-5" />
                                                    <span className="text-sm">Settings</span>
                                                </a>
                                            </Button>
                                            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2" asChild>
                                                <a href="/pricing">
                                                    <Zap className="h-5 w-5" />
                                                    <span className="text-sm">Upgrade</span>
                                                </a>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Monthly Progress */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="h-5 w-5" />
                                            Monthly Goal
                                        </CardTitle>
                                        <CardDescription>
                                            Track your summary generation progress
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Progress</span>
                                                <span>{stats?.summariesThisMonth || 0} / {monthlyGoal}</span>
                                            </div>
                                            <Progress value={monthlyProgress} className="h-2" />
                                        </div>

                                        <div className="text-sm text-muted-foreground">
                                            {monthlyProgress >= 100 ? (
                                                <span className="text-green-600 font-medium">
                                                    🎉 Goal achieved! Great work!
                                                </span>
                                            ) : (
                                                <span>
                                                    {monthlyGoal - (stats?.summariesThisMonth || 0)} more to reach your goal
                                                </span>
                                            )}
                                        </div>

                                        {user?.plan === 'FREE' && monthlyProgress > 80 && (
                                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                <p className="text-sm text-orange-800 font-medium">
                                                    Almost at your limit!
                                                </p>
                                                <p className="text-xs text-orange-600 mt-1">
                                                    Upgrade to Premium for unlimited summaries
                                                </p>
                                                <Button variant="default" size="sm" className="mt-2" asChild>
                                                    <a href="/pricing">Upgrade Now</a>
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Plan Status */}
                            <motion.div variants={itemVariants}>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Current Plan
                                            <Badge variant={user?.plan === 'PREMIUM' ? 'default' : 'secondary'}>
                                                {user?.plan || 'Free'}
                                            </Badge>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Credits Used</span>
                                                <span>{stats?.creditsUsed || 0}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Credits Remaining</span>
                                                <span className={user?.credits && user.credits < 3 ? 'text-orange-600 font-medium' : ''}>
                                                    {user?.credits || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {user?.plan === 'FREE' && (
                                            <div className="pt-4 border-t">
                                                <h4 className="font-medium text-sm mb-2">Upgrade Benefits</h4>
                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                    <li>• Unlimited summaries</li>
                                                    <li>• Priority processing</li>
                                                    <li>• Advanced features</li>
                                                    <li>• Export options</li>
                                                </ul>
                                                <Button variant="default" className="w-full mt-3" asChild>
                                                    <a href="/pricing">Upgrade to Premium</a>
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}