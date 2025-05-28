'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  FileText, 
  Settings, 
  User,
  Sparkles,
  HelpCircle,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string
  disabled?: boolean
}

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuth()

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: 'Summaries',
      href: '/summaries',
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: 'Generate',
      href: '/generate',
      icon: <Sparkles className="h-4 w-4" />,
      badge: user?.plan === 'FREE' ? `${user.credits}` : undefined,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <User className="h-4 w-4" />,
    },
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <nav className={cn("flex items-center space-x-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        
        return (
          <Link key={item.href} href={item.href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "relative",
                isActive && "bg-knugget-100 text-knugget-900 hover:bg-knugget-200"
              )}
              disabled={item.disabled}
            >
              {item.icon}
              <span className="ml-2">{item.title}</span>
              {item.badge && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 min-w-[20px] text-xs"
                >
                  {item.badge}
                </Badge>
              )}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-knugget-500 rounded-md -z-10"
                  layoutId="activeTab"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }}
                />
              )}
            </Button>
          </Link>
        )
      })}
    </nav>
  )
}