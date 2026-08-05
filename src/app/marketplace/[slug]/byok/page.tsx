// @explanatory-header-exempt — form gate page; hand-built dark-theme hero covers R3 intent (what / what to do / why it matters).
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShieldCheck, KeyRound, ServerCog } from 'lucide-react'
import { PLATFORMS, SITE } from '@/lib/constants'
import { ByokInquiryForm } from '@/components/byok/ByokInquiryForm'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return PLATFORMS.filter((p) => p.releaseMode === 'byok-free' && p.deployUrl).map((p) => ({
    slug: p.slug,
  }))
}

export function generateMetadata({ params }: PageProps): Metadata {
  const platform = PLATFORMS.find((p) => p.slug === params.slug)
  if (!platform) return { title: 'Not found' }
  const title = `Deploy ${platform.name} (BYOK) | ${SITE.name}`
  const description = `Bring your own keys, deploy ${platform.name} into your own GitHub + Vercel. Free with BYOK. Short form, then straight into the one-click deploy.`
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  }
}

export default function ByokFormGatePage({ params }: PageProps) {
  const platform = PLATFORMS.find((p) => p.slug === params.slug)
  if (!platform || platform.releaseMode !== 'byok-free' || !platform.deployUrl) {
    notFound()
  }

  const credentials = platform.requiredCredentials || []
  const stack = platform.requiredStack || ['GitHub', 'Vercel', 'Supabase']

  return (
    <>
      {/* Hero — what this is, what to do, why it matters */}
      <section className="section bg-grid pt-20 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-medium uppercase tracking-wider">
              BYOK Factory · Free with your keys
            </span>
            <span className="text-xs bg-orange/20 text-orange px-3 py-1 rounded-full font-medium uppercase tracking-wider">
              Self-host · Your infrastructure
            </span>
          </div>

          <h1 className="mb-6">Deploy {platform.name} on your own infrastructure.</h1>
          <p className="text-lg text-gray-light mb-4">
            <strong className="text-white">What this is:</strong> a short form, then a one-click
            Vercel deploy that clones {platform.name} into your own GitHub and stands it up on your
            own Vercel account. No hosted version we control.
          </p>
          <p className="text-lg text-gray-light mb-4">
            <strong className="text-white">What you do here:</strong> tell us who you are and what
            you&apos;re trying to do with it, then click through. The deploy walks you through every
            API key the product needs &mdash; every key is yours.
          </p>
          <p className="text-lg text-gray-light">
            <strong className="text-white">Why it matters:</strong> the BYOK Factory model only
            works if {platform.name} is genuinely zero-marginal-cost for us. Your keys, your bills,
            your control. The form is so we can learn what you&apos;re using it for.
          </p>
        </div>
      </section>

      {/* Disclaimers — shown before the form, per Decision 3 */}
      <section className="section py-10 bg-gray-dark">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-start gap-4">
            <KeyRound className="text-accent flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-white font-semibold mb-1">Every key is yours</h3>
              <p className="text-sm text-gray-light">
                {platform.name} never proxies through a Corporate AI Solutions account at runtime.
                Every metered API call lands on your own vendor account.
              </p>
              {credentials.length > 0 && (
                <ul className="mt-3 text-sm text-gray-light/80 space-y-1">
                  {credentials.map((c) => (
                    <li key={c}>&middot; {c}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <ServerCog className="text-accent flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-white font-semibold mb-1">Opinionated stack</h3>
              <p className="text-sm text-gray-light">
                The deploy is opinionated to {stack.join(' + ')}. If your stack is different, the
                product is open source &mdash; fork and adapt &mdash; but the one-click deploy
                assumes this combination.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <ShieldCheck className="text-accent flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-white font-semibold mb-1">No support included</h3>
              <p className="text-sm text-gray-light">
                Free + BYOK means no SLA, no managed updates, no on-call. Pick the paid hosted
                option from the {platform.name} marketplace page if you want a supported version.
                Or, if your team wants the substrate installed in-house, see{' '}
                <Link href="/services" className="text-accent underline">
                  studio-in-residence engagements
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="inquiry" className="section py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="mb-3">A few details before the deploy</h2>
            <p className="text-gray-light">
              Four fields. We use this to follow up on how you got on with it &mdash; not to sell
              you anything.
            </p>
          </div>
          <ByokInquiryForm productSlug={platform.slug} productName={platform.name} />
        </div>
      </section>

      <section className="section py-10 bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-light">
            Want the hosted version of {platform.name} instead?{' '}
            <Link href={`/marketplace/${platform.slug}`} className="text-accent underline">
              Back to the product page
            </Link>{' '}
            for the paid path.
          </p>
        </div>
      </section>
    </>
  )
}
