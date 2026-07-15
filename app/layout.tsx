
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ClientHeader } from '@/components/client-header'
import { Toaster } from 'sonner'

export const dynamic = "force-dynamic"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Seva Auctions - Bid for a Cause',
  description: 'Bid on exclusive experiences and items across travel, sports, entertainment, dining, technology and more. Every auction supports a cause.',
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Seva Auctions - Bid for a Cause',
    description: 'Bid on exclusive experiences and items across travel, sports, entertainment, dining, technology and more. Every auction supports a cause.',
    url: '/',
    siteName: 'Seva Auctions',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Seva Auctions - Bid for a Cause',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seva Auctions - Bid for a Cause',
    description: 'Bid on exclusive experiences and items across travel, sports, entertainment, dining, technology and more. Every auction supports a cause.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <ClientHeader />
            <main className="flex-1">
              {children}
            </main>
          </div>
          <Toaster 
            position="top-right"
            richColors
            closeButton
            className="seva-toast"
          />
        </Providers>
      </body>
    </html>
  )
}
