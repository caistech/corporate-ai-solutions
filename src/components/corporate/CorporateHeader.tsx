import React from 'react';

interface CorporateHeaderProps {
  productName: string;
  productAcronym?: string;
  navItems?: { href: string; label: string }[];
  activePath?: string;
  rightContent?: React.ReactNode;
  theme?: 'light' | 'dark';
  LinkComponent?: React.ElementType;
}

export function CorporateHeader({ productName, productAcronym, navItems = [], activePath, rightContent, theme = 'light', LinkComponent = 'a' }: CorporateHeaderProps) {
  const isDark = theme === 'dark';
  const acronym = productAcronym || productName.slice(0, 2).toUpperCase();
  const Link = LinkComponent;
  return (
    <header className={`border-b sticky top-0 z-50 ${isDark ? 'border-slate-800 bg-slate-950/80 backdrop-blur-xl' : 'border-slate-200 bg-white/80 backdrop-blur-xl'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group no-underline">
            <div className="w-8 h-8 bg-[#22c55e] rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:bg-[#4ade80] transition-colors">{acronym}</div>
            <div className="flex items-center">
              <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{productName}</span>
              <span className={`text-xs ml-2 hidden sm:inline ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>by Corporate AI Solutions</span>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            {navItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 no-underline ${activePath === item.href ? (isDark ? 'text-white bg-slate-800' : 'text-slate-900 bg-slate-100') : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')}`}>{item.label}</Link>
                ))}
              </nav>
            )}
            {rightContent && <div className="flex items-center gap-3">{rightContent}</div>}
            {/* Mobile nav: native <details> hamburger → drawer (no JS, stays a server
                component). Replaces the old overflow-x-auto strip that hid items
                off-screen and used sub-44px tap targets. */}
            {navItems.length > 0 && (
              <details className="md:hidden relative">
                <summary
                  aria-label="Toggle navigation menu"
                  className={`list-none marker:hidden [&::-webkit-details-marker]:hidden flex items-center justify-center w-11 h-11 rounded-lg cursor-pointer transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </summary>
                <nav className={`absolute right-0 mt-2 w-56 flex flex-col gap-1 p-2 rounded-xl border shadow-xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href} className={`block w-full px-4 py-3 rounded-lg text-base no-underline transition-colors ${activePath === item.href ? (isDark ? 'text-white bg-slate-800' : 'text-slate-900 bg-slate-100') : (isDark ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')}`}>{item.label}</Link>
                  ))}
                </nav>
              </details>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
