'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/pipeline/supabase-client'

interface Props {
  /** 'global' revokes every session (sign out everywhere); default signs out this session only. */
  scope?: 'local' | 'global'
  /** Visual style: 'nav' for the sidebar row, 'button' for the settings-page action. */
  variant?: 'nav' | 'button'
  label?: string
}

export function AdminSignOut({ scope = 'local', variant = 'nav', label = 'Sign Out' }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const signOut = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut(scope === 'global' ? { scope: 'global' } : undefined)
      router.push('/pipeline/login')
      router.refresh()
    })
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-border bg-black/20 px-4 py-2 text-sm text-gray-light transition-colors hover:border-accent hover:text-white disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {pending ? 'Signing out…' : label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-light transition-colors hover:bg-gray-mid hover:text-white disabled:opacity-50"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden />
      {pending ? 'Signing out…' : label}
    </button>
  )
}
