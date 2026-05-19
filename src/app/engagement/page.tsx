// @explanatory-header-exempt — Wave 2 holding stub for /engagement; full content + canonical header lands in Wave 3 PR
import { Metadata } from 'next'
import Link from 'next/link'
import { FOUNDER, SITE } from '@/lib/constants'

const DESCRIPTION =
  'Studio-in-residence engagement landing. Studio comes into your dev shop; BYOK Factory substrate gets installed; case study and operational competence stay behind. Full details landing in Wave 3.'

export const metadata: Metadata = {
  title: 'Studio in Residence',
  description: DESCRIPTION,
  openGraph: { title: 'Studio in Residence | ' + SITE.name, description: DESCRIPTION },
  twitter: { title: 'Studio in Residence | ' + SITE.name, description: DESCRIPTION },
}

export default function EngagementPage() {
  return (
    <section className="section bg-grid min-h-[70vh] flex items-center">
      <div className="max-w-3xl mx-auto text-center">
        <div className="tag tag-center mb-4">Studio in Residence</div>
        <h1 className="mb-6">Studio-in-Residence Engagements</h1>
        <p className="text-lg text-gray-light mb-4">
          This page is where engineering leaders and dev-shop owners learn how the BYOK Factory
          gets installed in their organisation &mdash; what gets shipped, the model, who it fits.
        </p>
        <p className="text-lg text-gray-light mb-8">
          Full landing copy is in the next release. For serious inquiries today, reach out direct.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href={`mailto:${SITE.email}?subject=Studio-in-residence inquiry`}
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
  )
}
