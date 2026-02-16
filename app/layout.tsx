import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import './globals.css'

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'To The Horizon - Turn-Based Strategy',
  description: 'A turn-based strategy game pitting the Beastfolk Tribe against the Demon Clan. Build, train, and conquer!',
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${mono.variable} antialiased`}>{children}</body>
    </html>
  )
}
