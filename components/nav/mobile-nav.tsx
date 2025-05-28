'use client'

import React from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Settings,
  User,
  Sparkles,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Summaries',
      href: '/summaries',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Generate',
      href: '/generate',
      icon: <Sparkles className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <User className="h-5 w-5" />,
    },
  ]

  if (!isAuthenticated) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Navigation Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-80 border-l bg-background p-6 shadow-lg md:hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Navigation</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="mt-6">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-knugget-100 text-knugget-900"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
