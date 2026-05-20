// @explanatory-header-exempt — hand-built dark-theme hero opens with what/what-to-do/why (evidence-only client receipts)
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FOUNDER, SITE } from '@/lib/constants'

const DESCRIPTION =
  'Live commercial engagements. MMC Build (fixed-price contract). LingoPure and PreLabz (Chief Technology Advisor). Receipts, not marketing.'

export const metadata: Metadata = {
  title: 'Clients',
  description: DESCRIPTION,
  openGraph: { title: 'Clients | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Clients | ' + SITE.name, description: DESCRIPTION },
}

export default function ClientsPage() {
  return (
    <>
      {/* Hero — explanatory header in evidence voice */}
      <section className="section bg-grid pt-20 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4">Clients</div>
          <h1 className="mb-6">Active client engagements</h1>
          <p className="text-lg text-gray-light mb-3">
            <strong className="text-white">What this is:</strong> the current commercial contracts and
            advisory positions outside the BYOK Factory portfolio. Receipts for the methodology, not
            customer testimonials.
          </p>
          <p className="text-lg text-gray-light mb-3">
            <strong className="text-white">What you do here:</strong> verify the work shape before
            opening a studio-in-residence conversation. Each entry lists the contract type, scope,
            stack, and dates.
          </p>
          <p className="text-lg text-gray-light">
            <strong className="text-white">Why it matters:</strong> the methodology gets credible
            only through delivered work. These are the deliverables paying for the substrate.
          </p>
        </div>
      </section>

      {/* Engagements grid */}
      <section className="section py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* MMC Build */}
          <div className="bg-gray-dark rounded-lg border-l-4 border-accent p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-accent mb-2 font-mono">Live Commercial Contract</p>
                <h2 className="text-2xl font-bold mb-1">MMC Build</h2>
                <p className="text-sm text-gray-light">Multi-tenant AI platform for Australian modular construction</p>
              </div>
              <div className="text-xs text-gray-light/70 text-right">
                <p>Engagement: 2026 →</p>
                <p>Status: in delivery</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-white mb-2 font-mono">Scope</p>
                <p className="text-sm text-gray-light">
                  Sole developer on a fixed-price contract. Stages 0&ndash;5 shipped in 5 weeks
                  against a 14-week schedule. Agentic compliance + cost-estimation workflows,
                  RAG over project documentation, Stripe per-module billing.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white mb-2 font-mono">Stack</p>
                <p className="text-sm text-gray-light">
                  Next.js, Supabase, Vercel, Anthropic Claude, OpenAI, HuggingFace, ElevenLabs,
                  Stripe. Platform Trust middleware for compliance posture.
                </p>
              </div>
            </div>
          </div>

          {/* LingoPure */}
          <a
            href="https://lingopure.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-dark rounded-lg border-l-4 border-blue-400 p-8 hover:bg-gray-dark/70 transition-colors group"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-blue-400 mb-2 font-mono inline-flex items-center gap-2">
                  Chief Technology Advisor
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <h2 className="text-2xl font-bold mb-1">LingoPure</h2>
                <p className="text-sm text-gray-light">AI voice tutoring platform</p>
              </div>
              <div className="text-xs text-gray-light/70 text-right">
                <p>Engagement: 2026 →</p>
                <p>Status: ongoing advisory</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-white mb-2 font-mono">Scope</p>
                <p className="text-sm text-gray-light">
                  Architecture, AI stack design, and technical execution guidance for the AI voice
                  tutoring platform. Strategic input on model selection, voice agent provisioning,
                  and product-shape decisions.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white mb-2 font-mono">Site</p>
                <p className="text-sm text-blue-400 inline-flex items-center gap-1">
                  lingopure.com <ExternalLink size={12} />
                </p>
              </div>
            </div>
          </a>

          {/* PreLabz */}
          <a
            href="https://prelabz.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gray-dark rounded-lg border-l-4 border-orange p-8 hover:bg-gray-dark/70 transition-colors group"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-orange mb-2 font-mono inline-flex items-center gap-2">
                  Chief Technology Advisor
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <h2 className="text-2xl font-bold mb-1">PreLabz</h2>
                <p className="text-sm text-gray-light">Pre-seed &rarr; Series A investor-readiness venture studio</p>
              </div>
              <div className="text-xs text-gray-light/70 text-right">
                <p>Engagement: 2026 →</p>
                <p>Status: ongoing advisory</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-white mb-2 font-mono">Scope</p>
                <p className="text-sm text-gray-light">
                  Technical evaluation and architecture review across portfolio ventures. Pre-funding
                  due-diligence assessments, AI-stack risk surfacing for incoming portfolio
                  companies.
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-white mb-2 font-mono">Site</p>
                <p className="text-sm text-orange inline-flex items-center gap-1">
                  prelabz.com <ExternalLink size={12} />
                </p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Bridge to engagement */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Looking for the same kind of work, programmatically?</h2>
          <p className="text-lg text-gray-light mb-8">
            These engagements are bespoke. The BYOK Factory&apos;s repeatable shape is the
            studio-in-residence engagement &mdash; the methodology installed inside your studio
            or accelerator across one cohort. Two slots per year, by application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button href="/engagement" variant="orange">
              Studio in Residence <ArrowRight size={16} />
            </Button>
            <a
              href={FOUNDER.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
            >
              <Calendar size={16} /> Book a discovery call
            </a>
            <Link href="/about" className="text-gray-light hover:text-white underline underline-offset-4">
              About the founder
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
