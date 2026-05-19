// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { PLATFORMS } from '@/lib/constants'

export default function InvestPage() {
  const [formState, setFormState] = useState({ isSubmitting: false, isSuccess: false })

  const livePlatforms = PLATFORMS.filter(p => p.status === 'live')

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="tag tag-center mb-4">Investment Opportunity</div>
          <h1 className="mb-6">
            The Unicorn Is<br />
            <span className="text-gradient-accent">the Factory</span>
          </h1>
          <p className="text-2xl text-gray-light">
            AI collapsed the cost of building software by 100x.
            We built the machine that exploits that — manufacturing AI companies at near-zero marginal cost.
          </p>
        </div>
      </section>

      {/* The Paradigm Shift */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">The Paradigm Shift</h2>
          <p className="text-gray-light text-center mb-8 max-w-2xl mx-auto">
            Everyone is chasing the next single unicorn. We&apos;re building the factory that produces them.
            The next Berkshire Hathaway won&apos;t acquire companies — it will create them.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 border border-gray-border">
              <h3 className="text-lg font-bold mb-4 text-gray-light">Old Model: Hunt One Unicorn</h3>
              <ul className="space-y-3 text-gray-light text-sm">
                <li>Bet $500K+ per company, pray for 100x</li>
                <li>90% complete failures</li>
                <li>7-10 year liquidity wait</li>
                <li>One product, one team, one shot</li>
                <li>Binary: moonshot or bust</li>
              </ul>
            </div>
            <div className="p-6 border-2 border-accent bg-accent/5">
              <h3 className="text-lg font-bold mb-4 text-accent">New Model: Build the Factory</h3>
              <ul className="space-y-3 text-sm">
                <li>$5K per product, manufactured in 7 days</li>
                <li>Portfolio diversification across 200+ products</li>
                <li>Cash flow in months, exits as bonus liquidity</li>
                <li>One founder + AI = output of 50 engineers</li>
                <li>The factory scales — near-zero marginal cost per product</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="tag tag-center mb-4">Proof the Factory Works</div>
            <h2>{livePlatforms.length} Platforms Already Built</h2>
            <p className="text-gray-light mt-4">{livePlatforms.length} production platforms in 12 months. One founder. Zero employees. This isn&apos;t a pitch — it&apos;s a portfolio.</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {livePlatforms.map((platform) => (
              <a
                key={platform.id}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card p-4 text-center hover:border-accent transition-colors"
              >
                <div className="font-bold text-sm mb-1">{platform.name}</div>
                <div className="status-live text-xs justify-center">Live</div>
              </a>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-8 text-center">
            <div className="card">
              <div className="font-mono text-sm text-accent mb-2">COST PER PRODUCT</div>
              <div className="text-3xl font-bold">$5,000</div>
            </div>
            <div className="card">
              <div className="font-mono text-sm text-accent mb-2">BUILD TIME</div>
              <div className="text-3xl font-bold">7 days</div>
            </div>
            <div className="card">
              <div className="font-mono text-sm text-accent mb-2">TOTAL INVESTED TO DATE</div>
              <div className="text-3xl font-bold">~$85K</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Portfolio Math */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">The Portfolio Math</h2>

          <div className="card p-8 mb-8">
            <h3 className="font-bold mb-6">Phase 1: 100 Platforms</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/30">
                <span>20% fail</span>
                <span className="font-mono text-red-400">-$200K</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-mid">
                <span>50% break even</span>
                <span className="font-mono">$0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent/10 border border-accent/30">
                <span>25% steady earners ($10K MRR each)</span>
                <span className="font-mono text-accent">$250K MRR</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-accent/10 border border-accent/30">
                <span>5% breakouts ($50K+ MRR each)</span>
                <span className="font-mono text-accent">$250K+ MRR</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-accent text-black font-bold">
                <span>Phase 1 Total</span>
                <span className="font-mono">$500K+ MRR = $6M+ ARR</span>
              </div>
            </div>
          </div>

          <div className="card p-8 border-2 border-orange">
            <h3 className="font-bold mb-6 text-orange">Phase 2: 200+ Platforms (The Factory at Scale)</h3>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="font-mono text-sm text-orange mb-2">PORTFOLIO ARR</div>
                <div className="text-3xl font-bold">$200M+</div>
                <div className="text-sm text-gray-light">200 products × $1M avg ARR</div>
              </div>
              <div>
                <div className="font-mono text-sm text-orange mb-2">VALUATION MULTIPLE</div>
                <div className="text-3xl font-bold">10-15x</div>
                <div className="text-sm text-gray-light">SaaS portfolio standard</div>
              </div>
              <div>
                <div className="font-mono text-sm text-orange mb-2">STUDIO VALUATION</div>
                <div className="text-3xl font-bold">$2B+</div>
                <div className="text-sm text-gray-light">The factory is the unicorn</div>
              </div>
            </div>
            <p className="text-center text-gray-light mt-6">
              Individual product exits at $6-10M each are optional liquidity events along the way.
            </p>
          </div>
        </div>
      </section>

      {/* Three Return Mechanisms */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Three Return Mechanisms</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="font-mono text-sm text-accent mb-2">COMPOUNDING</div>
              <h3 className="font-bold mb-2">Portfolio ARR</h3>
              <p className="text-sm text-gray-light mb-4">Each new product is additive. The portfolio compounds monthly. ARR grows with every launch.</p>
              <div className="text-2xl font-bold">$200M+ target</div>
            </div>
            <div className="card-orange p-6">
              <div className="font-mono text-sm text-orange mb-2">LIQUIDITY</div>
              <h3 className="font-bold mb-2">Strategic Exits</h3>
              <p className="text-sm text-gray-light mb-4">Products at $1M ARR can be sold to corporates at 6-10x. Optional cash events, not the endgame.</p>
              <div className="text-2xl font-bold">6-10x ARR</div>
            </div>
            <div className="card-purple p-6">
              <div className="font-mono text-sm text-purple mb-2">PLATFORM</div>
              <h3 className="font-bold mb-2">Factory Value</h3>
              <p className="text-sm text-gray-light mb-4">The build engine itself is the most valuable asset. Replicable, scalable, and defensible.</p>
              <div className="text-2xl font-bold">$2B+ at scale</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Now */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Why This Is the Moment</h2>
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-bold mb-2 text-accent">AI build cost collapse</h3>
              <p className="text-gray-light text-sm">Claude + AI coding agents cut software development cost by 100x. A solo founder can now ship production SaaS in days. This window exists now — in 3 years, everyone will be doing this.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-bold mb-2 text-accent">Infrastructure is free</h3>
              <p className="text-gray-light text-sm">Vercel, Supabase, Stripe — the full stack is serverless, pay-as-you-go, zero upfront. The entire 38-product portfolio runs on ~$200/month.</p>
            </div>
            <div className="card p-6">
              <h3 className="font-bold mb-2 text-accent">Corporate AI FOMO</h3>
              <p className="text-gray-light text-sm">Every mid-market company wants AI capabilities but can&apos;t build them. They&apos;ll acquire a $1M ARR product for $6-10M rather than spend 4 years building internally.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Raise */}
      <section className="section">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">The Opportunity</h2>
          <div className="card p-8">
            <div className="text-center mb-8">
              <p className="text-gray-light mb-4">We&apos;re raising to accelerate the factory — systematically monetise the existing portfolio and scale production to 200+ products.</p>
            </div>

            <h3 className="font-bold mb-4">Use of Funds</h3>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center">
                <span>40% GTM Infrastructure</span>
                <span className="text-gray-light text-sm">RevAgent agentic GTM across all products</span>
              </div>
              <div className="flex justify-between items-center">
                <span>40% Product Hardening</span>
                <span className="text-gray-light text-sm">Stripe billing, onboarding, enterprise features</span>
              </div>
              <div className="flex justify-between items-center">
                <span>20% Pipeline</span>
                <span className="text-gray-light text-sm">Validate and build next 30 products</span>
              </div>
            </div>

            <div className="p-6 bg-accent/10 border border-accent/30 text-center">
              <p className="text-lg font-bold mb-2">The thesis is simple</p>
              <p className="text-gray-light">
                AI makes building cheap. The market hasn&apos;t caught up yet. Speed and volume are the moat.
                We&apos;re 38 products ahead of everyone else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Ready to Talk?</h2>
          <p className="text-xl text-gray-light mb-8">
            The unicorn isn&apos;t the product. It&apos;s the factory that creates them.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button href="/contact?type=investor">Book an Investor Call</Button>
            <Button href="mailto:invest@corporateaisolutions.com" variant="secondary">
              Email: invest@corporateaisolutions.com
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
