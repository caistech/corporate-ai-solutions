import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight, Mic, Sparkles, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLATFORMS, getParentPlatforms, getChildrenOf } from '@/lib/constants'
import { Platform } from '@/types'

export const metadata: Metadata = {
  title: 'Marketplace',
  description: '9 parent platforms. Generators that spin up white-label versions. Visit the landing pages.',
}

export default function MarketplacePage() {
  const parentPlatforms = getParentPlatforms()
  const generators = parentPlatforms.filter(p => p.isGenerator)
  const voiceCoaching = parentPlatforms.filter(p => p.category === 'voice-coaching')
  const businessTools = parentPlatforms.filter(p => p.category === 'business-tools')
  const generatorPlatforms = parentPlatforms.filter(p => p.category === 'generators')

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-accent font-medium mb-4">The Marketplace</p>
            <h1 className="mb-6">9 Parent Platforms.<br />Infinite White-Label Potential.</h1>
            <p className="text-xl text-gray-light mb-8">
              Each platform below has its own public landing page. Visit to learn more.
              Our generators can spin up customized versions for your business in days.
            </p>
            <div className="flex gap-4">
              <Button href="/pricing">See Pricing</Button>
              <Button href="/partner" variant="orange">Want Your Own Version?</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-8 px-6 bg-gray-dark border-y border-gray-border">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-12 text-center">
          <div>
            <div className="text-3xl font-bold text-accent">9</div>
            <div className="text-sm text-gray-light">Parent Platforms</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-orange">3</div>
            <div className="text-sm text-gray-light">Generators</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">9</div>
            <div className="text-sm text-gray-light">White-Label Examples</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple">6</div>
            <div className="text-sm text-gray-light">With Voice AI</div>
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

      {/* Voice Coaching Platforms */}
      <section id="voice-coaching" className="section bg-gray-dark">
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
      <section id="business-tools" className="section">
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
          <h2 className="mb-4">Want Your Own White-Label Version?</h2>
          <p className="text-xl text-gray-light mb-8">
            Our generators can spin up a customized platform for your business in days, not months.
            Revenue share model—no upfront cost.
          </p>
          <div className="flex justify-center gap-4">
            <Button href="/partner" variant="orange">Partner With Us</Button>
            <Button href="/pricing" variant="secondary">See Pricing</Button>
          </div>
        </div>
      </section>
    </>
  )
}

function ParentPlatformCard({ platform }: { platform: Platform }) {
  return (
    <div className="card hover:border-accent/50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2 flex-wrap">
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

      {platform.status === 'live' ? (
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
      )}
    </div>
  )
}