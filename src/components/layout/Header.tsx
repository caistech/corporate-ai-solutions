'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  const navItems = [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Pricing', href: '/pricing' },
    {
      label: 'Studio',
      href: '/studio',
      children: [
        { label: 'Our Thesis', href: '/studio/thesis' },
        { label: 'Portfolio', href: '/studio/portfolio' },
        { label: 'Partnerships', href: '/studio/partner' },
        { label: 'Invest', href: '/studio/invest' },
        { label: 'Join Team', href: '/studio/join' },
      ],
    },
    { label: 'Community', href: '/community' },
    { label: 'About', href: '/about' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gray-border">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-mono font-bold text-accent text-sm tracking-tight">
          LONG TAIL AI STUDIO
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <li key={item.label} className="relative">
              {item.children ? (
                <div
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button className="flex items-center gap-1 text-gray-light hover:text-accent transition-colors text-sm font-medium">
                    {item.label}
                    <ChevronDown size={14} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-2">
                      <div className="bg-gray-dark border border-gray-border py-2 min-w-[180px]">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-2 text-sm text-gray-light hover:text-accent hover:bg-gray-mid transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    pathname === item.href ? 'text-accent' : 'text-gray-light hover:text-accent'
                  }`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        <div className="hidden lg:block">
          <Button href="/contact" size="sm">Talk to Us →</Button>
        </div>

        <button
          className="lg:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-gray-dark border-t border-gray-border">
          <div className="px-6 py-4 space-y-4">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <div className="space-y-2">
                    <span className="text-gray-light text-sm font-medium">{item.label}</span>
                    <div className="pl-4 space-y-2">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block text-sm text-gray-light hover:text-accent"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="block text-sm text-gray-light hover:text-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-4">
              <Button href="/contact" fullWidth>Talk to Us →</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
