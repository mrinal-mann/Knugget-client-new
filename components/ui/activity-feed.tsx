'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
    FileText,
    Video,
    User,
    Settings,
    Download,
    Share2,
    Trash2,
    Plus,
    Edit
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ActivityItem {
    id: string
    type: 'summary_created' | 'summary_deleted' | 'summary_shared' | 'profile_updated' | 'video_watched' | 'export_completed'
    title: string
    description?: string
    timestamp: string
    metadata?: {
        videoTitle?: string
        summaryId?: string
        exportFormat?: string
    }
}

interface ActivityFeedProps {
    activities?: ActivityItem[]
    title?: string
    description?: string
    maxItems?: number
}

const defaultActivities: ActivityItem[] = [
    {
        id: '1',
        type: 'summary_created',
        title: 'New summary created',
        description: 'How to Build a React App in 2024',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        metadata: { videoTitle: 'How to Build a React App in 2024' }
    },
    {
        id: '2',
        type: 'video_watched',
        title: 'Watched video',
        description: 'JavaScript ES2024 Features',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
        id: '3',
        type: 'summary_shared',
        title: 'Summary shared',
        description: 'Shared "Next.js 14 Tutorial" summary',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    },
    {
        id: '4',
        type: 'export_completed',
        title: 'Export completed',
        description: 'Downloaded 5 summaries as PDF',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        metadata: { exportFormat: 'PDF' }
    },
    {
        id: '5',
        type: 'profile_updated',
        title: 'Profile updated',
        description: 'Changed notification preferences',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    }
]

export function ActivityFeed({
    activities = defaultActivities,
    title = "Recent Activity",
    description = "Your latest actions and updates",
    maxItems = 10
}: ActivityFeedProps) {
    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'summary_created':
                return <Plus className="h-4 w-4" />
            case 'summary_deleted':
                return <Trash2 className="h-4 w-4" />
            case 'summary_shared':
                return <Share2 className="h-4 w-4" />
            case 'profile_updated':
                return <User className="h-4 w-4" />
            case 'video_watched':
                return <Video className="h-4 w-4" />
            case 'export_completed':
                return <Download className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const getActivityColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'summary_created':
                return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
            case 'summary_deleted':
                return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
            case 'summary_shared':
                return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
            case 'profile_updated':
                return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
            case 'video_watched':
                return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
            case 'export_completed':
                return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400'
            default:
                return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
        }
    }

    const displayedActivities = activities.slice(0, maxItems)

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {displayedActivities.map((activity, index) => (
                            <div key={activity.id} className="flex items-start space-x-3">
                                {/* Activity icon */}
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}>
                                    {getActivityIcon(activity.type)}
                                </div>

                                {/* Activity content */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium">{activity.title}</p>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                                        </span>
                                    </div>

                                    {activity.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {activity.description}
                                        </p>
                                    )}

                                    {activity.metadata?.exportFormat && (
                                        <Badge variant="outline" className="text-xs">
                                            {activity.metadata.exportFormat}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {displayedActivities.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No recent activity</p>
                            <p className="text-xs mt-1">Your activities will appear here</p>
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
} 