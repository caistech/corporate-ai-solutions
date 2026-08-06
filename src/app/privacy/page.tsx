import type { Metadata } from 'next'
import { SITE, FOUNDER } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Corporate AI Solutions collects, uses, stores and discloses personal information, and how to access, correct or delete it.',
}

/**
 * Australian Privacy Act 1988 (APPs) privacy policy.
 *
 * This page did not exist. `/privacy`, `/terms`, `/legal` all 404'd, and nothing linked to any of
 * them — while the contact form collected name, email, phone and a description of the visitor's
 * business, and a voice agent sat on every page. `/services` simultaneously claimed "audit logging,
 * privacy surfaces. Built in, not bolted on", which makes the absence worse than neutral: a
 * compliance officer sent that link reads a claim and then finds nothing behind it.
 *
 * Written to REGULATORY_INCLUSIONS.md I1. It contains NO `REPLACE` markers by design — a published
 * legal page carrying a placeholder is the specific failure that document exists to prevent, because
 * the reader has then been given an assurance that is not real.
 */
export default function PrivacyPage() {
  const updated = '5 August 2026'

  return (
    <section className="section">
      <div className="max-w-3xl mx-auto">
        <p className="text-accent font-medium mb-4">Legal</p>
        <h1 className="mb-4">Privacy Policy</h1>
        <p className="text-base text-gray-light mb-10">
          This explains what personal information we collect, why we collect it, who we share it
          with, and how you can see it, correct it or have it deleted. Last updated {updated}.
        </p>

        <div className="space-y-8 text-base text-gray-light">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Who we are</h2>
            <p>
              This site is operated by <strong>{SITE.company}</strong>, ABN {SITE.abn}, trading as{' '}
              {SITE.name}, of {SITE.location}. We are the entity responsible for the personal
              information described here. You can reach us at{' '}
              <a href={`mailto:${SITE.email}`} className="text-accent hover:text-white">
                {SITE.email}
              </a>{' '}
              or {SITE.phoneFormatted}.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. What we collect</h2>
            <p className="mb-3">Only what you give us, and a small amount of technical data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Enquiry details</strong> — when you use the contact form: your name, email
                address, optional phone number, the type of enquiry, and whatever you write in the
                message. People often describe their business and its problems here, so treat that
                field as you would any other confidential note.
              </li>
              <li>
                <strong>Booking details</strong> — if you book a call, those details are collected by
                Calendly under their own privacy policy, not by this site.
              </li>
              <li>
                <strong>Assistant conversations</strong> — if you use the on-page assistant, the
                messages you send are processed to generate a reply.
              </li>
              <li>
                <strong>Technical data</strong> — standard server and hosting logs (IP address,
                browser, pages requested) kept for security and diagnostics.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell personal information, and we do not use it for advertising or
              profiling.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. Why we collect it</h2>
            <p>
              To answer your enquiry, to arrange and hold a conversation about work you are
              considering, to keep a record of who we have spoken with, and to keep the site running
              and secure. If you become a client, we use it to deliver and support the work.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Who else processes it, and where</h2>
            <p className="mb-3">
              We use third-party services to run this site. Each one only receives what it needs:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Vercel</strong> — hosting and delivery of this website.
              </li>
              <li>
                <strong>Supabase</strong> — the database that stores enquiries.
              </li>
              <li>
                <strong>Resend</strong> — sends the notification email when you submit an enquiry.
              </li>
              <li>
                <strong>Calendly</strong> — booking, if you choose to book a call.
              </li>
              <li>
                <strong>Anthropic and ElevenLabs</strong> — process assistant conversations where
                that feature is used.
              </li>
            </ul>
            <p className="mt-3">
              <strong>Some of these providers store or process data outside Australia</strong>,
              including in India — where our database is hosted — and the United States. By
              sending us an enquiry or using the assistant you
              consent to that transfer. We take reasonable steps to use providers with appropriate
              protections, but we cannot control an overseas recipient&apos;s handling to the same
              degree as our own.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. How long we keep it</h2>
            <p>
              Enquiries are kept while they are useful — typically up to two years from your last
              contact with us — and then deleted. Client records are kept for as long as we have a
              professional or legal reason to hold them, including tax and record-keeping
              obligations. You can ask us to delete yours sooner at any time.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Your rights</h2>
            <p className="mb-3">
              Under the Australian Privacy Principles you can ask us to show you the personal
              information we hold about you, correct it if it is wrong, or delete it. Email{' '}
              <a href={`mailto:${SITE.email}`} className="text-accent hover:text-white">
                {SITE.email}
              </a>{' '}
              and we will respond within 30 days. There is no charge.
            </p>
            <p>
              If you are unhappy with how we have handled your information, tell us first and we will
              try to fix it. If you are still unhappy you can complain to the Office of the
              Australian Information Commissioner at{' '}
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-white"
              >
                oaic.gov.au
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">7. Security</h2>
            <p>
              Enquiries are stored in an access-controlled database and transmitted over encrypted
              connections. Access is limited to {FOUNDER.name}. No system is perfectly secure, and we
              will tell you and the OAIC if a breach occurs that is likely to cause you serious harm,
              as the Notifiable Data Breaches scheme requires.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">8. Cookies</h2>
            <p>
              This site uses only what is strictly necessary to serve pages and remember your session
              where you are signed in. We do not run advertising or cross-site tracking cookies.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">9. Changes</h2>
            <p>
              If this policy changes we will update the date at the top. Material changes affecting
              information we already hold will be notified to the email address you gave us.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-base text-gray-light">
          <p>
            Questions about this policy:{' '}
            <a href={`mailto:${SITE.email}`} className="text-accent hover:text-white">
              {SITE.email}
            </a>{' '}
            &middot; {SITE.company} &middot; ABN {SITE.abn} &middot; {SITE.location}
          </p>
        </div>
      </div>
    </section>
  )
}
