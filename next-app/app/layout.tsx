import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import CursorSpotlight from '@/components/CursorSpotlight'
import ScrollProgress from '@/components/ScrollProgress'
import SmoothScroll from '@/components/SmoothScroll'
import Providers from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'McPherson University | Campus Portal',
  description: 'One university. One academic day. Verified attendance, courses and student life in one calibrated portal.',
  applicationName: 'McPherson University Portal',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <CursorSpotlight />
          <ScrollProgress />
          <SmoothScroll />
          {children}
        </Providers>
      </body>
    </html>
  )
}
