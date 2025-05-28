// components/summary-card.tsx - Summary display card

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  Clock, 
  Play, 
  Eye, 
  Edit3, 
  Trash2, 
  BookOpen,
  ExternalLink,
  MoreHorizontal,
  Tag
} from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Summary } from '@/types'
import { formatRelativeTime, truncateText, formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SummaryCardProps {
  summary: Summary
  variant?: 'default' | 'compact' | 'detailed'
  showActions?: boolean
  onView?: (summary: Summary) => void
  onEdit?: (summary: Summary) => void
  onDelete?: (summaryId: string) => void
  onPlayVideo?: (videoId: string) => void
  className?: string
}

export function SummaryCard({
  summary,
  variant = 'default',
  showActions = true,
  onView,
  onEdit,
  onDelete,
  onPlayVideo,
  className,
}: SummaryCardProps) {
  const handlePlayVideo = () => {
    if (onPlayVideo) {
      onPlayVideo(summary.videoMetadata.videoId)
    } else {
      window.open(summary.videoMetadata.url, '_blank')
    }
  }

  const handleViewSummary = () => {
    onView?.(summary)
  }

  const handleEditSummary = () => {
    onEdit?.(summary)
  }

  const handleDeleteSummary = () => {
    onDelete?.(summary.id!)
  }

  if (variant === 'compact') {
    return (
      <CompactSummaryCard
        summary={summary}
        onView={handleViewSummary}
        onPlayVideo={handlePlayVideo}
        className={className}
      />
    )
  }

  if (variant === 'detailed') {
    return (
      <DetailedSummaryCard
        summary={summary}
        showActions={showActions}
        onView={handleViewSummary}
        onEdit={handleEditSummary}
        onDelete={handleDeleteSummary}
        onPlayVideo={handlePlayVideo}
        className={className}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            {/* Video Thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={summary.videoMetadata.thumbnailUrl || '/placeholder-video.jpg'}
                alt={summary.videoMetadata.title}
                className="w-20 h-12 rounded-md object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-video.jpg'
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute inset-0 w-full h-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handlePlayVideo}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary Info */}
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-knugget-600 transition-colors"
                onClick={handleViewSummary}
              >
                {summary.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.videoMetadata.channelName}
              </p>
              
              {/* Meta Info */}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatRelativeTime(summary.createdAt!)}
                </span>
                {summary.videoMetadata.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {summary.videoMetadata.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleViewSummary}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePlayVideo}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch Video
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEditSummary}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteSummary}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Key Points Preview */}
          {summary.keyPoints.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Key Points
              </p>
              <div className="space-y-1">
                {summary.keyPoints.slice(0, 2).map((point, index) => (
                  <p key={index} className="text-xs text-foreground">
                    • {truncateText(point, 80)}
                  </p>
                ))}
                {summary.keyPoints.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{summary.keyPoints.length - 2} more points
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {summary.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {summary.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {summary.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{summary.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Badge 
                variant={summary.status === 'COMPLETED' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {summary.status}
              </Badge>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewSummary}
              className="text-xs"
            >
              View Details
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Compact variant
function CompactSummaryCard({ 
  summary, 
  onView, 
  onPlayVideo, 
  className 
}: {
  summary: Summary
  onView?: () => void
  onPlayVideo?: () => void
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors", className)}>
      <img
        src={summary.videoMetadata.thumbnailUrl || '/placeholder-video.jpg'}
        alt={summary.videoMetadata.title}
        className="w-16 h-10 rounded object-cover flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1">{summary.title}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {summary.videoMetadata.channelName}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(summary.createdAt!)}
        </p>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={onPlayVideo} className="h-8 w-8">
          <Play className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onView} className="h-8 w-8">
          <Eye className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// Detailed variant
function DetailedSummaryCard({
  summary,
  showActions,
  onView,
  onEdit,
  onDelete,
  onPlayVideo,
  className,
}: {
  summary: Summary
  showActions: boolean
  onView?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onPlayVideo?: () => void
  className?: string
}) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{summary.title}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatRelativeTime(summary.createdAt!)}
              </span>
              <span>{summary.videoMetadata.channelName}</span>
              {summary.videoMetadata.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {summary.videoMetadata.duration}
                </span>
              )}
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPlayVideo}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Video
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Video Thumbnail */}
        <div className="relative mb-4">
          <img
            src={summary.videoMetadata.thumbnailUrl || '/placeholder-video.jpg'}
            alt={summary.videoMetadata.title}
            className="w-full h-48 rounded-lg object-cover"
          />
          <Button
            className="absolute inset-0 w-full h-full bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity"
            onClick={onPlayVideo}
          >
            <Play className="h-8 w-8" />
          </Button>
        </div>

        {/* Summary Preview */}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {truncateText(summary.fullSummary, 200)}
          </p>

          {/* Key Points */}
          {summary.keyPoints.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Key Points
              </h4>
              <ul className="space-y-1">
                {summary.keyPoints.slice(0, 3).map((point, index) => (
                  <li key={index} className="text-sm flex items-start gap-2">
                    <span className="text-knugget-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
                {summary.keyPoints.length > 3 && (
                  <li className="text-sm text-muted-foreground">
                    +{summary.keyPoints.length - 3} more points
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Tags */}
          {summary.tags.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {summary.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <Badge 
            variant={summary.status === 'COMPLETED' ? 'default' : 'secondary'}
          >
            {summary.status}
          </Badge>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPlayVideo}>
              <Play className="h-4 w-4 mr-2" />
              Watch
            </Button>
            <Button variant="default" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View Summary
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default SummaryCard