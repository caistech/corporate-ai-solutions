// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
import { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { getLivePlatforms } from '@/lib/constants'

const DESCRIPTION =
  "The unicorn isn't the product — it's the factory. 35+ live AI platforms. Targeting $200M+ portfolio ARR."

export const metadata: Metadata = {
  title: 'Our Thesis',
  description: DESCRIPTION,
  openGraph: { title: 'Our Thesis | Corporate AI Solutions', description: DESCRIPTION },
  twitter: { title: 'Our Thesis | Corporate AI Solutions', description: DESCRIPTION },
}

export default function ThesisPage() {
  const liveCount = getLivePlatforms().length

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4">Our Thesis</div>
          <h1 className="mb-6">The Unicorn Is the Factory</h1>
          <p className="text-2xl text-gray-light">
            AI collapsed the cost of building software by 100x. We built a machine that exploits that —
            manufacturing AI companies at near-zero marginal cost. The portfolio compounds to billion-dollar scale.
          </p>
        </div>
      </section>

      {/* The Insight */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The Insight</h2>
          <div className="prose prose-lg text-gray-light space-y-6">
            <p>
              Before AI, software was expensive. A single product cost $500K+ and 18 months to build.
              You needed massive scale to justify the investment. VCs needed 100x returns.
              Most ideas never got built.
            </p>
            <p className="text-white font-bold text-xl">AI changed the economics:</p>
            <div className="grid md:grid-cols-3 gap-6 my-8">
              <div className="card text-center">
                <div className="font-mono text-sm text-accent mb-2">BUILD COST</div>
                <div className="text-2xl font-bold">$500K → $5K</div>
                <div className="text-sm text-gray-light">100x reduction</div>
              </div>
              <div className="card text-center">
                <div className="font-mono text-sm text-accent mb-2">TIME TO MARKET</div>
                <div className="text-2xl font-bold">18mo → 7 days</div>
                <div className="text-sm text-gray-light">75x faster</div>
              </div>
              <div className="card text-center">
                <div className="font-mono text-sm text-accent mb-2">INFRASTRUCTURE</div>
                <div className="text-2xl font-bold">Millions → $0</div>
                <div className="text-sm text-gray-light">Serverless</div>
              </div>
            </div>
            <p>
              This is the same shift that enabled Amazon&apos;s long tail.
              Suddenly, every book was worth stocking.
              <strong className="text-white"> Now, every valid problem is worth solving — and every solution is worth building.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* The Model */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The Model</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="p-6 border border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold mb-4 text-red-400">❌ Old Model: Hunt One Unicorn</h3>
              <ul className="space-y-3 text-gray-light">
                <li>• Bet $500K+ per company, pray for 100x</li>
                <li>• 90% complete failures</li>
                <li>• 7-10 year liquidity wait</li>
                <li>• Binary outcomes: moonshot or bust</li>
                <li>• One product, one team, one shot</li>
              </ul>
            </div>
            <div className="p-6 border-2 border-accent bg-accent/5">
              <h3 className="text-lg font-bold mb-4 text-accent">✓ New Model: Build the Factory</h3>
              <ul className="space-y-3 text-gray-light">
                <li>• $5K per product, manufactured in 7 days</li>
                <li>• Portfolio diversification across 200+ products</li>
                <li>• Cash flow in months, exits as bonus liquidity</li>
                <li>• The factory scales — each product is near-zero marginal cost</li>
                <li>• 200 products × $1M ARR = $200M ARR portfolio</li>
              </ul>
            </div>
          </div>
          <div className="card p-8">
            <h3 className="text-xl font-bold mb-4">The Math</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-light mb-4">Per platform:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>Build + GTM:</span> <span className="font-mono">$10,000</span></li>
                  <li className="flex justify-between"><span>Break-even:</span> <span className="font-mono">50 × $50 = $2,500 MRR</span></li>
                  <li className="flex justify-between"><span>Payback:</span> <span className="font-mono">4 months</span></li>
                </ul>
              </div>
              <div>
                <p className="text-gray-light mb-4">Portfolio of 100 platforms:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>20% fail:</span> <span className="font-mono text-red-400">-$200K</span></li>
                  <li className="flex justify-between"><span>50% break even:</span> <span className="font-mono">$0</span></li>
                  <li className="flex justify-between"><span>25% steady ($10K MRR):</span> <span className="font-mono text-accent">$250K MRR</span></li>
                  <li className="flex justify-between"><span>5% breakout ($50K+ MRR):</span> <span className="font-mono text-accent">$250K+ MRR</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-border text-center">
              <p className="text-2xl font-bold text-accent">$500K+ MRR = $6M+ ARR at 100 platforms</p>
              <p className="text-gray-light mb-2">Before any exits. And this is just phase one.</p>
              <p className="text-lg text-white font-semibold">At 200 platforms: $200M+ ARR. At 10-15x: $2B+ valuation.</p>
              <p className="text-gray-light">The unicorn isn&apos;t the product. It&apos;s the factory.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Exit Playbook */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The Exit Playbook</h2>
          <p className="text-xl text-gray-light mb-8">
            We don&apos;t build to hold forever. We build to exit.
          </p>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { stage: 'BUILD', cost: '$5-10K', time: '7 days', color: 'accent' },
              { stage: 'VALIDATE', cost: '50 subs', time: '6 months', color: 'accent' },
              { stage: 'GROW', cost: '$1M ARR', time: '18-24 mo', color: 'orange' },
              { stage: 'EXIT', cost: '6-10x', time: 'Auction', color: 'purple' },
            ].map((item, i) => (
              <div key={item.stage} className="card text-center">
                <div className="font-mono text-xs text-gray-light mb-2">STAGE {i + 1}</div>
                <div className="font-bold mb-2">{item.stage}</div>
                <div className={`text-2xl font-bold text-${item.color}`}>{item.cost}</div>
                <div className="text-xs text-gray-light">{item.time}</div>
              </div>
            ))}
          </div>
          <div className="card-orange p-8 text-center">
            <p className="text-xl font-bold mb-2">Individual exits at $6-10M are optional liquidity events</p>
            <p className="text-gray-light">
              The real play is the compounding portfolio. Individual product exits are bonus cash flow, not the endgame.
            </p>
          </div>
        </div>
      </section>

      {/* Why Voice AI */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why Voice AI?</h2>
          <p className="text-xl text-gray-light mb-8">
            Not every platform needs voice. But voice AI is our edge.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Differentiation', desc: "Competitors can copy features, not conversations" },
              { title: 'Stickiness', desc: "Voice creates habits, habits create retention" },
              { title: 'Data Moat', desc: "Every conversation improves the product" },
              { title: 'Premium Positioning', desc: "Voice commands premium pricing" },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-accent text-xl">✓</span>
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-sm text-gray-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Year Vision */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The 3-Year Vision</h2>
          <div className="space-y-8">
            {[
              { year: 'Year 1', title: 'Prove', items: [`50 platforms (${liveCount} built)`, '$100K MRR target', 'Factory process validated', 'RevAgent GTM operational'] },
              { year: 'Year 2', title: 'Scale', items: ['100 platforms', '$500K MRR ($6M ARR)', 'First strategic exits', 'Factory replication playbook'] },
              { year: 'Year 3', title: 'Compound', items: ['200+ platforms', '$2M+ MRR ($24M+ ARR)', 'Portfolio valued at 10-15x ARR', 'Path to $200M ARR visible'] },
            ].map((y) => (
              <div key={y.year} className="card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-accent">{y.year}</span>
                  <h3 className="text-xl font-bold">{y.title}</h3>
                </div>
                <ul className="grid md:grid-cols-2 gap-2">
                  {y.items.map((item) => (
                    <li key={item} className="text-gray-light text-sm flex items-center gap-2">
                      <span className="text-accent">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Get Involved</h2>
          <p className="text-xl text-gray-light mb-8">
            Use the BYOK-first products, bring us a problem to install the factory in your dev shop, or join the team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/marketplace">Use Platforms</Button>
            <Button href="/engagement" variant="orange">Studio in Residence</Button>
            <Button href="/studio/join" variant="secondary">Join Team</Button>
          </div>
        </div>
      </section>
    </>
  )
}
