'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Chrome, Download, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useExtension } from '@/lib/extension'

export function ExtensionStatus() {
  const { status, installUrl } = useExtension()

  if (status.isInstalled && status.isActive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center"
            >
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Extension Active
              </Badge>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chrome extension is installed and working</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(installUrl, '_blank')}
            className="hidden sm:flex"
          >
            <Chrome className="h-4 w-4 mr-2" />
            Install Extension
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Install our Chrome extension for seamless YouTube integration</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}