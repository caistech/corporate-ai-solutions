// @explanatory-header-exempt — hand-built dark-theme hero answers what/what-to-do/why for the categorized marketplace lens
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Mic, Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLATFORMS, getParentPlatforms, SITE } from '@/lib/constants'
import { Platform } from '@/types'

const DESCRIPTION =
  'Browse the BYOK-first portfolio by category — BYOK-free releases, voice coaching, business tools, generators, and core infrastructure.'

export const metadata: Metadata = {
  title: 'Solutions',
  description: DESCRIPTION,
  openGraph: { title: 'Solutions | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Solutions | ' + SITE.name, description: DESCRIPTION },
}

export default function SolutionsPage() {
  const parentPlatforms = getParentPlatforms().filter(p => !p.marketplaceHidden)

  const byokFree = parentPlatforms.filter(p => p.releaseMode === 'byok-free')
  const voiceCoaching = parentPlatforms.filter(p => p.category === 'voice-coaching')
  const businessTools = parentPlatforms.filter(p => p.category === 'business-tools' && p.releaseMode !== 'byok-free')
  const generators = parentPlatforms.filter(p => p.category === 'generators')
  const infrastructure = parentPlatforms.filter(p => p.category === 'infrastructure')

  return (
    <>
      {/* Hero — explanatory header */}
      <section className="section bg-grid pt-20 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4">Solutions</div>
          <h1 className="mb-6">The portfolio, organized by what it solves</h1>
          <p className="text-lg text-gray-light mb-3">
            <strong className="text-white">What this is:</strong> a categorical view of the same {parentPlatforms.length} BYOK-first
            products you can browse on the marketplace. Use this lens when you know the
            problem shape; use the marketplace when you know the product name.
          </p>
          <p className="text-lg text-gray-light mb-3">
            <strong className="text-white">What you do here:</strong> jump into the category that matches your problem
            (BYOK-free releases / voice coaching / business tools / generators / core infrastructure)
            and clone a product to your own keys.
          </p>
          <p className="text-lg text-gray-light">
            <strong className="text-white">Why it matters:</strong> different operators arrive with different shapes of problem.
            One lens is the product catalog, another is the problem catalog. Both lead to the same
            BYOK-first deploy.
          </p>
        </div>
      </section>

      {/* BYOK-Free Releases — surfaced distinctly */}
      <section id="byok-free" className="section py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Rocket className="text-orange" size={28} />
            <h2 className="text-3xl font-bold">BYOK-Free Releases</h2>
          </div>
          <p className="text-gray-light mb-8">
            Public template repos with one-click Vercel Deploy. Bring your own keys; run on your own infrastructure.
          </p>
          {byokFree.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {byokFree.map((platform) => (
                <CategoryCard key={platform.id} platform={platform} accent="orange" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-light italic">No BYOK-free releases live yet. First public ship lands with CQR.</p>
          )}
        </div>
      </section>

      {/* Generators */}
      {generators.length > 0 && (
        <section id="generators" className="section bg-gray-dark py-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="text-purple" size={28} />
              <h2 className="text-3xl font-bold">Generators</h2>
            </div>
            <p className="text-gray-light mb-8">
              Platforms that spin up customized white-label versions for a vertical in days, not months.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {generators.map((platform) => (
                <CategoryCard key={platform.id} platform={platform} accent="purple" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Voice Coaching */}
      {voiceCoaching.length > 0 && (
        <section id="voice-coaching" className="section py-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Mic className="text-accent" size={28} />
              <h2 className="text-3xl font-bold">Voice Coaching</h2>
            </div>
            <p className="text-gray-light mb-8">
              AI voice agents for high-stakes conversation practice and live language assistance.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {voiceCoaching.map((platform) => (
                <CategoryCard key={platform.id} platform={platform} accent="accent" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Business Tools */}
      {businessTools.length > 0 && (
        <section id="business-tools" className="section bg-gray-dark py-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-3">Business Tools</h2>
            <p className="text-gray-light mb-8">
              Vertical platforms solving specific business problems &mdash; outreach, deal flow, tokenisation, compliance, and more.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {businessTools.map((platform) => (
                <CategoryCard key={platform.id} platform={platform} accent="accent" compact />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Core Infrastructure */}
      {infrastructure.length > 0 && (
        <section id="infrastructure" className="section py-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-accent" size={28} />
              <h2 className="text-3xl font-bold">Core Infrastructure</h2>
            </div>
            <p className="text-gray-light mb-8">
              Shared trust, security, and observability layers consumed across the portfolio via{' '}
              <code>@caistech/*</code> packages.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {infrastructure.map((platform) => (
                <CategoryCard key={platform.id} platform={platform} accent="accent" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section bg-gradient-to-b from-gray-dark to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Want the full product grid?</h2>
          <p className="text-gray-light mb-8">
            The marketplace shows every product side-by-side with badges, status, and deploy CTAs.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button href="/marketplace">Browse the Marketplace</Button>
            <Button href="/engagement" variant="orange">Studio in Residence</Button>
          </div>
        </div>
      </section>
    </>
  )
}

function CategoryCard({
  platform,
  accent,
  compact,
}: {
  platform: Platform
  accent: 'accent' | 'orange' | 'purple'
  compact?: boolean
}) {
  const accentClass = accent === 'orange' ? 'border-orange/50 hover:border-orange' :
                      accent === 'purple' ? 'border-purple/50 hover:border-purple' :
                      'border-gray-border hover:border-accent/50'
  const linkClass = accent === 'orange' ? 'text-orange hover:text-white' :
                    accent === 'purple' ? 'text-purple hover:text-white' :
                    'text-accent hover:text-white'
  return (
    <div className={`bg-black/40 p-5 rounded-lg border ${accentClass} transition-colors`}>
      <h3 className="text-lg font-bold mb-1">{platform.name}</h3>
      <p className="text-sm text-gray-light mb-2 font-medium">{platform.problem}</p>
      {!compact && <p className="text-sm text-gray-light/80 mb-3">{platform.description}</p>}
      {platform.releaseMode === 'byok-free' ? (
        <Link
          href={platform.url}
          className={`inline-flex items-center gap-1 text-sm font-medium ${linkClass}`}
        >
          See product page <ArrowRight size={14} />
        </Link>
      ) : platform.status === 'live' ? (
        <a
          href={platform.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 text-sm font-medium ${linkClass}`}
        >
          Visit Platform <ExternalLink size={14} />
        </a>
      ) : (
        <span className="text-sm text-gray-light italic">Coming Soon</span>
      )}
    </div>
  )
}
