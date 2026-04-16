import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { AppNav } from '@/components/AppNav'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Orchard Tool',
  description: 'Track and manage your orchard trees',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Orchard" />
        <meta name="theme-color" content="#1c1917" />
      </head>
      <body className="font-sans antialiased bg-stone-50 min-h-screen">
        <AppNav />
        <main className="max-w-5xl mx-auto px-4 py-6 pb-20 sm:pb-6">{children}</main>
        <Toaster richColors />
      </body>
    </html>
  )
}
