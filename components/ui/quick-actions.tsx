'use client'

import React from 'react'
import Link from 'next/link'
import {
    Plus,
    Upload,
    FileText,
    Video,
    Download,
    Settings,
    Share2,
    Search,
    Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface QuickAction {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    href?: string
    onClick?: () => void
    variant?: 'default' | 'secondary' | 'outline'
    badge?: string
    disabled?: boolean
}

interface QuickActionsProps {
    title?: string
    description?: string
    actions?: QuickAction[]
    onActionClick?: (actionId: string) => void
}

const defaultActions: QuickAction[] = [
    {
        id: 'new-summary',
        title: 'New Summary',
        description: 'Create a summary from YouTube URL',
        icon: <Plus className="h-5 w-5" />,
        href: '/dashboard/new',
        variant: 'default'
    },
    {
        id: 'upload-transcript',
        title: 'Upload Transcript',
        description: 'Upload a video transcript file',
        icon: <Upload className="h-5 w-5" />,
        variant: 'outline'
    },
    {
        id: 'browse-summaries',
        title: 'Browse Summaries',
        description: 'View all your summaries',
        icon: <FileText className="h-5 w-5" />,
        href: '/dashboard/summaries',
        variant: 'outline'
    },
    {
        id: 'watch-videos',
        title: 'Watch Videos',
        description: 'Browse recommended videos',
        icon: <Video className="h-5 w-5" />,
        variant: 'outline'
    },
    {
        id: 'export-data',
        title: 'Export Data',
        description: 'Download your summaries',
        icon: <Download className="h-5 w-5" />,
        variant: 'outline'
    },
    {
        id: 'search',
        title: 'Search',
        description: 'Find summaries quickly',
        icon: <Search className="h-5 w-5" />,
        variant: 'outline'
    },
    {
        id: 'upgrade',
        title: 'Upgrade Plan',
        description: 'Get more credits and features',
        icon: <Zap className="h-5 w-5" />,
        href: '/dashboard/billing',
        variant: 'secondary',
        badge: 'Premium'
    },
    {
        id: 'settings',
        title: 'Settings',
        description: 'Manage your preferences',
        icon: <Settings className="h-5 w-5" />,
        href: '/dashboard/settings',
        variant: 'outline'
    }
]

export function QuickActions({
    title = "Quick Actions",
    description = "Common tasks and shortcuts",
    actions = defaultActions,
    onActionClick
}: QuickActionsProps) {
    const handleActionClick = (action: QuickAction) => {
        if (action.disabled) return

        if (action.onClick) {
            action.onClick()
        }

        if (onActionClick) {
            onActionClick(action.id)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {actions.map((action) => {
                        const ActionComponent = action.href ? Link : 'div'
                        const actionProps = action.href ? { href: action.href } : {}

                        return (
                            <ActionComponent key={action.id} {...actionProps}>
                                <Button
                                    variant={action.variant || 'outline'}
                                    className="h-auto p-4 flex flex-col items-center justify-center space-y-2 w-full relative group hover:scale-105 transition-transform"
                                    onClick={() => handleActionClick(action)}
                                    disabled={action.disabled}
                                >
                                    {action.badge && (
                                        <Badge
                                            variant="secondary"
                                            className="absolute -top-2 -right-2 text-xs px-2 py-0.5"
                                        >
                                            {action.badge}
                                        </Badge>
                                    )}

                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-background/10 group-hover:bg-background/20 transition-colors">
                                        {action.icon}
                                    </div>

                                    <div className="text-center">
                                        <div className="font-medium text-sm">{action.title}</div>
                                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                            {action.description}
                                        </div>
                                    </div>
                                </Button>
                            </ActionComponent>
                        )
                    })}
                </div>

                {actions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <Plus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No quick actions available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 