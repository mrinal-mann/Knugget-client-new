// lib/extension.ts - Chrome Extension communication bridge

import { ExtensionMessage, ExtensionAuthData, ExtensionStatus, User } from '@/types'
import { authService } from './auth'

export class ExtensionBridge {
  private listeners: Map<string, Function[]> = new Map()
  private extensionId: string | null = null
  private isReady = false

  constructor() {
    this.setupMessageListener()
    this.detectExtension()
  }

  // Check if extension is installed and active
  async detectExtension(): Promise<ExtensionStatus> {
    try {
      // Try to communicate with extension
      const response = await this.sendMessage('PING', {}, 1000)
      
      if (response) {
        this.isReady = true
        return {
          isInstalled: true,
          isActive: true,
          version: response.version,
        }
      }
    } catch (error) {
      console.log('Extension not detected:', error)
    }

    return {
      isInstalled: false,
      isActive: false,
    }
  }

  // Send message to extension
  async sendMessage(type: string, data: any = {}, timeout: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId()
      const timeoutId = setTimeout(() => {
        reject(new Error('Extension communication timeout'))
      }, timeout)

      // Listen for response
      const handleResponse = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return
        
        if (event.data.type === `${type}_RESPONSE` && event.data.messageId === messageId) {
          clearTimeout(timeoutId)
          window.removeEventListener('message', handleResponse)
          resolve(event.data.payload)
        }
      }

      window.addEventListener('message', handleResponse)

      // Send message
      window.postMessage({
        type,
        payload: data,
        messageId,
        source: 'knugget-web',
        timestamp: Date.now(),
      }, window.location.origin)
    })
  }

  // Listen for messages from extension
  private setupMessageListener() {
    if (typeof window === 'undefined') return

    window.addEventListener('message', (event) => {
      if (event.origin !== window.location.origin) return
      
      const { type, payload, source } = event.data
      
      if (source === 'knugget-extension') {
        this.handleExtensionMessage(type, payload)
      }
    })
  }

  // Handle messages from extension
  private handleExtensionMessage(type: string, payload: any) {
    console.log('Extension message received:', type, payload)

    switch (type) {
      case 'EXTENSION_READY':
        this.isReady = true
        this.extensionId = payload.extensionId
        this.emit('ready', payload)
        break

      case 'AUTH_STATUS_REQUEST':
        this.handleAuthStatusRequest()
        break

      case 'SUMMARY_GENERATED':
        this.emit('summaryGenerated', payload)
        break

      case 'VIDEO_CHANGED':
        this.emit('videoChanged', payload)
        break

      case 'EXTENSION_ERROR':
        this.emit('error', payload)
        break

      default:
        this.emit(type, payload)
    }
  }

  // Handle auth status request from extension
  private async handleAuthStatusRequest() {
    try {
      const authState = await authService.getCurrentAuthState()
      
      this.sendMessage('AUTH_STATUS_RESPONSE', {
        isAuthenticated: authState.isAuthenticated,
        user: authState.user,
        accessToken: authState.accessToken,
        refreshToken: authState.refreshToken,
      })
    } catch (error) {
      console.error('Failed to send auth status to extension:', error)
    }
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event)
      if (callbacks) {
        const index = callbacks.indexOf(callback)
        if (index > -1) {
          callbacks.splice(index, 1)
        }
      }
    }
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event)
      return
    }

    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Extension event callback error:', error)
        }
      })
    }
  }

  // Public API methods
  async syncAuth(authData: ExtensionAuthData): Promise<void> {
    try {
      await this.sendMessage('SYNC_AUTH', authData)
    } catch (error) {
      console.error('Failed to sync auth with extension:', error)
    }
  }

  async requestSummary(videoId: string): Promise<any> {
    try {
      return await this.sendMessage('REQUEST_SUMMARY', { videoId })
    } catch (error) {
      console.error('Failed to request summary from extension:', error)
      throw error
    }
  }

  async openYouTubeVideo(videoId: string): Promise<void> {
    try {
      await this.sendMessage('OPEN_VIDEO', { videoId })
    } catch (error) {
      console.error('Failed to open video in extension:', error)
    }
  }

  async getExtensionSettings(): Promise<any> {
    try {
      return await this.sendMessage('GET_SETTINGS')
    } catch (error) {
      console.error('Failed to get extension settings:', error)
      return null
    }
  }

  async updateExtensionSettings(settings: any): Promise<void> {
    try {
      await this.sendMessage('UPDATE_SETTINGS', settings)
    } catch (error) {
      console.error('Failed to update extension settings:', error)
    }
  }

  // Install extension helper
  getInstallUrl(): string {
    // Return Chrome Web Store URL for your extension
    return 'https://chrome.google.com/webstore/detail/knugget-ai/YOUR_EXTENSION_ID'
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Check if extension is ready
  isExtensionReady(): boolean {
    return this.isReady
  }

  // Get extension ID
  getExtensionId(): string | null {
    return this.extensionId
  }
}

// Create singleton instance
export const extensionBridge = new ExtensionBridge()

// React hook for extension integration
export function useExtension() {
  const [status, setStatus] = React.useState<ExtensionStatus>({
    isInstalled: false,
    isActive: false,
  })
  const [isReady, setIsReady] = React.useState(false)

  React.useEffect(() => {
    // Check extension status
    extensionBridge.detectExtension().then(setStatus)

    // Listen for extension ready event
    const unsubscribe = extensionBridge.on('ready', () => {
      setIsReady(true)
      setStatus(prev => ({ ...prev, isActive: true }))
    })

    return unsubscribe
  }, [])

  const syncAuth = React.useCallback(async (authData: ExtensionAuthData) => {
    await extensionBridge.syncAuth(authData)
  }, [])

  const requestSummary = React.useCallback(async (videoId: string) => {
    return await extensionBridge.requestSummary(videoId)
  }, [])

  const openVideo = React.useCallback(async (videoId: string) => {
    await extensionBridge.openYouTubeVideo(videoId)
  }, [])

  return {
    status,
    isReady,
    syncAuth,
    requestSummary,
    openVideo,
    installUrl: extensionBridge.getInstallUrl(),
  }
}

// Extension status checker component helper
export function useExtensionStatus() {
  const [status, setStatus] = React.useState<ExtensionStatus>({
    isInstalled: false,
    isActive: false,
  })

  React.useEffect(() => {
    let mounted = true

    const checkStatus = async () => {
      const newStatus = await extensionBridge.detectExtension()
      if (mounted) {
        setStatus(newStatus)
      }
    }

    checkStatus()

    // Recheck every 30 seconds
    const interval = setInterval(checkStatus, 30000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return status
}

// Utility functions
export function isExtensionInstalled(): Promise<boolean> {
  return extensionBridge.detectExtension().then(status => status.isInstalled)
}

export function waitForExtension(timeout: number = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (extensionBridge.isExtensionReady()) {
      resolve(true)
      return
    }

    const timeoutId = setTimeout(() => {
      resolve(false)
    }, timeout)

    const unsubscribe = extensionBridge.on('ready', () => {
      clearTimeout(timeoutId)
      unsubscribe()
      resolve(true)
    })
  })
}

export default extensionBridge

// Import React for hooks (this would normally be imported at the top)
import React from 'react'