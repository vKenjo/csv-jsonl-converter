import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CSV to JSON Lines Converter',
  description: 'Convert CSV files to JSON Lines format with ease',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
