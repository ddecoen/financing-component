import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ASC 606 Analyzer',
  description: 'Analyze contracts for significant financing components',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
