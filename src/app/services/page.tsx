// @explanatory-header-exempt — hand-built dark-theme hero opens with what / what to do / why it
// matters, matching the /pricing and /engagement precedent; a full <ExplanatoryHeader/> would
// clash with the theme.
import { Metadata } from 'next'
import Link from 'next/link'
import { Search, Rocket, RefreshCw, ShieldCheck, FileText, Mic, CreditCard, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FOUNDER, SITE, PLATFORMS } from '@/lib/constants'

const DESCRIPTION =
  'Fixed-price AI builds for Australian businesses. A one-week Opportunity Audit for $2,500 + GST, ' +
  'or a three-week Deployment Sprint for $18,000 + GST that puts one AI system into your production ' +
  'environment. You own it outright.'

export const metadata: Metadata = {
  title: 'Services',
  description: DESCRIPTION,
  openGraph: { title: 'Services | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Services | ' + SITE.name, description: DESCRIPTION },
}

const SUBSTRATE = [
  {
    icon: KeyRound,
    title: 'Identity & access',
    body: 'Sign-in, password reset, team roles, invitations, admin separation. One hardened component, used across every build.',
  },
  {
    icon: Mic,
    title: 'Voice',
    body: 'Conversational agents with persistent memory, so the system remembers what you told it last week. Not a chatbot.',
  },
  {
    icon: FileText,
    title: 'Documents',
    body: 'PDF and scan extraction into structured, checkable data — approvals, certificates, invoices, plans.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance',
    body: 'Australian Spam Act email, ABN lookup, sanctions screening, audit logging, privacy surfaces. Built in, not bolted on.',
  },
  {
    icon: CreditCard,
    title: 'Billing',
    body: 'Subscriptions, usage metering, caps and invoicing — if the thing you are building needs to charge someone.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety rails',
    body: 'Prompt-injection guards, red-team probes and a kill switch, because an agent with access to your systems needs a brake.',
  },
]

const SPRINT_WEEKS = [
  {
    label: 'Week 1 — Scope',
    body: 'I sit with whoever actually does the work, not just whoever signs. We agree the one system being built and write down what "done" means. Nothing after this is a surprise.',
  },
  {
    label: 'Week 2 — Build',
    body: 'It goes up on a private link around day eight, and you use it while it is still being built. Feedback lands the same day.',
  },
  {
    label: 'Week 3 — Deploy',
    body: 'Into your environment, on your accounts, with your team trained on it. Written handover. You can fire me and keep everything.',
  },
  {
    label: 'If it slips',
    body: 'Fixed price means fixed price. An overrun is mine, not yours.',
  },
]

