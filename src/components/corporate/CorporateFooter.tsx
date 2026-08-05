import React from 'react';

interface CorporateFooterProps {
  productName?: string;
  extraLinks?: { href: string; label: string; external?: boolean }[];
  theme?: 'light' | 'dark';
}

// Vendor identity reads from NEXT_PUBLIC_VENDOR_* env vars (Portfolio
// Standard R11). Each link renders only if its env var is populated, so the
// default state is vendor-neutral. Operators set these per-deployment.
const VENDOR = {
  calendly: process.env.NEXT_PUBLIC_VENDOR_CALENDLY ?? '',
  phone: process.env.NEXT_PUBLIC_VENDOR_PHONE ?? '',
  email: process.env.NEXT_PUBLIC_VENDOR_EMAIL ?? '',
};

export function CorporateFooter({ productName, extraLinks = [], theme = 'light' }: CorporateFooterProps) {
  const isDark = theme === 'dark';
  const hasVendor = VENDOR.calendly || VENDOR.phone || VENDOR.email;
  return (
    <footer className={`border-t py-8 mt-auto ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#22c55e] rounded flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span>
                {productName ? (
                  <>
                    {productName} — Built by{' '}
                    <span className={isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'}>Corporate AI Solutions</span>
                  </>
                ) : (
                  <>
                    Built by{' '}
                    <span className={isDark ? 'text-white font-medium' : 'text-slate-900 font-medium'}>Corporate AI Solutions</span>
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <a href="https://corporate-ai-solutions.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">corporate-ai-solutions.vercel.app</a>
              {VENDOR.calendly && (
                <>
                  <span className="hidden sm:inline opacity-30">|</span>
                  <a href={VENDOR.calendly} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">Book a Call</a>
                </>
              )}
              {VENDOR.phone && (
                <>
                  <span className="hidden sm:inline opacity-30">|</span>
                  <a href={`tel:${VENDOR.phone.replace(/\s+/g, '')}`} className="hover:text-slate-900 transition-colors">{VENDOR.phone}</a>
                </>
              )}
              {VENDOR.email && (
                <>
                  <span className="hidden sm:inline opacity-30">|</span>
                  <a href={`mailto:${VENDOR.email}`} className="hover:text-slate-900 transition-colors">{VENDOR.email}</a>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs opacity-70">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>&copy; {new Date().getFullYear()} Corporate AI Solutions. All rights reserved.</span>
              <span className="opacity-40">·</span>
              {/* Cockpit front door (§8.5 dual-auth): distinct User vs Operator sign-in, kept discreet
                  in the footer rather than advertised on the public marketing hero. */}
              <a href="/pipeline/login" className="min-h-[44px] inline-flex items-center hover:text-slate-900 transition-colors">User sign-in</a>
              <a href="/admin/login" className="min-h-[44px] inline-flex items-center hover:text-slate-900 transition-colors">Operator sign-in</a>
              <span className="opacity-40">·</span>
              {/* Privacy and Terms were 404 on every route while this site collected names, emails,
                  phone numbers and business descriptions through the contact form, and ran a voice
                  agent on every page. /services also claims "privacy surfaces. Built in, not bolted
                  on", which made the absence worse than neutral. REGULATORY_INCLUSIONS.md I1/I2. */}
              <a href="/privacy" className="min-h-[44px] inline-flex items-center hover:text-slate-900 transition-colors">Privacy</a>
              <a href="/terms" className="min-h-[44px] inline-flex items-center hover:text-slate-900 transition-colors">Terms</a>
            </div>

            {/* The legal entity, on EVERY page rather than only the two that hand-rolled it.
                /clients, /marketplace and /about named no entity at all. */}
            <div className="text-center sm:text-right">
              Global Buildtech Australia Pty Ltd &middot; ABN 54&nbsp;672&nbsp;395&nbsp;685 &middot;
              Brisbane, Queensland
            </div>
            {extraLinks.length > 0 && (
              <div className="flex gap-4">
                {extraLinks.map((link) => link.external ? (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 transition-colors">{link.label}</a>
                ) : (
                  <a key={link.href} href={link.href} className="hover:text-slate-900 transition-colors">{link.label}</a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
