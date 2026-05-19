// @explanatory-header-exempt — page opens with hand-built three-question explanatory hero in dark-theme aesthetic matching the rest of the marketplace
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Github,
  KeyRound,
  Mic,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { PLATFORMS, FOUNDER, SITE } from '@/lib/constants'

const cqr = PLATFORMS.find((p) => p.id === 'cqr')

const DESCRIPTION =
  'Community Question Responder — first BYOK Factory release. Polls a community Slack or Discord, classifies questions, drafts a reply in the operator’s voice, holds for one-click approval. Free, BYOK, your infrastructure.'

export const metadata: Metadata = {
  title: 'Community Question Responder (CQR)',
  description: DESCRIPTION,
  openGraph: {
    title: 'Community Question Responder | ' + SITE.name,
    description: DESCRIPTION,
  },
  twitter: {
    title: 'Community Question Responder | ' + SITE.name,
    description: DESCRIPTION,
  },
}

export default function CqrPage() {
  if (!cqr) return notFound()

  const githubHref = cqr.githubUrl || 'https://github.com/dennissolver/community-question-responder'
  const deployHref = cqr.deployUrl
  const credentials = cqr.requiredCredentials || []
  const deploymentModes = cqr.deploymentModes || []

  return (
    <>
      {/* Explanatory header — what this is, what to do, why it matters */}
      <section className="section bg-grid pt-20 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-medium uppercase tracking-wider">
              BYOK Factory · First public release
            </span>
            <span className="text-xs bg-orange/20 text-orange px-3 py-1 rounded-full font-medium uppercase tracking-wider">
              Free · BYOK
            </span>
            {cqr.status === 'live' ? (
              <span className="status-live">Live</span>
            ) : (
              <span className="status-building">Building</span>
            )}
          </div>

          <h1 className="mb-6">{cqr.name}</h1>
          <p className="text-xl text-white mb-4">{cqr.tagline}</p>
          <p className="text-lg text-gray-light mb-4">
            <strong className="text-white">What this is:</strong> a deployable tool that turns slow,
            half-answered community channels into a queue of vendor-quality drafts you approve in one
            click.
          </p>
          <p className="text-lg text-gray-light mb-4">
            <strong className="text-white">What you do here:</strong> clone the repo into your own
            GitHub, deploy to your own Vercel, drop in your own API keys, walk a setup wizard. No
            account on this site. No hosted version we control.
          </p>
          <p className="text-lg text-gray-light">
            <strong className="text-white">Why it matters:</strong> CQR is the proof-of-shape for the
            BYOK Factory methodology. Free with your keys; the studio comes into your dev shop only
            if you want the substrate installed in-house.
          </p>
        </div>
      </section>

      {/* Primary CTAs */}
      <section className="section py-12 bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            {deployHref ? (
              <a
                href={deployHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-base"
              >
                <Rocket size={18} /> Deploy Your Own
              </a>
            ) : (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gray-mid text-gray-light cursor-not-allowed text-base font-medium"
                title="Vercel Deploy button URL ships when the CQR repo goes public"
              >
                <Rocket size={18} /> Deploy Your Own &middot; coming with public ship
              </button>
            )}
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-white/20 text-white hover:bg-white/5 transition text-base font-medium"
            >
              <Github size={18} /> View on GitHub
            </a>
          </div>
          <p className="text-sm text-gray-light mt-4">
            The Vercel Deploy button reads the env schema from the repo and prompts for every key
            during setup. Every key is yours; no CAS-owned fallback.
          </p>
        </div>
      </section>

      {/* Problem statement */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <p className="text-accent font-medium mb-3 uppercase text-xs tracking-wider">The problem</p>
          <h2 className="text-2xl font-bold mb-4">{cqr.problem}</h2>
          <p className="text-gray-light text-lg">{cqr.description}</p>
        </div>
      </section>

      {/* Two deployment modes side-by-side */}
      <section className="section bg-gray-dark">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Two deployment modes. One codebase.</h2>
            <p className="text-gray-light">
              Same architecture. Pick the one that matches who you are.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/30 rounded-lg border border-gray-border">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-accent" size={20} />
                <h3 className="text-lg font-bold">Customer self-serve</h3>
                {deploymentModes.includes('customer-self-serve') && (
                  <CheckCircle2 className="text-accent ml-auto" size={18} aria-label="Supported" />
                )}
              </div>
              <p className="text-sm text-gray-light mb-4">
                You operate inside someone else&apos;s community as a third party. CQR points at a
                vendor&apos;s public surfaces, drafts replies you can post or share. You stay the
                voice; the vendor never sees an automated bot.
              </p>
              <ul className="space-y-2 text-sm text-gray-light">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" /> Drafts only &mdash; you approve and post in your own client.</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" /> No bot account in the vendor channel.</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-accent flex-shrink-0 mt-0.5" /> Knowledge base scoped to a single vendor&apos;s public docs.</li>
              </ul>
            </div>

            <div className="p-6 bg-black/30 rounded-lg border border-gray-border">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-orange" size={20} />
                <h3 className="text-lg font-bold">Vendor self-deploy</h3>
                {deploymentModes.includes('vendor-self-deploy') && (
                  <CheckCircle2 className="text-orange ml-auto" size={18} aria-label="Supported" />
                )}
              </div>
              <p className="text-sm text-gray-light mb-4">
                You operate inside your own community as the vendor. CQR runs as a bot inside your
                Slack or Discord, drafts replies, holds for approval by your team, posts on the
                vendor account.
              </p>
              <ul className="space-y-2 text-sm text-gray-light">
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-orange flex-shrink-0 mt-0.5" /> Bot posts on the vendor account after approval.</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-orange flex-shrink-0 mt-0.5" /> Team-level approval queue.</li>
                <li className="flex gap-2"><CheckCircle2 size={16} className="text-orange flex-shrink-0 mt-0.5" /> Knowledge base scoped to your own product docs.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Demo placeholder */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Demo</h2>
            <p className="text-gray-light">Walkthrough of the approval queue and a real draft posting cycle.</p>
          </div>
          <div className="aspect-video bg-gray-dark rounded-lg border border-gray-border flex items-center justify-center text-center p-8">
            <div>
              <PlayCircle className="mx-auto text-gray-light mb-4" size={48} />
              <p className="text-gray-light">Demo video ships with the public release.</p>
              <p className="text-sm text-gray-light mt-2">
                Until then, the {' '}
                <a href={githubHref} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white underline">
                  GitHub README
                </a>
                {' '} has setup screenshots and the doctrine gist explains the approach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Required credentials — BYOK transparency */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="text-accent" size={22} />
              <h2 className="text-3xl font-bold">Keys you provide</h2>
            </div>
            <p className="text-gray-light">
              No managed-for-you secret. Every credential below is one you create on the vendor&apos;s
              site and paste into the Vercel deploy flow.
            </p>
          </div>
          {credentials.length > 0 ? (
            <ul className="grid sm:grid-cols-2 gap-3">
              {credentials.map((credential) => (
                <li
                  key={credential}
                  className="flex items-start gap-2 p-3 bg-black/30 rounded-lg border border-gray-border"
                >
                  <KeyRound size={16} className="text-accent flex-shrink-0 mt-1" />
                  <span className="text-sm text-gray-light">{credential}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-light">Required credential list lands with the public release.</p>
          )}
        </div>
      </section>

      {/* Voice agent surface notice */}
      {cqr.hasVoiceAI && (
        <section className="section">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-gray-dark rounded-lg border border-accent/30">
              <Mic className="text-accent flex-shrink-0 mt-1" size={22} />
              <div>
                <h3 className="text-lg font-bold mb-1">Voice agent built in</h3>
                <p className="text-sm text-gray-light">
                  CQR ships with an ElevenLabs Conversational AI agent &mdash; <em>voice-capture-a-learning</em>.
                  Operators record a one-line lesson into the approval queue while walking between
                  tasks. The agent is provisioned via the vendor&apos;s API on first run; your
                  ElevenLabs key, your agent.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Methodology + secondary links */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">The methodology</h2>
          <p className="text-gray-light mb-6">
            CQR is the first artifact of <em>BYOK Factory</em> &mdash; a methodology for shipping
            BYOK-first AI products that ride on the user&apos;s keys, infrastructure, and control.
            Tools below describe the doctrine and the engagement model.
          </p>
          <ul className="space-y-3">
            <li>
              <a
                href={githubHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-accent hover:text-white transition"
              >
                <Github size={16} /> README on GitHub <ExternalLink size={14} />
              </a>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 text-gray-light">
                <span className="opacity-60">Doctrine gist &middot; published with public ship</span>
              </span>
            </li>
            <li>
              <span className="inline-flex items-center gap-2 text-gray-light">
                <span className="opacity-60">Factory Floor essay #1 &middot; published with public ship</span>
              </span>
            </li>
            <li>
              <Link href="/engagement" className="inline-flex items-center gap-2 text-orange hover:text-white transition">
                Studio-in-residence engagements <ArrowRight size={14} />
              </Link>
            </li>
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Ready to run it on your own infrastructure?</h2>
          <p className="text-lg text-gray-light mb-8">
            Take the repo, deploy with your keys, walk the setup wizard. If you want help installing
            the BYOK Factory substrate inside your dev shop, that&apos;s the engagement path.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Github size={18} /> View on GitHub
            </a>
            <Link href="/engagement" className="btn btn-secondary inline-flex items-center gap-2">
              Talk to {FOUNDER.name.split(' ')[0]} about an engagement
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