export default function ServicesPage() {
  const auditMailto = `mailto:${SITE.email}?subject=Opportunity Audit enquiry`

  return (
    <>
      {/* Hero — the thesis */}
      <section className="section bg-grid pt-20 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="tag tag-center mb-4">Services &middot; Australian businesses</div>
          <h1 className="mb-6">
            Three weeks, because I&apos;m not building the plumbing.
          </h1>
          <p className="text-xl text-gray-light mb-4">
            Most AI projects spend their first two months on the parts nobody sees — authentication,
            permissions, billing, document handling, voice, audit logging, compliance. I finished
            those two years ago.{' '}
            <strong className="text-white">53 shared code packages, already written, already running.</strong>
          </p>
          <p className="text-base text-gray-light">
            So the clock starts on your actual problem, not the scaffolding around it.
          </p>
        </div>
      </section>

      {/* The three tiers */}
      <section className="section bg-gray-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-accent font-medium mb-3 uppercase text-xs tracking-wider">How it works</p>
            <h2 className="text-3xl font-bold mb-2">Start with a paid week that ends in something you can use.</h2>
            <p className="text-gray-light max-w-2xl mx-auto">
              Most people would rather not commit to an AI build before they have seen one work.
              So the entry point is a single week with a real deliverable — and if you go ahead
              with the full build, it costs you nothing.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Tier 1 — the entry point */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-accent p-8 relative">
              <div className="absolute -top-3 right-4 bg-accent text-black text-xs font-bold px-3 py-1 rounded">
                Start here
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Search className="text-accent" size={20} />
                <p className="text-xs uppercase tracking-wider text-accent font-mono">One week</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">Opportunity Audit</h3>
              <p className="text-3xl font-bold mb-4">
                $2,500<span className="text-base text-gray-light font-normal"> + GST</span>
              </p>
              <p className="text-gray-light mb-3">
                One week. I map where your hours actually go, rank the best automation targets,
                and build one of them so you can click it.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>&middot; Your process mapped — where the hours actually go</li>
                <li>&middot; The three best automation targets, costed and ranked</li>
                <li>&middot; One of them built as a working prototype, not a slide</li>
                <li>&middot; A straight answer on whether the full build is worth it</li>
              </ul>
              <p className="text-sm text-gray-light mb-6">
                Credited in full against a Sprint booked within 30 days.
              </p>
              <Button href={FOUNDER.calendly} external variant="primary" fullWidth>
                Book a call &rarr;
              </Button>
            </div>

            {/* Tier 2 — the money */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-orange p-8">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="text-orange" size={20} />
                <p className="text-xs uppercase tracking-wider text-orange font-mono">Three weeks</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">Deployment Sprint</h3>
              <p className="text-3xl font-bold mb-4">
                $18,000<span className="text-base text-gray-light font-normal"> + GST</span>
              </p>
              <p className="text-gray-light mb-3">
                One AI system, running in your production environment, that you own outright.
                Fixed scope, fixed price, fixed end date.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>&middot; Built on your accounts, in your environment</li>
                <li>&middot; You own the code — no licence, no lock-in</li>
                <li>&middot; Usable on a private link from about day eight</li>
                <li>&middot; Written handover and your team trained on it</li>
              </ul>
              <p className="text-sm text-gray-light mb-6">
                50% on signature, 50% on delivery. Two slots a month.
              </p>
              <Button href={FOUNDER.calendly} external variant="orange" fullWidth>
                Book a call &rarr;
              </Button>
            </div>

            {/* Tier 3 — the recurring */}
            <div className="flex flex-col bg-black rounded-lg border-t-4 border-[#1E5AA8] p-8">
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="text-[#1E5AA8]" size={20} />
                <p className="text-xs uppercase tracking-wider text-[#1E5AA8] font-mono">Rolling</p>
              </div>
              <h3 className="text-2xl font-bold mb-2">Run &amp; Extend</h3>
              <p className="text-3xl font-bold mb-4">
                $3,500<span className="text-base text-gray-light font-normal"> / month + GST</span>
              </p>
              <p className="text-gray-light mb-3">
                I keep it running, fix what breaks, and keep building on top of it.
                Month to month, 30 days notice either way.
              </p>
              <ul className="space-y-2 text-sm text-gray-light mb-4 flex-1">
                <li>&middot; Monitoring, fixes and version upgrades</li>
                <li>&middot; Continuous build on what is already there</li>
                <li>&middot; Direct access — you talk to the person who built it</li>
                <li>&middot; Cancel any month without penalty</li>
              </ul>
              <p className="text-sm text-gray-light mb-6">
                Optional. Offered at handover, never a condition of it.
              </p>
              <Button href={FOUNDER.calendly} external variant="secondary" fullWidth>
                Book a call &rarr;
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why it's faster — the substrate */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-accent font-medium mb-3 uppercase text-xs tracking-wider">Why it&apos;s faster</p>
            <h2 className="text-3xl font-bold mb-3">The parts are already made.</h2>
            <p className="text-gray-light max-w-2xl">
              An agency quoting against this starts from an empty folder every time, which is why
              their number has a two in front of it and their timeline is in quarters. I start from
              an inventory — and everything below is already running in production across{' '}
              {PLATFORMS.length} platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBSTRATE.map((item) => (
              <div
                key={item.title}
                className="bg-gray-dark rounded-lg border border-gray-border p-6"
              >
                <item.icon className="text-accent mb-3" size={22} />
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-light">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="text-gray-light mt-8 max-w-2xl">
            Your project inherits all of it on day one. See{' '}
            <Link href="/clients" className="text-accent hover:underline">who I have built for</Link>{' '}
            and{' '}
            <Link href="/marketplace" className="text-accent hover:underline">what has been shipped</Link>.
          </p>
        </div>
      </section>

      {/* How a sprint runs */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-orange font-medium mb-3 uppercase text-xs tracking-wider">How a sprint runs</p>
            <h2 className="text-3xl font-bold mb-3">Three weeks, and you know what happens in each.</h2>
          </div>

          <div className="space-y-6">
            {SPRINT_WEEKS.map((week) => (
              <div
                key={week.label}
                className="grid md:grid-cols-[12rem_1fr] gap-2 md:gap-6 pb-6 border-b border-gray-border last:border-b-0"
              >
                <p className="text-sm font-mono uppercase tracking-wider text-orange">{week.label}</p>
                <p className="text-gray-light">{week.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A worked example.
          The page was excellent on HOW the work runs and silent on WHAT gets built. A buyer persona
          read the whole thing and his one remaining question — "what would you actually build for a
          firm like mine?" — was answered nowhere on the site. This is the paragraph that turns the
          pitch into something he can picture on Monday. */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-accent font-medium mb-3 uppercase text-sm tracking-wider">
              What it looks like
            </p>
            <h2 className="text-3xl font-bold mb-3">
              A sprint against a quoting process, start to finish.
            </h2>
            <p className="text-gray-light max-w-2xl">
              This is the shape most often. Your details will differ; the sequence usually does not.
            </p>
          </div>

          <div className="card p-8 space-y-6">
            <div>
              <h3 className="font-bold text-white mb-2">Where it starts</h3>
              <p className="text-gray-light">
                A contracting business, forty staff. One estimator spends about two days a week
                turning site notes, supplier prices and a rate sheet into a quote. Every quote is
                assembled by hand in a spreadsheet, and a variation means doing most of it again.
                Nobody thinks this is a technology problem — they think it is just how quoting works.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">Week one</h3>
              <p className="text-gray-light">
                I sit with the estimator and watch a real quote get built, end to end, without
                helping. That is where the hours actually are — usually not where anyone expects. In
                this shape, roughly half is re-keying numbers that already exist somewhere else, and
                a third is chasing a supplier price that was current last month.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">Weeks two and three</h3>
              <p className="text-gray-light">
                What gets built is unglamorous and specific: the rate sheet becomes the single source
                of prices, site notes go in once, and the quote assembles itself into your existing
                template — your wording, your terms, your logo. A variation reuses the original
                instead of restarting it. The estimator still decides every number; the system stops
                asking him to type them twice.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-white mb-2">What changes</h3>
              <p className="text-gray-light">
                The two days becomes a few hours, and quotes go out the same week rather than the
                next one — which in most trades matters more than the hours saved. It runs on your
                infrastructure, and you own it outright.
              </p>
            </div>

            <p className="text-sm text-gray-light border-t border-gray-700 pt-5">
              This is an illustration of the shape, not a case study or a promise of a particular
              result. The audit exists to tell you what your own numbers are before you commit to the
              sprint — and if they do not justify it, it will say so.
            </p>
          </div>
        </div>
      </section>

      {/* Fit — who it isn't for */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <p className="text-accent font-medium mb-3 uppercase text-sm tracking-wider">Fit</p>
            <h2 className="text-3xl font-bold mb-3">Who this works for, and who it doesn&apos;t.</h2>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-[12rem_1fr] gap-2 md:gap-6 pb-6 border-b border-gray-border">
              <p className="text-sm font-mono uppercase tracking-wider text-accent">Good fit</p>
              <p className="text-gray-light">
                An established business with a process that eats hours every week — quoting,
                compliance paperwork, intake, reporting, follow-up — and someone who can say yes
                without a committee.
              </p>
            </div>
            <div className="grid md:grid-cols-[12rem_1fr] gap-2 md:gap-6 pb-6 border-b border-gray-border">
              <p className="text-sm font-mono uppercase tracking-wider text-gray-light">Poor fit</p>
              <p className="text-gray-light">
                &ldquo;We should do something with AI.&rdquo; If there is no specific process losing
                you specific hours, the audit will tell you that in week one, and I would rather it did.
              </p>
            </div>
            <div className="grid md:grid-cols-[12rem_1fr] gap-2 md:gap-6">
              <p className="text-sm font-mono uppercase tracking-wider text-gray-light">Not offered</p>
              <p className="text-gray-light">
                Staff augmentation, day rates, or open-ended retainers with no deliverable.
                The work is scoped or it is not taken.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-grid pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start with a fifteen-minute call.</h2>
          <p className="text-gray-light mb-8">
            Tell me what the process is and roughly how many hours a week it costs you. If I
            can&apos;t see a way to make it materially better, I&apos;ll say so on the call and it
            costs you nothing.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button href={FOUNDER.calendly} external variant="primary">
              Book a call &rarr;
            </Button>
            <Button href={auditMailto} external variant="secondary">
              Email me
            </Button>
          </div>
          <p className="text-sm text-gray-light mt-8">
            All prices exclude GST. {SITE.company} &middot; ABN {SITE.abn} &middot; Australian clients.
          </p>
        </div>
      </section>
    </>
  )
}
