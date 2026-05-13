'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/pipeline/supabase-client'

const LINKS = [
  { href: '/pipeline/today', label: 'Today' },
  { href: '/pipeline/contacts', label: 'Contacts' },
  { href: '/pipeline/contacts/new', label: '+ New' },
]

export function PipelineNav() {
  const pathname = usePathname()
  const router = useRouter()

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/pipeline/login')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/pipeline/today"
            className="font-bold text-[#0B1F3A] text-base tracking-tight"
          >
            Pipeline
          </Link>
          <span className="hidden md:inline text-xs tracking-[2px] font-bold">
            <span className="text-[#FF6B35]">IDENTIFY</span>
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-[#F7B500]">SOLVE</span>
            <span className="text-gray-300 mx-2">·</span>
            <span className="text-[#0B7A5C]">SHIP</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== '/pipeline/contacts/new' && pathname.startsWith(l.href))
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-2 text-sm rounded transition-colors ${
                  active
                    ? 'text-[#1E5AA8] font-semibold'
                    : 'text-[#5C6B7A] hover:text-[#1A2332]'
                }`}
              >
                {l.label}
              </Link>
            )
          })}
          <button
            onClick={signOut}
            className="ml-2 px-3 py-2 text-sm text-[#5C6B7A] hover:text-[#1A2332]"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
