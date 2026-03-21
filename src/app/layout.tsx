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
  { href: '/partner', label: 'Partner' },
  { href: '/studio', label: 'Studio' },
  { href: '/community', label: 'Community' },
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

export const metadata: Metadata = {
  title: {
    default: 'Corporate AI Solutions | Build to $1M ARR. Auction for 6-10x. Repeat.',
    template: '%s | Corporate AI Solutions',
  },
  description: 'We turn problems into platforms. 17 platforms built. Subscribe to existing solutions or partner to build yours.',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://corporateaisolutions.com',
    siteName: 'Corporate AI Solutions',
    title: 'Corporate AI Solutions | Venture Farming, Not Venture Capital',
    description: 'Build cheap. Grow to $1M ARR. Auction for 6-10x. Repeat.',
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
