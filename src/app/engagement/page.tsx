// @explanatory-header-exempt — Wave 2/3 transitional surface; hand-built dark-theme hero covers R3 intent. Full inquiry form ships in Wave 3.
import { Metadata } from 'next'
import Link from 'next/link'
import { FOUNDER, SITE } from '@/lib/constants'

const DESCRIPTION =
  'Studio-in-residence engagements. The BYOK Factory installed inside your studio or accelerator for one cohort. 2 engagements per year. By application.'

export const metadata: Metadata = {
  title: 'Studio in Residence',
  description: DESCRIPTION,
  openGraph: { title: 'Studio in Residence | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Studio in Residence | ' + SITE.name, description: DESCRIPTION },
}

export default function EngagementPage() {
  const mailto = `mailto:${SITE.email}?subject=Studio-in-residence inquiry`

  return (
    <>
      {/* Hero — capacity scarcity up front */}
      <section className="section bg-grid pt-20 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="tag tag-center mb-4">Studio in Residence · By application</div>
          <h1 className="mb-6">The BYOK Factory installed inside your studio.</h1>
          <p className="text-xl text-gray-light mb-4">
            Once per cohort, {FOUNDER.name.split(' ')[0]} comes into your studio or accelerator,
            installs the substrate that ships portfolio companies BYOK-first, helps each company
            in your cohort hit v0.1 on their own keys, and leaves your team running the factory.
          </p>
          <p className="text-base text-gray-light">
            2 engagements per year &middot; 3 months default &middot; 6 months for deeper transformation
          </p>
        </div>
      </section>

      {/* Three-question structure */}
      <section className="section py-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <p className="text-accent font-medium mb-3 uppercase text-xs tracking-wider">A. What gets brought in</p>
            <ul className="space-y-2 text-gray-light">
              <li>&middot; 46 portfolio platforms as receipts; 30 reusable <code>@caistech/*</code> modules</li>
              <li>&middot; Methodology install: auth pattern, bootstrap automation, customised CLAUDE.md, voice agent standard, BYOK substrate</li>
              <li>&middot; Client engagement proof: MMC Build (Stages 0&ndash;5 in 5 weeks vs 14-week plan), PreLabz + LingoPure CTO advisory</li>
              <li>&middot; Domain bench: construction, NDIS/SDA, fund tokenisation, voice coaching, language tech, property intelligence, B2B SaaS</li>
            </ul>
          </div>

          <div>
            <p className="text-accent font-medium mb-3 uppercase text-xs tracking-wider">B. What ships while in residence</p>
            <ul className="space-y-2 text-gray-light">
              <li>&middot; <strong className="text-white">Week 1:</strong> discovery + substrate install (your CLAUDE.md, <code>.npmrc</code> and registry, auth pattern, bootstrap scripts, voice agent)</li>
              <li>&middot; <strong className="text-white">Week 2&ndash;3:</strong> pick one anchor portfolio company &mdash; ship v0.1 BYOK-first on their own keys</li>
              <li>&middot; <strong className="text-white">Week 4 onward:</strong> scale to remaining cohort, each with working product on their own infrastructure</li>
              <li>&middot; <strong className="text-white">Public artifact:</strong> Factory Floor essay + joint case study (consent-clause mandatory)</li>
              <li>&middot; <strong className="text-white">Exit state:</strong> your team running the factory after I leave. Not a dependency.</li>
            </ul>
          </div>

          <div>
            <p className="text-accent font-medium mb-3 uppercase text-xs tracking-wider">C. What the stay looks like</p>
            <div className="space-y-3 text-gray-light">
              <p><strong className="text-white">Duration:</strong> 3 months (default) or 6 months (deeper transformation).</p>
              <p><strong className="text-white">Cadence:</strong> 1&ndash;2 days onsite per week, remote daily with async standup.</p>
              <p><strong className="text-white">Windows:</strong> January&ndash;March and July&ndash;September. Pipeline opens 3 months before each window.</p>
              <p><strong className="text-white">Cost:</strong> $65k/month retainer ($195k for a 3-month stint, $390k for 6 months) plus 1&ndash;3% equity in the host. Cohort-paid hybrid model available where individual portfolio companies cover a fractional CTO retainer on top of a lower studio base.</p>
              <p><strong className="text-white">Kill criteria:</strong> measurable triggers built into every contract. Either party can exit at the halfway mark if criteria miss.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-dark py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Inquiries</h2>
          <p className="text-base text-gray-light mb-8">
            By application. Brief me on your cohort &mdash; size, industries, target window, deal shape preference &mdash;
            and I&apos;ll respond inside 48 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={mailto}
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-light transition"
            >
              Email {FOUNDER.name.split(' ')[0]}
            </a>
            <a
              href={FOUNDER.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition"
            >
              Book a 30-min call
            </a>
            <Link
              href="/about"
              className="text-gray-light hover:text-white underline underline-offset-4"
            >
              About the founder
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
