// @explanatory-header-exempt — hand-built dark-theme hero opens with what/what-to-do/why; full <ExplanatoryHeader/> would clash with the theme
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Mic, Sparkles, ExternalLink, Shield, Github, Rocket, ShieldCheck, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLATFORMS, getParentPlatforms, getChildrenOf, SHOWCASE_REPOS } from '@/lib/constants'
import { Platform } from '@/types'

const isRunnable = (p: Platform) => Boolean(p.githubUrl || p.repoUrl)

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Parent platforms, generators, and white-label solutions. Free with BYOK.',
}

export default function MarketplacePage() {
  // Filter out paid-client engagements that live on /clients instead of the public marketplace.
  const parentPlatforms = getParentPlatforms().filter(p => !p.marketplaceHidden)
  const generators = parentPlatforms.filter(p => p.isGenerator)
  const voiceCoaching = parentPlatforms.filter(p => p.category === 'voice-coaching')
  const businessTools = parentPlatforms.filter(p => p.category === 'business-tools')
  const generatorPlatforms = parentPlatforms.filter(p => p.category === 'generators')
  const infrastructure = parentPlatforms.filter(p => p.category === 'infrastructure')
  const childPlatforms = PLATFORMS.filter(p => p.type === 'child')
  const voiceAIParents = parentPlatforms.filter(p => p.hasVoiceAI)
  const byokFreeCount = parentPlatforms.filter(p => p.releaseMode === 'byok-free').length
  const runnableCount = parentPlatforms.filter(isRunnable).length

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-accent font-medium mb-4">The Marketplace</p>
            <h1 className="mb-6">{parentPlatforms.length} BYOK-First AI Products.<br />Your keys. Your infra. Your control.</h1>
            <p className="text-xl text-gray-light mb-8">
              Every product below is free with BYOK &mdash; clone the repo, deploy to your own
              infrastructure with your own keys, walk the setup wizard. No subscription, no
              managed-for-you secret. Generators spin up white-label versions in days.
            </p>
            <div className="flex gap-4">
              <Button href="/marketplace/cqr">See CQR &mdash; the first BYOK release</Button>
              <Button href="/engagement" variant="orange">Studio in Residence</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-6 bg-gray-dark border-y border-gray-border">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-accent">{parentPlatforms.length}</div>
            <div className="text-sm text-gray-light">Parent Platforms</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange">{byokFreeCount}</div>
            <div className="text-sm text-gray-light">BYOK-Free Releases</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">{runnableCount}</div>
            <div className="text-sm text-gray-light">Runnable / Open Source</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple">{generators.length}</div>
            <div className="text-sm text-gray-light">Generators</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">{childPlatforms.length}</div>
            <div className="text-sm text-gray-light">White-Label Examples</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">{voiceAIParents.length}</div>
            <div className="text-sm text-gray-light">With Voice AI</div>
          </div>
        </div>
      </section>

      {/* Proof — the inspectable / runnable spine */}
      <section id="proof" className="section">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Github className="text-accent" size={28} />
              <h2 className="text-3xl font-bold">Proof: clone one and run it</h2>
            </div>
            <p className="text-gray-light max-w-3xl">
              Don&apos;t take the count on faith. These are the repos you can read or clone-and-run
              right now &mdash; open source, BYOK, on your own infra. Every link resolves to live,
              inspectable state, not a marketing page.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SHOWCASE_REPOS.map((repo) => (
              <div key={repo.name} className="card hover:border-accent/50 transition-colors flex flex-col">
                <div className="mb-3">
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded font-medium">
                    {repo.label}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2 break-words font-mono">{repo.name}</h3>
                <p className="text-sm text-gray-light mb-6 flex-grow">{repo.what}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                  {repo.deployUrl && (
                    <a
                      href={repo.deployUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-orange hover:text-white transition-colors"
                    >
                      <Rocket size={14} /> Deploy your own
                    </a>
                  )}
                  {repo.repoUrl && (
                    <a
                      href={repo.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-gray-light hover:text-white transition-colors"
                    >
                      <Github size={14} /> Read the source
                    </a>
                  )}
                  {repo.liveUrl && (
                    <a
                      href={repo.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-accent hover:text-white transition-colors"
                    >
                      <ShieldCheck size={14} /> Inspect live
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generator Platforms - Highlighted */}
      <section id="generators" className="section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Sparkles className="text-orange" size={28} />
            <div>
              <h2 className="text-3xl font-bold">Generator Platforms</h2>
              <p className="text-gray-light">These platforms can spin up customized white-label versions for your business</p>
            </div>
          </div>

          <div className="space-y-8">
            {generatorPlatforms.map((platform) => {
              const children = getChildrenOf(platform.id)
              return (
                <div key={platform.id} className="bg-gray-dark rounded-lg border-2 border-orange/30 overflow-hidden">
                  {/* Parent Platform */}
                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xs bg-orange/20 text-orange px-3 py-1 rounded-full font-medium">
                            Generator
                          </span>
                          {platform.hasVoiceAI && (
                            <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                              <Mic size={12} /> Voice AI
                            </span>
                          )}
                          {platform.status === 'live' ? (
                            <span className="status-live">Live</span>
                          ) : (
                            <span className="status-building">Building</span>
                          )}
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{platform.name}</h3>
                        <p className="text-gray-light mb-4 max-w-2xl">{platform.description}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <a
                          href={platform.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary inline-flex items-center gap-2"
                        >
                          Visit Platform <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Children Examples */}
                  {children.length > 0 && (
                    <div className="bg-black/30 p-6 border-t border-orange/20">
                      <p className="text-sm text-orange font-medium mb-4">
                        White-Label Examples ({children.length} deployed):
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {children.map((child) => (
                          <a
                            key={child.id}
                            href={child.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-dark rounded border border-gray-border hover:border-orange/50 transition-colors group"
                          >
                            <div>
                              <span className="text-sm font-medium">{child.name}</span>
                              <p className="text-xs text-gray-light">{child.tagline}</p>
                            </div>
                            <ArrowUpRight size={16} className="text-gray-light group-hover:text-orange transition-colors flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Core Infrastructure Layer */}
      {infrastructure.length > 0 && (
        <section id="infrastructure" className="section bg-gray-dark">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-accent" size={24} />
                <h2 className="text-3xl font-bold">Core Infrastructure Layer</h2>
              </div>
              <p className="text-gray-light">Foundational trust, security, and observability shared across every platform</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {infrastructure.map((platform) => (
                <ParentPlatformCard key={platform.id} platform={platform} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Voice Coaching Platforms */}
      <section id="voice-coaching" className="section">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Mic className="text-accent" size={24} />
              <h2 className="text-3xl font-bold">Voice Coaching Suite</h2>
            </div>
            <p className="text-gray-light">AI voice agents for high-stakes conversation practice</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {voiceCoaching.map((platform) => (
              <ParentPlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </div>
      </section>

      {/* Business Tools */}
      <section id="business-tools" className="section bg-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Business Tools</h2>
            <p className="text-gray-light">Platforms solving specific business problems</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessTools.map((platform) => (
              <ParentPlatformCard key={platform.id} platform={platform} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Want the factory installed in your studio?</h2>
          <p className="text-xl text-gray-light mb-8">
            Studio-in-residence engagements bring the BYOK Factory inside your team for one cohort.
            Substrate installed, products shipped, case study published, team trained.
          </p>
          <div className="flex justify-center gap-4">
            <Button href="/engagement" variant="orange">Studio in Residence</Button>
            <Button href="/pricing" variant="secondary">See Pricing</Button>
          </div>
        </div>
      </section>
    </>
  )
}

function ReleaseModeBadge({ platform }: { platform: Platform }) {
  switch (platform.releaseMode) {
    case 'byok-free':
      return (
        <span className="flex items-center gap-1 text-xs bg-orange/20 text-orange px-2 py-1 rounded font-medium">
          <Rocket size={12} /> Free &middot; BYOK
        </span>
      )
    case 'placeholder':
      return (
        <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded font-medium">
          <ShieldCheck size={12} /> Shared infrastructure
        </span>
      )
    case 'paid-client':
      return (
        <span className="flex items-center gap-1 text-xs bg-gray-mid text-gray-light px-2 py-1 rounded font-medium">
          <Lock size={12} /> Private deployment
        </span>
      )
    case 'in-migration':
      return (
        <span className="flex items-center gap-1 text-xs bg-purple/20 text-purple px-2 py-1 rounded font-medium">
          BYOK release planned
        </span>
      )
    default:
      return null
  }
}

function PlatformCardCTA({ platform }: { platform: Platform }) {
  // BYOK-free: lead with Deploy + GitHub if URLs are populated; otherwise the in-repo product page.
  if (platform.releaseMode === 'byok-free') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
        {platform.deployUrl ? (
          <a
            href={platform.deployUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-orange hover:text-white transition-colors"
          >
            <Rocket size={14} /> Deploy Your Own
          </a>
        ) : (
          <Link
            href={platform.url}
            className="inline-flex items-center gap-1 text-orange hover:text-white transition-colors"
          >
            <Rocket size={14} /> View Details
          </Link>
        )}
        {platform.githubUrl && (
          <a
            href={platform.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gray-light hover:text-white transition-colors"
          >
            <Github size={14} /> GitHub
          </a>
        )}
      </div>
    )
  }

  // Paid-client: no public CTA — these are private engagements that live on /clients.
  if (platform.releaseMode === 'paid-client') {
    return (
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm text-gray-light hover:text-white transition-colors font-medium"
      >
        By introduction only &middot; see clients <ArrowRight size={14} />
      </Link>
    )
  }

  // In-migration: hosted product still exists; visit it (Wave 3+ may swap to "Coming soon" once
  // the hosted platforms are explicitly retired in favour of the BYOK template).
  if (platform.releaseMode === 'in-migration' && platform.status === 'live') {
    return (
      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-accent hover:text-white transition-colors font-medium"
      >
        Visit Platform <ExternalLink size={14} />
      </a>
    )
  }

  // Placeholder + commercial + default: existing Visit Platform / Join Waitlist behavior.
  return platform.status === 'live' ? (
    <a
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm text-accent hover:text-white transition-colors font-medium"
    >
      Visit Platform <ExternalLink size={14} />
    </a>
  ) : (
    <Link
      href={platform.url}
      className="inline-flex items-center gap-2 text-sm text-orange hover:text-white transition-colors font-medium"
    >
      Join Waitlist <ArrowRight size={14} />
    </Link>
  )
}

function ParentPlatformCard({ platform }: { platform: Platform }) {
  return (
    <div className="card hover:border-accent/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2 flex-wrap">
          <ReleaseModeBadge platform={platform} />
          {isRunnable(platform) ? (
            <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded font-medium">
              <Github size={12} /> Runnable / open
            </span>
          ) : (
            <span className="text-xs bg-gray-mid/40 text-gray-light px-2 py-1 rounded font-medium">
              Live landing page
            </span>
          )}
          {platform.hasVoiceAI && (
            <span className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded">
              <Mic size={12} /> Voice AI
            </span>
          )}
          {platform.isGenerator && (
            <span className="text-xs bg-orange/20 text-orange px-2 py-1 rounded">
              Generator
            </span>
          )}
        </div>
        {platform.status === 'live' ? (
          <span className="status-live">Live</span>
        ) : (
          <span className="status-building">Building</span>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2">{platform.name}</h3>
      <p className="text-sm text-gray-light mb-1 font-medium">{platform.problem}</p>
      <p className="text-sm text-gray-light mb-6">{platform.description}</p>

      <PlatformCardCTA platform={platform} />

      {platform.trustRecordUrl && (
        <a
          href={platform.trustRecordUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-gray-light hover:text-white transition-colors"
        >
          <ShieldCheck size={12} /> Trust record
        </a>
      )}
    </div>
  )
}