// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
import { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { getPublishedPlatforms, PUBLISHED_PLATFORM_COUNT } from '@/lib/constants'

const DESCRIPTION =
  'The factory is the methodology. BYOK-first products free to the world, studio-in-residence engagements install the factory inside the next dev shop. Phase 2 is the Studio Fund.'

export const metadata: Metadata = {
  title: 'Our Thesis',
  description: DESCRIPTION,
  openGraph: { title: 'Our Thesis | Corporate AI Solutions', description: DESCRIPTION },
  twitter: { title: 'Our Thesis | Corporate AI Solutions', description: DESCRIPTION },
}

export default function ThesisPage() {
  const liveCount = getPublishedPlatforms().filter(p => p.status === 'live').length

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4">Our Thesis</div>
          <h1 className="mb-6">The factory <span className="text-gradient-accent">is</span> the methodology</h1>
          <p className="text-2xl text-gray-light">
            AI collapsed the cost of building software by 100x. The unlock isn&apos;t any single
            product &mdash; it&apos;s the repeatable factory that ships AI products on the user&apos;s
            own keys, infrastructure, and control. Give the products away free with BYOK; sell the
            factory itself as a studio-in-residence engagement.
          </p>
        </div>
      </section>

      {/* The Insight */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The Insight</h2>
          <div className="prose prose-lg text-gray-light space-y-6">
            <p>
              Before AI, software was expensive. $500K+ and 18 months per product. You needed
              massive scale to justify the investment. Most ideas never got built.
            </p>
            <p className="text-white font-bold text-xl">AI changed the economics:</p>
            <div className="grid md:grid-cols-3 gap-6 my-8">
              <div className="card text-center">
                <div className="font-mono text-sm text-accent mb-2">BUILD COST</div>
                <div className="text-2xl font-bold">$500K &rarr; $5K</div>
                <div className="text-sm text-gray-light">100x reduction</div>
              </div>
              <div className="card text-center">
                <div className="font-mono text-sm text-accent mb-2">TIME TO MARKET</div>
                <div className="text-2xl font-bold">18mo &rarr; 7 days</div>
                <div className="text-sm text-gray-light">75x faster</div>
              </div>
              <div className="card text-center">
                <div className="font-mono text-sm text-accent mb-2">INFRASTRUCTURE</div>
                <div className="text-2xl font-bold">Millions &rarr; $0</div>
                <div className="text-sm text-gray-light">Serverless &middot; BYOK</div>
              </div>
            </div>
            <p>
              This is the same shift that enabled Amazon&apos;s long tail. Suddenly every book was worth stocking.
              <strong className="text-white"> Now every valid problem is worth solving &mdash; and the methodology that ships those solutions repeatably is itself the durable asset.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* The Model — old vs new */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The Model</h2>
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="p-6 border border-red-500/30 bg-red-500/5">
              <h3 className="text-lg font-bold mb-4 text-red-400">&times; Old Model: Subscription Marketplace</h3>
              <ul className="space-y-3 text-gray-light">
                <li>&middot; Hosted SaaS at $49&ndash;$199/mo per product</li>
                <li>&middot; Operator owns the keys, the data, the support load</li>
                <li>&middot; Crowded category, race to the bottom on price</li>
                <li>&middot; Vendor-lock-in is the moat &mdash; users hate it</li>
                <li>&middot; Cash flow taps a tiny crowd of paying users</li>
              </ul>
            </div>
            <div className="p-6 border-2 border-accent bg-accent/5">
              <h3 className="text-lg font-bold mb-4 text-accent">&check; New Model: BYOK Factory + Studio in Residence</h3>
              <ul className="space-y-3 text-gray-light">
                <li>&middot; Products free with BYOK &mdash; user runs them on their own keys</li>
                <li>&middot; No managed-for-you secret; no vendor-lock-in</li>
                <li>&middot; Paid wedge is the factory itself, installed via studio-in-residence engagements ($65k/mo &times; 3&ndash;6 months)</li>
                <li>&middot; Each engagement produces a public case study + Factory Floor essay; the methodology compounds in credibility</li>
                <li>&middot; Phase 2: Studio Fund picks up the venture-studio thesis once 2+ public case studies exist</li>
              </ul>
            </div>
          </div>

          <div className="card p-8">
            <h3 className="text-xl font-bold mb-4">The Math (Phase 1)</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-gray-light mb-4">Per studio-in-residence engagement:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>Cash retainer:</span> <span className="font-mono">$65k &times; 3&ndash;6 mo = $195k&ndash;$390k</span></li>
                  <li className="flex justify-between"><span>Host equity:</span> <span className="font-mono">1&ndash;3% per Rule 7</span></li>
                  <li className="flex justify-between"><span>Cohort equity (Shape B):</span> <span className="font-mono">0.25&ndash;1% per company</span></li>
                  <li className="flex justify-between"><span>Public artifact:</span> <span className="font-mono">case study + essay</span></li>
                </ul>
              </div>
              <div>
                <p className="text-gray-light mb-4">Annual at full utilisation (2 engagements/yr):</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between"><span>Cash from stints:</span> <span className="font-mono text-accent">$390k+</span></li>
                  <li className="flex justify-between"><span>Equity exposure:</span> <span className="font-mono text-accent">~6 host positions over 3 yrs</span></li>
                  <li className="flex justify-between"><span>+ cohort tickets:</span> <span className="font-mono text-accent">24 over 3 yrs</span></li>
                  <li className="flex justify-between"><span>Power-law upside:</span> <span className="font-mono text-accent">~21% prob of unicorn tail</span></li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-border text-center">
              <p className="text-lg text-white font-semibold mb-2">Phase 1 funds the factory. Phase 2 is the Studio Fund.</p>
              <p className="text-gray-light">Cash from in-residence engagements pays for the methodology development. Case studies earn the right to raise the Phase 2 vehicle.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Engagement Playbook */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">The Engagement Playbook</h2>
          <p className="text-xl text-gray-light mb-8">
            Two engagements per year, by application. Windows: Jan&ndash;Mar and Jul&ndash;Sep.
          </p>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[
              { stage: 'INSTALL', cost: 'Week 1', time: 'substrate', color: 'accent' },
              { stage: 'ANCHOR', cost: 'Week 2-3', time: 'v0.1 ship', color: 'accent' },
              { stage: 'SCALE', cost: 'Week 4-N', time: 'cohort', color: 'orange' },
              { stage: 'EXIT', cost: 'Final week', time: 'case study', color: 'purple' },
            ].map((item, i) => (
              <div key={item.stage} className="card text-center">
                <div className="font-mono text-xs text-gray-light mb-2">PHASE {i + 1}</div>
                <div className="font-bold mb-2">{item.stage}</div>
                <div className={`text-2xl font-bold text-${item.color}`}>{item.cost}</div>
                <div className="text-xs text-gray-light">{item.time}</div>
              </div>
            ))}
          </div>
          <div className="card-orange p-8 text-center">
            <p className="text-xl font-bold mb-2">The exit state: your team running the factory without me.</p>
            <p className="text-gray-light">
              Every engagement ends with the host studio operating the BYOK Factory autonomously
              plus a published case study they use to recruit their next cohort.
            </p>
          </div>
        </div>
      </section>

      {/* Why BYOK */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why BYOK</h2>
          <p className="text-xl text-gray-light mb-8">
            Operators want to own the substrate. We give it to them.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Trust', desc: 'No managed-for-you secret; no vendor-controlled fallback. Every key is the operator&apos;s.' },
              { title: 'Sovereignty', desc: 'Data stays on the operator&apos;s infrastructure. No data exfiltration to a hosted vendor.' },
              { title: 'Cost control', desc: 'Operator pays AI providers directly. No middleman markup on inference.' },
              { title: 'Compound credibility', desc: 'Open template + public case studies earn distribution that paid marketing cannot buy.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-accent text-xl">&check;</span>
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
              {
                year: 'Year 1 (now)',
                title: 'Prove',
                items: [
                  `${liveCount} products live (${PUBLISHED_PLATFORM_COUNT} published)`,
                  'First BYOK release shipped (CQR)',
                  '2 studio-in-residence engagements completed',
                  '2 public case studies + Factory Floor essays',
                ],
              },
              {
                year: 'Year 2',
                title: 'Codify',
                items: [
                  '4&ndash;6 more BYOK-first releases in marketplace',
                  '3&ndash;4 more in-residence engagements completed',
                  'BYOK Factory installable in &lt;1 week by a junior operator',
                  'Studio Fund LP conversations open',
                ],
              },
              {
                year: 'Year 3',
                title: 'Compound',
                items: [
                  'Studio Fund raised (Phase 2)',
                  '~10 case studies; the methodology is the credential',
                  'Factory operators across multiple host studios shipping autonomously',
                  'Portfolio equity positions compounding; first power-law tail outcomes',
                ],
              },
            ].map((y) => (
              <div key={y.year} className="card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-mono text-accent">{y.year}</span>
                  <h3 className="text-xl font-bold">{y.title}</h3>
                </div>
                <ul className="grid md:grid-cols-2 gap-2">
                  {y.items.map((item) => (
                    <li key={item} className="text-gray-light text-sm flex items-center gap-2">
                      <span className="text-accent">&middot;</span>
                      <span dangerouslySetInnerHTML={{ __html: item }} />
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
            Use the BYOK-first products, bring the factory into your studio, or join the team
            building the methodology.
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
