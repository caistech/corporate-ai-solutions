// @explanatory-header-exempt — hand-built dark-theme hero opens with what/what-to-do/why; full <ExplanatoryHeader/> would clash with the theme
import { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Users, Building2, Briefcase, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FOUNDER, SITE, SKOOL, PLATFORMS } from '@/lib/constants'

const DESCRIPTION =
  'Free with BYOK for every marketplace product. Studio-in-residence engagements from $65k/mo. Technical advisory from $15k/mo. Custom platform builds by negotiation.'

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
          <h1 className="mb-6">Four ways to work with Corporate AI Solutions</h1>
          <p className="text-xl text-gray-light">
            Use any of the {PLATFORMS.length} platforms self-serve on your own keys (BYOK).
            Bring the factory into your studio. Retain ongoing technical leadership.
            Commission a custom platform end-to-end.
          </p>
        </div>
      </section>

      {/* BYOK-first explainer */}
      <section className="section bg-black border-y border-accent/20 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <Rocket className="text-accent flex-shrink-0 mt-1" size={28} />
            <div>
              <h2 className="text-2xl font-bold mb-2">Free with BYOK</h2>
              <p className="text-gray-light mb-3">
                Every product in the marketplace is <strong className="text-white">free</strong>
                {' '}if you bring your own keys and run on your own infrastructure. Clone the repo,
                deploy to your own Vercel, drop in your Anthropic / Supabase / Stripe / ElevenLabs
                keys, walk the setup wizard. No subscription. No credit cards.
              </p>
              <p className="text-gray-light mb-3">
                No managed-for-you secret &mdash; every key is yours. No CAS-owned fallback.
                Your data, your infrastructure, your control.
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button href="/marketplace" variant="primary">
                  Browse the Marketplace
                </Button>
                <Button href="/marketplace/cqr" variant="secondary">
                  See CQR &mdash; the first BYOK release
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three tier cards */}
      <section className="section bg-gray-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-orange font-medium mb-3 uppercase text-xs tracking-wider">Paid engagements</p>
            <h2 className="text-3xl font-bold mb-2">Three ways the factory ships work for you</h2>
            <p className="text-gray-light">Pick the engagement that matches the stage you&apos;re at.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1 — Free Community */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-[#0B7A5C] p-8">
              <div className="flex items-center gap-2 mb-3">
                <Users className="text-[#0B7A5C]" size={20} />
                <p className="text-xs uppercase tracking-wider text-[#0B7A5C] font-mono">Community</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-3xl font-bold mb-4">Free</p>
              <p className="text-gray-light mb-6">
                Join The Easily Distracted. Share problems, find collaborators, watch builds in public.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-8 flex-1">
                <li>&middot; Skool community access</li>
                <li>&middot; Share ideas and problems</li>
                <li>&middot; Find potential collaborators</li>
                <li>&middot; Learn in public from {PLATFORMS.length} live AI builds</li>
                <li>&middot; No commitment, no upsell</li>
              </ul>
              <Button href={SKOOL.url} external variant="secondary" fullWidth>
                Join Free →
              </Button>
            </div>

            {/* Card 2 — Studio in Residence (ANCHOR) */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-orange p-8 relative">
              <div className="absolute -top-3 right-4 bg-orange text-black text-xs font-bold px-3 py-1 rounded">
                Anchor offer
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="text-orange" size={20} />
                <p className="text-xs uppercase tracking-wider text-orange font-mono">Studio in Residence</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">In-Residence Engagement</h3>
              <p className="text-3xl font-bold mb-4">
                $65,000<span className="text-base text-gray-light font-normal"> / month</span>
              </p>
              <p className="text-gray-light mb-3">
                Three or six months. I come into your studio, accelerator, or dev shop,
                install the BYOK Factory substrate, ship v0.1 BYOK-first for each cohort company,
                and leave your team running the factory.
              </p>
              <p className="text-sm italic text-gray-light/80 mb-4">
                Best fit: studios / accelerators / dev shops with a defined cohort wanting to
                ship multiple portfolio companies BYOK-first inside one engagement window.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>&middot; Substrate install: auth pattern, bootstrap automation, customised CLAUDE.md, voice standard</li>
                <li>&middot; Anchor cohort company shipped to v0.1 in week 2&ndash;3</li>
                <li>&middot; Remaining cohort shipped through the engagement window</li>
                <li>&middot; Public Factory Floor essay + joint case study (consent-clause mandatory)</li>
                <li>&middot; Hybrid shape available &mdash; lower studio base + cohort companies cover fractional CTO retainers</li>
                <li>&middot; 1&ndash;3% equity in host (per Rule 7 cap, per counterparty)</li>
              </ul>
              <p className="text-xs text-gray-light/70 mb-6">
                2 engagements/year by application. Windows: Jan&ndash;Mar and Jul&ndash;Sep. Pipeline opens 3 months ahead.
              </p>
              <Button href="/engagement" variant="orange" fullWidth>
                See engagement details →
              </Button>
            </div>

            {/* Card 3 — Technical Advisory */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-[#1E5AA8] p-8">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="text-[#1E5AA8]" size={20} />
                <p className="text-xs uppercase tracking-wider text-[#1E5AA8] font-mono">Technical Advisory</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">Retainer</h3>
              <p className="text-3xl font-bold mb-4">
                From $15,000<span className="text-base text-gray-light font-normal"> / month</span>
              </p>
              <p className="text-gray-light mb-3">
                A monthly retainer for ongoing technical leadership. Architecture, AI stack decisions, code review,
                build acceleration, and the technical conversations your team needs to have but hasn&apos;t yet.
                Lighter touch than an in-residence engagement.
              </p>
              <p className="text-sm italic text-gray-light/80 mb-4">
                Best fit: AI-native startups pre-Series A, founders evaluating technical decisions before raising,
                teams scaling beyond their first engineer.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>&middot; 1:1 sessions on your stack, your code, your architecture</li>
                <li>&middot; AI stack selection &mdash; model choice, vendor risk, fallback strategy, agent vs. platform decisions</li>
                <li>&middot; Architecture review against investor due-diligence standards</li>
                <li>&middot; Direct access to my production playbook from {PLATFORMS.length} live AI platforms</li>
                <li>&middot; Compliance-by-design baked in (Australian Privacy Act, OWASP, SOC 2 &mdash; via Platform Trust)</li>
                <li>&middot; Available remote in AU/SE Asia time zones</li>
              </ul>
              <p className="text-xs text-gray-light/70 mb-6">
                Currently: Chief Technology Advisor at LingoPure (AI voice tutoring) and PreLabz
                (venture studio, pre-seed &rarr; Series A). See <Link href="/clients" className="text-accent hover:underline">clients</Link>.
              </p>
              <Button href={FOUNDER.calendly} external variant="primary" fullWidth>
                Book a Discovery Call →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Build section (standalone) */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-b from-gray-dark to-black rounded-lg border border-gray-border p-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="text-accent" size={28} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-accent font-mono mb-2">Custom Platform Build</p>
                <h2 className="text-2xl font-bold mb-2">A bespoke AI platform, shipped end-to-end</h2>
                <p className="text-3xl font-bold mb-3">By negotiation</p>
              </div>
            </div>
            <p className="text-gray-light mb-3">
              End-to-end ownership of a new AI-native platform &mdash; schema through to deployment.
              Fixed-price commercial contracts, scoped to your problem, delivered solo on the
              Corporate AI Solutions stack. Different from studio-in-residence: one platform, one
              counterparty, one delivered system.
            </p>
            <p className="text-sm italic text-gray-light/80 mb-6">
              Best fit: companies that need a real production AI platform shipped fast, not a
              prototype or a pitch-deck demo.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <ul className="space-y-2 text-sm text-gray-light">
                <li>&middot; Solo-delivered, end-to-end build</li>
                <li>&middot; Stack: Next.js, Supabase, Vercel, Anthropic Claude, OpenAI, ElevenLabs, MCP, Stripe</li>
                <li>&middot; Multi-tenant SaaS, agentic workflows, voice AI, RAG, compliance, billing</li>
                <li>&middot; Platform Trust middleware included for SOC 2 / OWASP / Australian Privacy Act posture</li>
                <li>&middot; {PLATFORMS.length} delivered platforms as portfolio evidence</li>
              </ul>
              <div className="text-sm text-gray-light">
                <p className="mb-2 text-white font-medium">Reference engagement</p>
                <p className="mb-2">
                  <strong className="text-white">MMC Build</strong> &mdash; multi-tenant AI for
                  Australian modular construction. Multi-model AI architecture, agentic
                  compliance + cost-estimation workflows, Stripe billing.
                </p>
                <p className="mb-2">
                  Stages 0&ndash;5 delivered in 5 weeks against an original 14-week schedule.
                </p>
                <p className="text-xs text-gray-light/70">
                  <Link href="/clients" className="text-accent hover:underline">See clients</Link>
                  {' '}for full scope.
                </p>
              </div>
            </div>
            <p className="text-xs italic text-gray-light/60 mb-6">
              Pricing is by negotiation, scoped to your specific problem. Discovery call first to understand
              the gap before any quote.
            </p>
            <Button href={FOUNDER.calendly} external variant="primary">
              Book a Discovery Call →
            </Button>
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
                <strong className="text-white">No equity-only work as a hired service.</strong> Cash floor is the cash floor &mdash; cash funds the portfolio
                that funds the engagements. Equity layers on top of cash retainers, never replaces them.
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
            <div className="p-5 rounded-lg border-l-4 border-gray-border bg-gray-dark/50">
              <p className="text-gray-light">
                <strong className="text-white">No managed-for-you secrets.</strong> Every BYOK product
                runs on the user&apos;s own keys. No CAS-owned fallback. If you want a hosted service
                where I manage your AI provider keys, look elsewhere &mdash; that&apos;s deliberately
                not what this is.
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
                q: "What's the difference between Studio in Residence and Technical Advisory?",
                a: 'Studio in Residence is a fixed 3 or 6-month intensive engagement where I install the BYOK Factory substrate inside your studio/accelerator and help ship multiple cohort companies. Technical Advisory is an ongoing monthly retainer for strategic input on architecture and AI stack decisions on your existing or new platform — lighter touch, longer term. The two can be combined.',
              },
              {
                q: 'How is the technical advisory retainer structured?',
                a: '$15k/month minimum, three-month initial commitment, monthly thereafter. Includes a defined number of strategic sessions per month plus async availability for architecture and AI stack questions. Specific cadence is set during the discovery call based on your stage.',
              },
              {
                q: 'Can I do advisory plus a custom build at the same time?',
                a: "Yes — they're separate engagements with separate scopes. The advisory retainer covers technical guidance for your team; a custom build is me delivering a specific platform end-to-end. The two can be combined.",
              },
              {
                q: "What's the minimum custom build size?",
                a: 'Most custom builds start in the AUD $80k+ range. Smaller scope work (one specific feature, one specific integration) is usually better served as advisory hours — but the right scope at the right size is always worth a conversation.',
              },
              {
                q: 'How does BYOK work for the marketplace products?',
                a: 'Every product in the marketplace ships as a public template repo with a Vercel Deploy button. You click Deploy, Vercel forks the repo into your GitHub, prompts you for each required API key (Anthropic, Supabase, etc.), and deploys. You run it on your own keys and infrastructure. There is no managed-for-you fallback. CQR is the first product in this shape — see /marketplace/cqr.',
              },
              {
                q: 'Do you sub-contract or hire other developers?',
                a: "No. Solo end-to-end is the operating model, and it's why builds ship fast. You get the same person from schema design through to deployment.",
              },
              {
                q: 'Do you take equity instead of cash?',
                a: 'Equity-only work as a hired service is closed. Open to discussing equity alongside a cash retainer for advisory or in-residence engagements where there\'s strong long-term alignment. Equity ceiling is 3% per counterparty per Rule 7 of the operating rules.',
              },
              {
                q: 'What time zones do you work in?',
                a: 'Remote-only, AU/SE Asia working hours (AEST, ICT, SGT, MYT). Based in Fortitude Valley, QLD, Australia.',
              },
              {
                q: 'How fast can you start?',
                a: 'Advisory retainers can usually start within 1–2 weeks of the discovery call. Studio-in-Residence engagements run in fixed Jan-Mar and Jul-Sep windows; pipeline opens 3 months ahead of each window. Custom builds depend on current commitments and scope — discussed during discovery.',
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
            <Button href={FOUNDER.calendly} external>
              <Calendar size={18} className="mr-2 inline" /> Book a Discovery Call →
            </Button>
            <Button href={SKOOL.url} external variant="secondary">
              Join the Community Free →
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
