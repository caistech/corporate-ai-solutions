'use client'

import { usePathname } from 'next/navigation'

// The public marketing chrome (header / footer / marketing voice agent) is noise on the
// operator-only /admin surface — it stacks a second nav above the cockpit's own AdminNav and
// pushes the tool down. This wrapper hides whatever it wraps on /admin routes, which carry
// their own chrome (AdminNav + the in-context CockpitClarifier). Naive-tester finding,
// 2026-05-27 (Anneke: "two navs stacked… I'd drop the marketing chrome entirely behind /admin").
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null
  return <>{children}</>
}

export default SiteChrome
