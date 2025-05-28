import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { QueryProvider } from '@/components/query-provider'
import { AuthProvider } from '@/components/auth-provider'
import { Toaster } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Knugget AI - YouTube Video Summarization',
  description: 'AI-powered YouTube video summarization with intelligent insights',
  keywords: ['AI', 'YouTube', 'summarization', 'video', 'transcription', 'insights'],
  authors: [{ name: 'Knugget AI' }],
  creator: 'Knugget AI',
  publisher: 'Knugget AI',
  robots: 'index, follow',
  openGraph: {
    title: 'Knugget AI - YouTube Video Summarization',
    description: 'AI-powered YouTube video summarization with intelligent insights',
    url: 'https://knugget.com',
    siteName: 'Knugget AI',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Knugget AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Knugget AI - YouTube Video Summarization',
    description: 'AI-powered YouTube video summarization with intelligent insights',
    creator: '@knuggetai',
    images: ['/og-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: '#ff6b35',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, 'min-h-screen antialiased')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <div className="relative flex min-h-screen flex-col">
                <main className="flex-1">{children}</main>
              </div>
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                  success: {
                    iconTheme: {
                      primary: 'hsl(var(--primary))',
                      secondary: 'hsl(var(--primary-foreground))',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'hsl(var(--destructive))',
                      secondary: 'hsl(var(--destructive-foreground))',
                    },
                  },
                }}
              />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}