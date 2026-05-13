import type { Metadata } from 'next'
import { PLATFORMS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Investor Deck | Long Tail AI Venture Studio',
  description: `The factory that builds AI companies at near-zero marginal cost. ${PLATFORMS.length} platforms. One founder. $2B+ at scale.`,
}

export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {children}
    </div>
  )
}
