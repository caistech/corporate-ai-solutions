import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { CorporateHeader } from '@/components/corporate/CorporateHeader'
import { CorporateFooter } from '@/components/corporate/CorporateFooter'
import { VoiceAgent } from '@/components/voice/VoiceAgent'
import { SiteChrome } from '@/components/layout/SiteChrome'
import { SayFixWidget } from "@caistech/sayfix-embed";
import { NAV_ITEMS, FOOTER_LINKS } from '@/lib/constants'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: {
    default: 'Corporate AI Solutions | The Factory That Builds AI Companies',
    template: '%s | Corporate AI Solutions',
  },
  description: '35+ live AI platforms built by one founder. The studio is the product. The portfolio is the moat.',
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://corporate-ai-solutions.vercel.app',
    siteName: 'Corporate AI Solutions',
    title: 'Corporate AI Solutions | The Factory That Builds AI Companies',
    description: '35+ live AI platforms. One founder. Zero employees. The unicorn isn\'t the product — it\'s the factory.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SiteChrome>
          <CorporateHeader
            productName="Corporate AI Solutions"
            productAcronym="CA"
            navItems={NAV_ITEMS}
            theme="dark"
            LinkComponent={Link}
          />
        </SiteChrome>
        <main className="flex-grow">{children}</main>
        <SayFixWidget repo="corporate-ai-solutions" />
        <SiteChrome>
          <CorporateFooter
            productName="Corporate AI Solutions"
            theme="dark"
            extraLinks={FOOTER_LINKS}
          />
          <VoiceAgent />
        </SiteChrome>
      </body>
    </html>
  )
}
