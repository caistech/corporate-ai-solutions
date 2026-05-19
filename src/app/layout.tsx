import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { CorporateHeader } from '@/components/corporate/CorporateHeader'
import { CorporateFooter } from '@/components/corporate/CorporateFooter'
import { VoiceAgent } from '@/components/voice/VoiceAgent'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

const navItems = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/engagement', label: 'Engagement' },
  { href: '/studio', label: 'Studio' },
  { href: '/community', label: 'Community' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

export const metadata: Metadata = {
  title: {
    default: 'Corporate AI Solutions | The Factory That Builds AI Companies',
    template: '%s | Corporate AI Solutions',
  },
  description: '35+ live AI platforms built by one founder. The studio is the product. The portfolio is the moat.',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://corporateaisolutions.com',
    siteName: 'Corporate AI Solutions',
    title: 'Corporate AI Solutions | The Factory That Builds AI Companies',
    description: '35+ live AI platforms. One founder. Zero employees. The unicorn isn\'t the product — it\'s the factory.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <CorporateHeader
          productName="Corporate AI Solutions"
          productAcronym="CA"
          navItems={navItems}
          theme="dark"
          LinkComponent={Link}
        />
        <main className="flex-grow">{children}</main>
        <CorporateFooter
          productName="Corporate AI Solutions"
          theme="dark"
        />
        <VoiceAgent />
      </body>
    </html>
  )
}
