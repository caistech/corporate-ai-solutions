import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FOUNDER, SITE, SKOOL } from '@/lib/constants'

const DESCRIPTION =
  'Technical advisory from $15k/mo. Custom AI platform builds by negotiation. 35+ live AI platforms as portfolio evidence.'

export const metadata: Metadata = {
  title: 'Pricing',
  description: DESCRIPTION,
  openGraph: { title: 'Pricing | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Pricing | ' + SITE.name, description: DESCRIPTION },
}

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-4xl mx-auto text-center">
          <div className="tag tag-center mb-4">Pricing</div>
          <h1 className="mb-6">Three ways to work with Corporate AI Solutions</h1>
          <p className="text-xl text-gray-light">
            Use the platforms self-serve, retain me as your technical advisor, or commission a custom build.
            Choose the engagement that matches the stage you&apos;re at.
          </p>
          <p className="text-sm text-gray-light/70 mt-4">
            Looking for the equity-based co-founder model? See{' '}
            <Link href="/studio/partner" className="text-accent hover:underline">
              Studio partnerships
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Three tier cards */}
      <section className="section bg-gray-dark">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1 — Free Community */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-[#0B7A5C] p-8">
              <div className="flex items-center gap-2 mb-3">
                <Users className="text-[#0B7A5C]" size={20} />
                <p className="text-xs uppercase tracking-wider text-[#0B7A5C] font-mono">Community</p>
              </div>
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <p className="text-3xl font-bold mb-4">Free</p>
              <p className="text-gray-light mb-6">
                Join The Easily Distracted. Share problems, find collaborators, watch builds in public.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-8 flex-1">
                <li>• Skool community access</li>
                <li>• Share ideas and problems</li>
                <li>• Find potential collaborators</li>
                <li>• Learn in public from 35+ live AI builds</li>
                <li>• No commitment, no upsell</li>
              </ul>
              <Button href={SKOOL.url} external variant="secondary" fullWidth>
                Join Free →
              </Button>
            </div>

            {/* Card 2 — Technical Advisory */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-[#1E5AA8] p-8 relative">
              <div className="absolute -top-3 right-4 bg-[#1E5AA8] text-white text-xs font-bold px-3 py-1 rounded">
                Anchor offer
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-[#1E5AA8]" size={20} />
                <p className="text-xs uppercase tracking-wider text-[#1E5AA8] font-mono">Technical Advisory</p>
              </div>
              <h2 className="text-2xl font-bold mb-2">Retainer</h2>
              <p className="text-3xl font-bold mb-4">
                From $15,000<span className="text-base text-gray-light font-normal"> / month</span>
              </p>
              <p className="text-gray-light mb-3">
                A monthly retainer for ongoing technical leadership. Architecture, AI stack decisions, code review,
                build acceleration, and the technical conversations your team needs to have but hasn&apos;t yet.
              </p>
              <p className="text-sm italic text-gray-light/80 mb-4">
                Best fit: AI-native startups pre-Series A, founders evaluating technical decisions before raising,
                teams scaling beyond their first engineer.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>• 1:1 sessions on your stack, your code, your architecture</li>
                <li>• AI stack selection &mdash; model choice, vendor risk, fallback strategy, agent vs. platform decisions</li>
                <li>• Architecture review against investor due-diligence standards</li>
                <li>• Direct access to my production playbook from 35+ live AI platforms</li>
                <li>• Compliance-by-design baked in (Australian Privacy Act, OWASP, SOC 2 &mdash; via Platform Trust)</li>
                <li>• Available remote in AU/SE Asia time zones</li>
              </ul>
              <p className="text-xs text-gray-light/70 mb-6">
                Currently: Chief Technology Advisor at LingoPure (AI voice tutoring) and PreLabz
                (venture studio, pre-seed &rarr; Series A).
              </p>
              <Button href={FOUNDER.calendly} external variant="primary" fullWidth>
                Book a Discovery Call →
              </Button>
            </div>

            {/* Card 3 — Custom Platform Build */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-orange p-8">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="text-orange" size={20} />
                <p className="text-xs uppercase tracking-wider text-orange font-mono">Custom Build</p>
              </div>
              <h2 className="text-2xl font-bold mb-2">Platform</h2>
              <p className="text-3xl font-bold mb-4">By Negotiation</p>
              <p className="text-gray-light mb-3">
                End-to-end ownership of a new AI-native platform &mdash; schema through to deployment.
                Fixed-price commercial contracts, scoped to your problem, delivered solo on the
                Corporate AI Solutions stack.
              </p>
              <p className="text-sm italic text-gray-light/80 mb-4">
                Best fit: companies who need a real production AI platform shipped fast, not a
                prototype or a pitch-deck demo.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>• Solo-delivered, end-to-end build</li>
                <li>• Stack: Next.js, Supabase, Vercel, Anthropic Claude, OpenAI, ElevenLabs, MCP, Stripe</li>
                <li>• Multi-tenant SaaS, agentic workflows, voice AI, RAG, compliance, billing &mdash; whatever the platform needs</li>
                <li>• Platform Trust middleware included for SOC 2 / OWASP / Australian Privacy Act posture</li>
                <li>• 35+ delivered platforms as portfolio evidence</li>
              </ul>
              <p className="text-xs text-gray-light/70 mb-2">
                Reference engagement: <strong className="text-white">MMC Build</strong> &mdash; multi-tenant AI
                for Australian modular construction. Multi-model AI architecture, agentic compliance + cost-estimation
                workflows, Stripe billing. Stages 0&ndash;5 delivered in 5 weeks against an original 14-week schedule.
              </p>
              <p className="text-xs italic text-gray-light/60 mb-6">
                Pricing is by negotiation, scoped to your specific problem. Discovery call first to understand
                the gap before any quote.
              </p>
              <Button href={FOUNDER.calendly} external variant="orange" fullWidth>
                Book a Discovery Call →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* What I won't do */}
      <section className="section bg-black border-t border-gray-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-2">What I won&apos;t do</h2>
          <p className="text-gray-light mb-8">Just as important as what I will:</p>
          <div className="space-y-5">
            <div className="p-5 rounded-lg border-l-4 border-gray-border bg-gray-dark/50">
              <p className="text-gray-light">
                <strong className="text-white">No free rev-share builds as a hired service.</strong> I used to offer
                custom development in exchange for equity. As a <em>hired service</em>, that&apos;s closed.
                If you have deep industry expertise and want to co-build a vertical with me as a domain
                co-founder, that&apos;s a separate partnership track under the Studio &mdash; different fit,
                different terms,{' '}
                <Link href="/studio/partner" className="text-accent hover:underline">selective</Link>.
              </p>
            </div>
            <div className="p-5 rounded-lg border-l-4 border-gray-border bg-gray-dark/50">
              <p className="text-gray-light">
                <strong className="text-white">No &ldquo;AI agency&rdquo; framing.</strong> I work solo,
                end-to-end. No PMs, no offshore dev pool, no account managers. If you want a 12-person team
                and a Gantt chart, I&apos;m not the fit.
              </p>
            </div>
            <div className="p-5 rounded-lg border-l-4 border-gray-border bg-gray-dark/50">
              <p className="text-gray-light">
                <strong className="text-white">No retainer-creep.</strong> Advisory retainers are for ongoing
                strategic input, not for me to disappear into your codebase as a hidden FTE. If a project
                needs build work, we scope it as a Custom Build separately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="tag tag-center mb-4">FAQ</div>
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {[
              {
                q: 'How is the advisory retainer structured?',
                a: '$15k/month minimum, three-month initial commitment, monthly thereafter. Includes a defined number of strategic sessions per month plus async availability for architecture and AI stack questions. Specific cadence is set during the discovery call based on your stage.',
              },
              {
                q: 'Can I do advisory plus custom build at the same time?',
                a: "Yes — they're separate engagements with separate scopes. The advisory retainer covers technical guidance for your team; a custom build is me delivering a specific platform end-to-end. The two can be combined.",
              },
              {
                q: "What's the minimum custom build size?",
                a: 'Most custom builds start in the AUD $80k+ range. Smaller scope work (one specific feature, one specific integration) is usually better served as advisory hours — but the right scope at the right size is always worth a conversation.',
              },
              {
                q: 'Do you sub-contract or hire other developers?',
                a: "No. Solo end-to-end is the operating model, and it's why builds ship fast. You get the same person from schema design through to deployment.",
              },
              {
                q: 'What about the 35+ platforms — can I subscribe to them?',
                a: 'Yes — pricing for each platform sits on the individual product page. Some are free, some are paid, all are live. Browse the marketplace to find what\'s relevant.',
              },
              {
                q: 'Do you take equity instead of cash?',
                a: 'Equity-only work as a hired service is closed. Open to discussing equity alongside a cash retainer for advisory engagements where there\'s strong long-term alignment. Pure equity partnerships (no cash, you bring domain expertise) live under the Studio — different track.',
              },
              {
                q: 'What time zones do you work in?',
                a: 'Remote-only, AU/SE Asia working hours (AEST, ICT, SGT, MYT). Based in Fortitude Valley, QLD, Australia.',
              },
              {
                q: 'How fast can you start?',
                a: 'Advisory retainers can usually start within 1–2 weeks of the discovery call. Custom builds depend on current commitments and scope — discussed during discovery.',
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

      {/* Footer CTA */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Still have questions?</h2>
          <p className="text-gray-light mb-8">
            30 minutes, no pressure.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button href={FOUNDER.calendly} external>Book a Discovery Call →</Button>
            <Button href={SKOOL.url} external variant="secondary">
              Join the Community Free →
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
