// @explanatory-header-exempt — nested workflow page; entry-point header lives on the parent surface
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { FOUNDER, SITE } from '@/lib/constants'

const DESCRIPTION =
  'Studio partnerships for domain experts ready to co-found a vertical. Selective. Equity-based. 35+ live AI platforms as portfolio evidence.'

export const metadata: Metadata = {
  title: 'Studio Partnerships',
  description: DESCRIPTION,
  openGraph: { title: 'Studio Partnerships | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Studio Partnerships | ' + SITE.name, description: DESCRIPTION },
}

export default function StudioPartnerPage() {
  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[50vh] flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="tag tag-center mb-4">Studio Partnerships</div>
          <h1 className="mb-6">Co-found a Vertical With Us</h1>
          <p className="text-xl text-gray-light max-w-3xl mx-auto">
            You&apos;ve spent 20+ years watching the same problem cost your industry millions.
            You know the workaround everyone uses. You know exactly what the fix would look like.
            You just never had anyone who could build it.
          </p>
          <p className="text-xl text-white mt-6 font-semibold">The Studio model exists for you.</p>
        </div>
      </section>

      {/* How the Partnership Works */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">How the Partnership Works</h2>
          <div className="space-y-4 text-gray-light">
            <p>
              You bring deep industry expertise &mdash; 15+ years on the ground in construction,
              logistics, healthcare, finance, manufacturing, legal, or any sector where the workflows
              are real and the gaps are obvious. We bring the build capability &mdash; solo end-to-end
              delivery, the Corporate AI Solutions stack, 35+ live AI platforms as portfolio evidence.
            </p>
            <p>
              Together we ship a vertical platform in your industry. You operate the front of the
              business &mdash; relationships, sales, domain expertise, market positioning. We operate
              the back &mdash; architecture, AI stack, build, deployment, infrastructure.
            </p>
            <p>
              You take a meaningful equity stake in the resulting venture, typically 10&ndash;30%
              depending on involvement and contribution.
            </p>
            <p className="text-white font-medium">
              This is not a hired-development model. It&apos;s a co-founder model. The platform carries
              your name, your relationships, and your judgment about what the industry actually needs.
            </p>
          </div>
        </div>
      </section>

      {/* What "Studio Partnership" Means in Practice — 2x2 cards */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">What &ldquo;Studio Partnership&rdquo; means in practice</h2>
          <p className="text-gray-light mb-8">Four things define the model.</p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-dark rounded-lg border-l-4 border-[#0B7A5C]">
              <p className="text-xs uppercase tracking-wider text-[#0B7A5C] mb-2 font-mono">01 — Equity-based, not fee-based</p>
              <p className="text-gray-light">
                Build cost is absorbed by the Studio in exchange for revenue share or equity. You contribute
                domain expertise, network access, and operational involvement &mdash; not cash up front.
              </p>
            </div>
            <div className="p-6 bg-gray-dark rounded-lg border-l-4 border-[#1E5AA8]">
              <p className="text-xs uppercase tracking-wider text-[#1E5AA8] mb-2 font-mono">02 — Selective</p>
              <p className="text-gray-light">
                We take on a small number of partnerships per quarter. Each one needs a clear domain insight,
                an operator who can sell into the market, and alignment on long-term direction. We say no often.
              </p>
            </div>
            <div className="p-6 bg-gray-dark rounded-lg border-l-4 border-orange">
              <p className="text-xs uppercase tracking-wider text-orange mb-2 font-mono">03 — Real ownership</p>
              <p className="text-gray-light">
                You&apos;re a co-founder. Your name is on the product. Your relationships drive the GTM.
                Decisions are joint where they should be.
              </p>
            </div>
            <div className="p-6 bg-gray-dark rounded-lg border-l-4 border-[#00d4ff]">
              <p className="text-xs uppercase tracking-wider text-[#00d4ff] mb-2 font-mono">04 — Backed by the Studio portfolio</p>
              <p className="text-gray-light">
                Platform Trust middleware, generator architecture, shared AI infrastructure &mdash; your
                venture inherits all of it from day one. Compliance, observability, billing, RBAC: not
                built from scratch.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is Not For */}
      <section className="section bg-black border-t border-gray-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Who This Is Not For</h2>
          <ul className="space-y-3 text-gray-light mb-6 list-disc list-inside">
            <li>People with an idea but no domain depth</li>
            <li>People looking for hired development at a discount</li>
            <li>People who can&apos;t operate the front of the business</li>
            <li>People expecting a passive equity windfall</li>
          </ul>
          <p className="text-gray-light">
            If &ldquo;I have a great idea but no budget&rdquo; is the pitch &mdash; this isn&apos;t the
            right path. The{' '}
            <Link href="/pricing" className="text-accent hover:underline">pricing page</Link>{' '}
            covers retainer advisory and fixed-price custom builds for people who want to pay cash
            for our time. Studio partnerships are reserved for domain experts who can take a venture
            to market with us.
          </p>
        </div>
      </section>

      {/* Current Studio Activity */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Current Studio Activity</h2>
          <p className="text-gray-light mb-6">
            35+ AI platforms live in production today, across voice AI, agentic systems, multi-tenant
            SaaS, blockchain tokenisation, and MCP integrations. Reference verticals include:
          </p>
          <ul className="space-y-3 text-gray-light mb-6">
            <li>
              <strong className="text-white">TourLingo, GovLingo, HotelLingo, DoctorLingo, EduLingo</strong> &mdash;
              vertical instances of the UniversalLingo translation generator.
            </li>
            <li>
              <strong className="text-white">MMC Build</strong> &mdash; multi-tenant AI platform for Australian
              modular construction.{' '}
              <em className="text-gray-light/70">
                Commercial contract, not equity partnership &mdash; provided here as a build-capability reference.
              </em>
            </li>
            <li>
              <strong className="text-white">Connexions, RaiseReady, Kira</strong> &mdash; voice-discovery
              infrastructure.
            </li>
            <li>
              <strong className="text-white">F2K Fund Tokenisation</strong> &mdash; ERC-3643 wholesale housing
              fund on Ethereum.
            </li>
          </ul>
          <p>
            Full portfolio:{' '}
            <Link href="/marketplace" className="text-accent hover:underline">corporate-ai-solutions.vercel.app/marketplace</Link>
          </p>
        </div>
      </section>

      {/* Apply */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Apply</h2>
          <p className="text-xl text-gray-light mb-8">
            If you&apos;ve ever said <em>&ldquo;someone should really fix that&rdquo;</em> &mdash;
            that someone is you. Tell us about the gap you&apos;ve been watching.
          </p>
          <Button href={FOUNDER.calendly} external variant="orange">
            Apply for a Studio Partnership →
          </Button>
          <p className="text-sm text-gray-light/70 mt-4">
            30-minute discovery call. We&apos;ll know within the first 10 minutes whether the fit is there.
            No pitch deck required.
          </p>
        </div>
      </section>

      {/* Studio FAQ */}
      <section className="section">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="tag tag-center mb-4">Studio FAQ</div>
            <h2>Frequently asked</h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: 'How much equity do partners get?',
                a: 'Typically 10–30%, depending on contribution depth. Pure domain expertise + warm GTM network sits at the lower end; significant operational time investment sits at the higher end. Specific splits are agreed during the discovery process.',
              },
              {
                q: "What if the platform doesn't gain traction?",
                a: "Both sides take that risk. The build cost is the Studio's contribution; your time and network is yours. If the venture doesn't work, neither side owes the other anything. We've structured the model so we both have skin in the game.",
              },
              {
                q: 'How long does a Studio build take?',
                a: 'Most platforms go from concept to live in 7–14 days. Refinement and GTM take longer. The factory model means we ship fast and iterate against real usage.',
              },
              {
                q: 'Can I have multiple Studio partnerships at once?',
                a: "You as a partner can only meaningfully operate one or two ventures well. We're selective on the operator side specifically because the Studio scales — but operator capacity doesn't.",
              },
              {
                q: 'Why the "Studio" name?',
                a: 'Because that\'s what it is. A venture studio that manufactures AI companies at near-zero marginal cost — see Our Thesis for the full model. Partnerships are how new ventures enter the studio.',
              },
              {
                q: 'How is this different from the Custom Build offer on /pricing?',
                a: 'Custom Build is fixed-price commercial work — you pay cash, you own the IP outright, no equity changes hands. Studio Partnership is equity-based co-founding — no cash exchanged for build, you and Dennis co-own the venture going forward. Different commercial structure, different governance, different time commitment.',
              },
              {
                q: 'Can I bring my own existing team?',
                a: 'Yes — domain experts often have networks of advisors, salespeople, or operators they want to bring along. We discuss this during scoping.',
              },
            ].map((item) => (
              <div key={item.q}>
                <h3 className="font-bold mb-2">{item.q}</h3>
                <p className="text-gray-light">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer cross-link */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-6">Other ways to engage</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/marketplace" className="block p-6 bg-black rounded-lg border border-gray-border hover:border-accent transition-colors">
              <p className="font-semibold mb-1">Use platforms →</p>
              <p className="text-xs text-gray-light">Subscribe to existing AI platforms</p>
            </Link>
            <Link href="/pricing" className="block p-6 bg-black rounded-lg border border-gray-border hover:border-accent transition-colors">
              <p className="font-semibold mb-1">Hire on retainer →</p>
              <p className="text-xs text-gray-light">Technical advisory or custom builds</p>
            </Link>
            <Link href="/studio/thesis" className="block p-6 bg-black rounded-lg border border-gray-border hover:border-accent transition-colors">
              <p className="font-semibold mb-1">Read the thesis →</p>
              <p className="text-xs text-gray-light">Understand the long-tail model</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
