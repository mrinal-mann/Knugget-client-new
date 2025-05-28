'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UsageData {
    month: string
    summaries: number
    credits: number
}

interface UsageChartProps {
    data: UsageData[]
    title?: string
    description?: string
}

export function UsageChart({
    data,
    title = "Usage Overview",
    description = "Your monthly activity"
}: UsageChartProps) {
    const maxSummaries = Math.max(...data.map(d => d.summaries))
    const maxCredits = Math.max(...data.map(d => d.credits))

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {data.map((item, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">{item.month}</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                        <span className="text-xs text-muted-foreground">
                                            {item.summaries} summaries
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-secondary"></div>
                                        <span className="text-xs text-muted-foreground">
                                            {item.credits} credits
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Simple bar chart */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-16 text-xs text-muted-foreground">Summaries</div>
                                    <div className="flex-1 bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(item.summaries / maxSummaries) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-8 text-xs text-right">{item.summaries}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="w-16 text-xs text-muted-foreground">Credits</div>
                                    <div className="flex-1 bg-muted rounded-full h-2">
                                        <div
                                            className="bg-secondary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(item.credits / maxCredits) * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-8 text-xs text-right">{item.credits}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {data.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No usage data available</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
} 