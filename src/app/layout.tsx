import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpanishKids — Learn Spanish the Fun Way',
  description: 'A parent-controlled Spanish learning app for children with interactive lessons, audio, and games.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
