'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Workflow, Settings, LayoutGrid, Star, CreditCard, LayoutDashboard } from 'lucide-react'
import { AdminSignOut } from './AdminSignOut'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/pipeline', label: 'Products', icon: LayoutGrid },
  { href: '/admin/methodology', label: 'Methodology', icon: Workflow },
  { href: '/admin/ops', label: 'Cost', icon: CreditCard },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
] as const

const FOOTER_ITEMS = [{ href: '/admin/settings', label: 'Settings', icon: Settings }] as const

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const linkClass = (href: string) =>
    `flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive(pathname, href)
        ? 'bg-gray-mid text-white'
        : 'text-gray-light hover:bg-gray-mid hover:text-white'
    }`

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate} className={linkClass(href)}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-gray-border pt-3">
        {FOOTER_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} onClick={onNavigate} className={linkClass(href)}>
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        ))}
        <AdminSignOut variant="nav" />
      </div>
    </>
  )
}

function Brand() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 px-3 py-1 no-underline"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-black">
        PA
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-white">Pipeline</span>
        <span className="text-xs text-gray-light">Admin</span>
      </span>
    </Link>
  )
}

// Public admin routes (login / password reset) sit under /admin/* so the layout wraps them, but
// they must NOT show the authed chrome (sidebar + Sign Out) — that leaked the signed-in nav onto
// the unauthenticated login page. Render nothing on those routes.
const PUBLIC_ADMIN_ROUTES = ['/admin/login', '/admin/password-reset', '/admin/pipeline/password-reset']

export function AdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  if (PUBLIC_ADMIN_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return null
  }

  return (
    <>
      {/* Desktop persistent rail */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-4 border-r border-gray-border bg-gray-dark p-4 md:flex">
        <Brand />
        <div className="flex flex-1 flex-col">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {/* Mobile top bar with hamburger (thumb-reachable, top-left within reach) */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-border bg-gray-dark px-4 py-2 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-light hover:bg-gray-mid hover:text-white"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-4 border-r border-gray-border bg-gray-dark p-4">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-light hover:bg-gray-mid hover:text-white"
              >
                <X className="h-6 w-6" aria-hidden />
              </button>
            </div>
            <div className="flex flex-1 flex-col">
              <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
