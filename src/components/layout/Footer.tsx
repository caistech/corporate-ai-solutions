'use client'

import Link from 'next/link'
import { Linkedin, Calendar, Youtube, Newspaper } from 'lucide-react'
import { SITE, SKOOL, FOUNDER } from '@/lib/constants'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black border-t border-gray-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h4 className="font-mono text-xs text-accent uppercase tracking-wider mb-4">Platforms</h4>
            <ul className="space-y-3">
              <li><Link href="/marketplace" className="text-sm text-gray-light hover:text-accent transition-colors">Marketplace</Link></li>
              <li><a href="https://rehearsals-ai.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors">Rehearsals AI</a></li>
              <li><a href="https://connexions-silk.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors">Connexions</a></li>
              <li><a href="https://deal-findrs.vercel.app" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors">DealFindrs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-accent uppercase tracking-wider mb-4">Studio</h4>
            <ul className="space-y-3">
              <li><Link href="/studio/thesis" className="text-sm text-gray-light hover:text-accent transition-colors">Our Thesis</Link></li>
              <li><Link href="/studio/portfolio" className="text-sm text-gray-light hover:text-accent transition-colors">Portfolio</Link></li>
              <li><Link href="/engagement" className="text-sm text-gray-light hover:text-accent transition-colors">Engagement</Link></li>
              <li><Link href="/studio/join" className="text-sm text-gray-light hover:text-accent transition-colors">Join Team</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-accent uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-gray-light hover:text-accent transition-colors">About Dennis</Link></li>
              <li><a href={SKOOL.url} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors">Community</a></li>
              <li><Link href="/studio/partner" className="text-sm text-gray-light hover:text-accent transition-colors">Studio Partnerships</Link></li>
              <li><Link href="/pricing" className="text-sm text-gray-light hover:text-accent transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs text-accent uppercase tracking-wider mb-4">Connect</h4>
            <ul className="space-y-3">
              <li>
                <a href={FOUNDER.calendly} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors inline-flex items-center gap-2">
                  <Calendar size={14} /> Book a Call
                </a>
              </li>
              <li>
                <a href={FOUNDER.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors inline-flex items-center gap-2">
                  <Linkedin size={14} /> LinkedIn
                </a>
              </li>
              <li>
                <a href={FOUNDER.youtube} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-light hover:text-accent transition-colors inline-flex items-center gap-2">
                  <Youtube size={14} /> YouTube
                </a>
              </li>
              <li><a href={`mailto:${SITE.email}`} className="text-sm text-gray-light hover:text-accent transition-colors">Email Us</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletters */}
        <div className="py-6 border-t border-b border-gray-border mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-light">
              <Newspaper size={16} className="text-accent" />
              <span>Newsletters:</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <a 
                href={FOUNDER.newsletters.goOffsite.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-accent hover:text-white transition-colors"
              >
                Go Offsite →
              </a>
              <a 
                href={FOUNDER.newsletters.biAiAdvantage.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-purple hover:text-white transition-colors"
              >
                BI AI Advantage →
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-medium text-white">{SITE.name}</p>
            <p className="text-xs text-gray-light mt-1">{SITE.company} | ABN {SITE.abn} | {SITE.location}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href={FOUNDER.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-light hover:text-accent transition-colors">
              <Linkedin size={20} />
            </a>
            <a href={FOUNDER.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-light hover:text-[#FF0000] transition-colors">
              <Youtube size={20} />
            </a>
            <p className="text-xs text-gray-light">© {currentYear} {SITE.name}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
