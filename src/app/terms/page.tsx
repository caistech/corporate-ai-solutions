import type { Metadata } from 'next'
import { SITE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Terms for using this website, and the engagement terms that apply to the Opportunity Audit, Deployment Sprint and Run & Extend.',
}

/**
 * Terms of use + the engagement terms already promised on /services.
 *
 * Written to REGULATORY_INCLUSIONS.md I2. The commercial terms here are NOT new — every one of them
 * is already stated on /services ("fixed scope, fixed price, fixed end date", "an overrun is mine,
 * not yours", "you own the code — no licence, no lock-in", "cancel any month without penalty",
 * "credited in full against a Sprint booked within 30 days"). This page is where a buyer can find
 * them in one place before they sign, which is what a cautious one will want.
 *
 * No `REPLACE` markers, by design.
 */
export default function TermsPage() {
  const updated = '5 August 2026'

  return (
    <section className="section">
      <div className="max-w-3xl mx-auto">
        <p className="text-accent font-medium mb-4">Legal</p>
        <h1 className="mb-4">Terms of Use</h1>
        <p className="text-base text-gray-light mb-10">
          These cover using this website, and the terms that apply if you engage us. Last updated{' '}
          {updated}.
        </p>

        <div className="space-y-8 text-base text-gray-light">
          <div>
            <h2 className="text-xl font-bold text-white mb-3">1. Who you are dealing with</h2>
            <p>
              This site and the services described on it are provided by <strong>{SITE.company}</strong>,
              ABN {SITE.abn}, of {SITE.location}, trading as {SITE.name}.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">2. The website</h2>
            <p>
              Everything on this site is general information about what we do. It is not advice for
              your situation, and nothing here creates an engagement. Prices, timeframes and
              descriptions may change; the terms that bind us are the ones in the written proposal
              you sign.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">3. Engagement terms</h2>
            <p className="mb-3">
              These apply to the services described on our{' '}
              <a href="/services" className="text-accent hover:text-white">
                services page
              </a>
              , and are confirmed in the proposal for each engagement.
            </p>
            <ul className="list-disc pl-6 space-y-3">
              <li>
                <strong>Fixed price, fixed scope, fixed end date.</strong> Each engagement is quoted
                against a written scope. <strong>An overrun against that scope is ours, not yours.</strong>
              </li>
              <li>
                <strong>Changes to scope are quoted separately.</strong> If work reveals something the
                scope did not cover, we tell you, price it, and you decide. We do not absorb new scope
                silently, and we do not invoice for it without your agreement.
              </li>
              <li>
                <strong>You own the code.</strong> On payment in full, all rights in the code and
                assets built for you transfer to you. No licence, no lock-in, no ongoing fee to keep
                using what you paid for. Pre-existing components and open-source libraries keep their
                own licences, which permit your continued use.
              </li>
              <li>
                <strong>Opportunity Audit</strong> — $2,500 + GST, one week. Fee is credited in full
                against a Deployment Sprint booked within 30 days.
              </li>
              <li>
                <strong>Deployment Sprint</strong> — $18,000 + GST, three weeks. 50% on signature,
                50% on delivery.
              </li>
              <li>
                <strong>Run &amp; Extend</strong> — $3,500/month + GST, month to month. Cancel any
                month without penalty.
              </li>
              <li>
                <strong>Not offered:</strong> staff augmentation, day rates, or open-ended retainers
                with no deliverable.
              </li>
            </ul>
            <p className="mt-3">All prices exclude GST. Invoices are payable within 7 days.</p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">4. Your confidential information</h2>
            <p>
              Anything you tell us about your business in the course of an engagement is treated as
              confidential and is not disclosed to anyone else or used for another client&apos;s work.
              We will not name you publicly as a client without your written agreement.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">5. What we do not warrant</h2>
            <p>
              Software built for you is warranted to do what the agreed scope says it does. We do not
              warrant that it will be free of every defect, or that any particular commercial result
              will follow. Where systems rely on third-party services or AI models, their availability
              and output are outside our control.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">6. Liability</h2>
            <p>
              To the extent the law allows, our liability for any engagement is limited to the fees
              paid for that engagement.{' '}
              <strong>
                Nothing in these terms limits your rights under the Australian Consumer Law.
              </strong>{' '}
              Our services come with guarantees that cannot be excluded — if there is a major failure
              you are entitled to a refund or to cancel, and to compensation for any other reasonably
              foreseeable loss. If something has gone wrong, tell us before anything else; we would
              rather fix it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">7. Governing law</h2>
            <p>
              These terms are governed by the laws of Queensland, Australia, and the courts of
              Queensland have jurisdiction.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-3">8. Privacy</h2>
            <p>
              How we handle personal information is set out in our{' '}
              <a href="/privacy" className="text-accent hover:text-white">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700 text-base text-gray-light">
          <p>
            Questions:{' '}
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
