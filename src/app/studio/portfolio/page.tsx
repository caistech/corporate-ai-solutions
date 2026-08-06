// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
import { Metadata } from 'next'
import { ArrowUpRight, Mic } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getPublishedPlatforms, PUBLISHED_PLATFORM_COUNT } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: `${PUBLISHED_PLATFORM_COUNT} AI platforms published in 12 months by one founder. The factory never stops.`,
}

export default function PortfolioPage() {
  // Scoped to the published set so the tiles and the grid below both add up to the headline.
  // Counting all of PLATFORMS here put 50 cards under a 29 headline on the one page where a
  // visitor can actually count them.
  const publishedPlatforms = getPublishedPlatforms()
  const livePlatforms = publishedPlatforms.filter(p => p.status === 'live')
  const buildingPlatforms = publishedPlatforms.filter(p => p.status === 'building')

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4">The Portfolio</div>
          <h1 className="mb-6">{PUBLISHED_PLATFORM_COUNT} Platforms Published</h1>
          <p className="text-xl text-gray-light mb-8">
            Each one started as someone&apos;s problem. 
            Each one built in days, not months.
            Each one on track to $1M ARR or sunset.
          </p>
          <div className="flex gap-8">
            <div>
              <div className="font-mono text-4xl font-bold text-accent">{livePlatforms.length}</div>
              <div className="text-sm text-gray-light">Live</div>
            </div>
            <div>
              <div className="font-mono text-4xl font-bold text-orange">{buildingPlatforms.length}</div>
              <div className="text-sm text-gray-light">Building</div>
            </div>
            <div>
              <div className="font-mono text-4xl font-bold text-gray-light">$5K</div>
              <div className="text-sm text-gray-light">Avg Build Cost</div>
            </div>
            <div>
              <div className="font-mono text-4xl font-bold text-gray-light">7d</div>
              <div className="text-sm text-gray-light">Avg Build Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* All Platforms */}
      <section className="section bg-gray-dark">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">All Platforms</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedPlatforms.map((platform) => (
              <div 
                key={platform.id} 
                className={`card ${platform.featured ? 'border-accent' : ''}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2 flex-wrap">
                    <span className="font-mono text-xs text-accent uppercase bg-accent/10 px-2 py-1">
                      {platform.category}
                    </span>
                    {platform.hasVoiceAI && (
                      <span className="flex items-center gap-1 text-xs bg-purple/20 text-purple px-2 py-1">
                        <Mic size={10} /> Voice
                      </span>
                    )}
                  </div>
                  {platform.status === 'live' ? (
                    <span className="status-live">Live</span>
                  ) : (
                    <span className="status-building">Building</span>
                  )}
                </div>
                
                <h3 className="text-lg font-bold mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-light mb-4 line-clamp-2">{platform.description}</p>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-border">
                  <span className="text-xs text-gray-light">Problem: {platform.problem}</span>
                  {platform.status === 'live' && (
                    <a
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-white transition-colors"
                    >
                      <ArrowUpRight size={18} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Lifecycle */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Platform Lifecycle</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stage: 'Build', metric: '$5-10K', status: '7 days' },
              { stage: 'Validate', metric: '50 subs', status: '6 months' },
              { stage: 'Grow', metric: '$1M ARR', status: '18-24 mo' },
              { stage: 'Exit', metric: '6-10x', status: 'Auction' },
            ].map((item, i) => (
              <div key={item.stage} className="card text-center">
                <div className="font-mono text-xs text-accent mb-2">Stage {i + 1}</div>
                <div className="font-bold mb-1">{item.stage}</div>
                <div className="text-xl font-bold text-accent">{item.metric}</div>
                <div className="text-xs text-gray-light">{item.status}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-light mt-8">
            Individual exits are optional liquidity events.
            The real value is the compounding portfolio — and the factory that creates it.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Want to Add to the Portfolio?</h2>
          <p className="text-gray-light mb-8">
            Bring us a problem. If it passes validation, we&apos;ll build it together.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button href="/engagement" variant="orange">Studio in Residence</Button>
            <Button href="/marketplace" variant="secondary">Browse the Marketplace</Button>
          </div>
        </div>
      </section>
    </>
  )
}
