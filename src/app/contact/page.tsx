// @explanatory-header-exempt — hand-built dark-theme hero opens with what/what-to-do/why; full <ExplanatoryHeader/> would clash with the theme
import { Phone, Mail, MapPin, Calendar, Linkedin, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { ContactForm } from '@/components/contact/ContactForm'
import { SITE, FOUNDER } from '@/lib/constants'

/**
 * Server component. It used to be `'use client'` in order to read `useSearchParams()`, and that opts
 * a route out of server rendering entirely — /contact server-rendered 27 characters ("Loading...
 * Report a problem"), so the phone number, the email address and the Calendly link all waited on
 * JavaScript, on the page whose entire job is letting someone reach you.
 *
 * The search params are now read here, on the server, and the pre-selected enquiry type is passed to
 * the one component that genuinely needs state.
 */
export default function ContactPage({
  searchParams,
}: {
  searchParams: { type?: string; plan?: string; waitlist?: string }
}) {
  const type = searchParams.type || 'general'
  const { plan, waitlist } = searchParams

  const title = (() => {
    if (type === 'investor') return 'Investor Inquiry'
    if (type === 'referral') return 'Referral'
    if (plan) return `Subscribe to ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
    if (waitlist) return `Join Waitlist for ${waitlist}`
    return 'Get in Touch'
  })()

  // Every one of these measured 327x24. The phone number in particular is what someone on a mobile
  // reaches for first, so all four are now 44px.
  const directLink =
    'flex min-h-[44px] items-center gap-3 text-gray-light hover:text-accent transition-colors'

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-accent font-medium mb-4">Contact</p>
          <h1 className="mb-6">{title}</h1>
          <p className="text-xl text-gray-light mb-8">
            Let&apos;s talk about how we can work together.
          </p>

          <div className="inline-flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={FOUNDER.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg inline-flex items-center gap-2"
            >
              <Calendar size={20} /> Book a Call with {FOUNDER.name.split(' ')[0]}
            </a>
            <a
              href={FOUNDER.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-lg inline-flex items-center gap-2"
            >
              <Linkedin size={20} /> Connect on LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* Contact Info + Form */}
      <section className="section bg-gray-dark">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold mb-6">Direct Contact</h2>
                <div className="space-y-4">
                  <a
                    href={FOUNDER.calendly}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[44px] items-center gap-3 text-accent hover:text-white transition-colors font-medium"
                  >
                    <Calendar size={20} />
                    Book a Call
                    <ExternalLink size={14} />
                  </a>
                  <a
                    href={FOUNDER.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={directLink}
                  >
                    <Linkedin size={20} />
                    LinkedIn
                    <ExternalLink size={14} />
                  </a>
                  <a href={`tel:${SITE.phone}`} className={directLink}>
                    <Phone size={20} />
                    {SITE.phoneFormatted}
                  </a>
                  <a href={`mailto:${SITE.email}`} className={directLink}>
                    <Mail size={20} />
                    {SITE.email}
                  </a>
                  <div className="flex items-start gap-3 text-gray-light">
                    <MapPin size={20} className="mt-1" />
                    <div>
                      <p>{SITE.location}</p>
                      <p className="text-base">{SITE.company}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Button href="/marketplace" variant="secondary" size="sm" fullWidth>
                    Browse Platforms
                  </Button>
                  <Button href="/services" variant="orange" size="sm" fullWidth>
                    Audit &amp; Sprint Pricing
                  </Button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <ContactForm defaultType={type} />
            </div>
          </div>
        </div>
      </section>

      {/* Book a Call CTA */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Prefer to Talk?</h2>
          <p className="text-gray-light mb-8">
            Book a 15-minute call. No pressure — just a conversation about what you&apos;re trying to
            solve.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href={FOUNDER.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg inline-flex items-center justify-center gap-2"
            >
              <Calendar size={20} /> Book a Call
            </a>
            <a
              href={`tel:${SITE.phone}`}
              className="btn btn-secondary btn-lg inline-flex items-center justify-center gap-2"
            >
              <Phone size={20} /> Call Now: {SITE.phoneFormatted}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
