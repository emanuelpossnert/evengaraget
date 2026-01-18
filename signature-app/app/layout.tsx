import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EventGaraget - Digital Signering',
  description: 'Signera din bokning digitalt',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}

