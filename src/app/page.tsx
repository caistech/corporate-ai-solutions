// @explanatory-header-exempt — hand-built dark-theme hero opens with what/what-to-do/why; full <ExplanatoryHeader/> would clash with the theme
import Link from 'next/link'
import { ArrowRight, Mic, Users, Layers, Rocket, ChevronRight, Sparkles, Linkedin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SKOOL, FOUNDER, getParentPlatforms, getChildrenOf, PUBLISHED_PLATFORM_COUNT } from '@/lib/constants'
import { AgentJsonLd } from '@caistech/webmcp-kit/react'
import { agentConfig } from '@/agent-readiness.config'

export default function HomePage() {
  const parentPlatforms = getParentPlatforms().filter(p => p.status === 'live' && !p.marketplaceHidden)
  const generators = parentPlatforms.filter(p => p.isGenerator)

  return (
    <>
      <AgentJsonLd config={agentConfig} />
      {/* Hero - What We Do */}
      <section className="min-h-[80vh] flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="max-w-5xl mx-auto px-6 py-24 relative z-10">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 px-4 py-2 rounded-full mb-8">
            <Sparkles size={16} className="text-accent" />
            <span className="text-sm text-accent">BYOK Factory · {PUBLISHED_PLATFORM_COUNT} published AI products · open source you can clone</span>
          </div>

          <h1 className="mb-6">
            Clone a real one in 10 minutes &mdash; then hire the operator who built all of them.
          </h1>

          <p className="text-xl text-gray-light max-w-3xl mb-6 leading-relaxed">
            Don&apos;t take the count on faith. Several of these products are open-source and BYOK:
            clone the repo, set your own keys, deploy to your own infra &mdash; and it runs. No
            subscription, no managed backend you can&apos;t inspect.
          </p>

          <p className="text-base text-gray-light max-w-3xl mb-10 leading-relaxed">
            One operator, {PUBLISHED_PLATFORM_COUNT} AI products on one shared substrate &mdash; every one
            of them listed on the marketplace, so you can count them yourself. If you want that
            velocity pointed at your problem, I take on fixed-price builds &mdash; a one-week
            audit, then a three-week build you own outright.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button href="/marketplace#proof" size="lg">
              Clone &amp; run the proof <ArrowRight size={20} />
            </Button>
            <Button href="/services" variant="orange" size="lg">
              Hire me for a build
            </Button>
            <Button href="/marketplace" variant="secondary" size="lg">
              Browse the marketplace
            </Button>
          </div>
        </div>
      </section>

      {/* The Journey Story */}
      <section id="journey" className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-accent font-medium mb-4">Our Story</p>
            <h2>From Solving Our Own Problems to Building for Others</h2>
          </div>

          {/* Timeline */}
          <div className="space-y-0">
            {/* Step 1 */}
            <div className="relative pl-12 pb-12 border-l-2 border-gray-mid">
              <div className="absolute left-0 top-0 w-6 h-6 -translate-x-[13px] bg-accent rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">1</span>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-gray-border">
                <p className="text-accent text-sm font-medium mb-2">The Beginning</p>
                <h3 className="text-xl font-semibold mb-3">Solving Our Own Business Problems</h3>
                <p className="text-gray-light">
                  Like most founders, we started by scratching our own itch. AI coding support let us 
                  build internal tools 10x faster than hiring developers. What used to take months 
                  took days.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative pl-12 pb-12 border-l-2 border-gray-mid">
              <div className="absolute left-0 top-0 w-6 h-6 -translate-x-[13px] bg-accent rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">2</span>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-gray-border">
                <p className="text-accent text-sm font-medium mb-2">The Pivot</p>
                <h3 className="text-xl font-semibold mb-3">Voice AI Changed Everything</h3>
                <p className="text-gray-light">
                  We built voice AI agents to improve user experience in our own business. 
                  No more &quot;press 1 for support.&quot; Real conversations. Real results. 
                  Customer satisfaction went up. Support costs went down.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative pl-12 pb-12 border-l-2 border-gray-mid">
              <div className="absolute left-0 top-0 w-6 h-6 -translate-x-[13px] bg-accent rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">3</span>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-gray-border">
                <p className="text-accent text-sm font-medium mb-2">The Scale</p>
                <h3 className="text-xl font-semibold mb-3">Single-Use to Multi-User Platforms</h3>
                <p className="text-gray-light">
                  People saw what we built. They wanted it. So we turned our single-use solutions 
                  into platforms others could use. RaiseReady for pitch practice. TenderWatch for 
                  government tenders. Each one solving a real problem we&apos;d already solved.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative pl-12 pb-12 border-l-2 border-gray-mid">
              <div className="absolute left-0 top-0 w-6 h-6 -translate-x-[13px] bg-accent rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">4</span>
              </div>
              <div className="bg-black/30 p-6 rounded-lg border border-gray-border">
                <p className="text-accent text-sm font-medium mb-2">The Accelerant</p>
                <h3 className="text-xl font-semibold mb-3">Generator: White-Label at Speed</h3>
                <p className="text-gray-light">
                  We built Generator—our internal platform for spinning up white-label versions 
                  of our solutions. Now we can deploy a customized platform for a client in days, 
                  not months. Same quality. Fraction of the time.
                </p>
              </div>
            </div>

            {/* Step 5 - Current */}
            <div className="relative pl-12">
              <div className="absolute left-0 top-0 w-6 h-6 -translate-x-[13px] bg-orange rounded-full flex items-center justify-center">
                <span className="text-black text-xs font-bold">5</span>
              </div>
              <div className="bg-orange/10 p-6 rounded-lg border-2 border-orange">
                <p className="text-orange text-sm font-medium mb-2">Where We Are Now</p>
                <h3 className="text-xl font-semibold mb-3">The Factory Is the Product</h3>
                <p className="text-gray-light mb-4">
                  All of this led to a realization: we&apos;d built a machine for turning problems
                  into platforms. Fast. Cheap. Repeatable. The unicorn isn&apos;t any single product —
                  it&apos;s the factory that creates them. {PUBLISHED_PLATFORM_COUNT} products, on one shared
                  substrate, that you can clone and inspect.
                </p>
                <p className="text-white font-medium">
                  {PUBLISHED_PLATFORM_COUNT} platforms published. The factory is running. Now we scale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who's Behind This */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-accent font-medium mb-4">Who&apos;s Behind This</p>
              <h2 className="mb-6">35+ Years Solving Business Problems</h2>
              <p className="text-gray-light mb-4">
                I&apos;m {FOUNDER.name}. I&apos;ve been in business for over three decades—not in tech, 
                but in construction, manufacturing, and operations. The messy stuff.
              </p>
              <p className="text-gray-light mb-4">
                I built <a href={FOUNDER.companies.globalBuildtech.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white">{FOUNDER.companies.globalBuildtech.name}</a> as 
                a modular construction consultancy. I&apos;m partnering in <a href={FOUNDER.companies.factory2key.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-white">{FOUNDER.companies.factory2key.name}</a>, 
                delivering turnkey modular homes.
              </p>
              <p className="text-gray-light mb-6">
                That&apos;s why I built <strong className="text-white">Checkpoint</strong>—because I needed 
                a project management system that actually fit how construction works. 
                Not another generic tool. A real solution for a real problem I had every day.
              </p>
              <p className="text-white font-medium mb-6">
                That&apos;s the pattern: I build what I need. Then I realize others need it too.
              </p>
              
              {/* Social Links */}
              <div className="flex flex-wrap gap-4">
                <Button href="/about" size="sm">
                  More About Me <ArrowRight size={16} />
                </Button>
                <a 
                  href={FOUNDER.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5]/20 text-[#0077b5] rounded-lg hover:bg-[#0077b5]/30 transition-colors text-sm"
                >
                  <Linkedin size={16} /> LinkedIn
                </a>
                <a 
                  href={FOUNDER.calendly}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors text-sm"
                >
                  <Calendar size={16} /> Book a Call
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <a 
                href={FOUNDER.companies.globalBuildtech.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-6 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <p className="text-xs text-accent uppercase tracking-wide mb-2">Consultancy</p>
                <h3 className="text-lg font-semibold mb-1">{FOUNDER.companies.globalBuildtech.name}</h3>
                <p className="text-sm text-gray-light">{FOUNDER.companies.globalBuildtech.description}</p>
              </a>
              <a 
                href={FOUNDER.companies.factory2key.url}
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-6 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <p className="text-xs text-orange uppercase tracking-wide mb-2">Active Partnership</p>
                <h3 className="text-lg font-semibold mb-1">{FOUNDER.companies.factory2key.name}</h3>
                <p className="text-sm text-gray-light">{FOUNDER.companies.factory2key.description}</p>
              </a>
              <div className="p-6 bg-accent/10 rounded-lg border border-accent/30">
                <p className="text-sm text-gray-light italic">
                  &quot;I don&apos;t build software because I love software. I build it because 
                  the tools I needed didn&apos;t exist. Now they do.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What This Means For You - Three Paths */}
      <section id="solutions" className="section bg-gray-dark">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-accent font-medium mb-4">Two ways in</p>
            <h2 className="mb-4">Run it yourself, or have it built for you.</h2>
            <p className="text-gray-light text-lg max-w-2xl mx-auto">
              Every platform here is free if you bring your own keys and run it yourself. If you
              would rather it was built for your business and handed over working, that is the
              other path.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Path 1: Use the Products BYOK-Free */}
            <div className="bg-black p-8 rounded-lg border-2 border-accent/50 hover:border-accent transition-colors group">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-6">
                <Layers className="text-accent" size={24} />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Use the Products BYOK-Free</h3>
              <p className="text-gray-light mb-6">
                Browse {PUBLISHED_PLATFORM_COUNT} published platforms. Clone the repo, deploy to your own
                Vercel with your own keys, walk the setup wizard. No subscription. Your infrastructure.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-accent" />
                  CQR &ndash; Community Question Responder (first BYOK release)
                </li>
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-accent" />
                  Rehearsals AI &ndash; Voice coaching suite
                </li>
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-accent" />
                  Connexions &ndash; AI interviewer panels
                </li>
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-accent" />
                  + {PUBLISHED_PLATFORM_COUNT - 3} more published platforms
                </li>
              </ul>
              <Button href="/marketplace" fullWidth>
                Browse Marketplace
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-center text-sm text-gray-light mt-4">Free with BYOK</p>
            </div>

            {/* Path 2: Have it built for your business */}
            <div className="bg-black p-8 rounded-lg border-2 border-orange/50 hover:border-orange transition-colors group">
              <div className="w-12 h-12 bg-orange/20 rounded-lg flex items-center justify-center mb-6">
                <Users className="text-orange" size={24} />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Have it built for your business</h3>
              <p className="text-gray-light mb-6">
                One AI system, running in your production environment, that you own outright.
                Three weeks, fixed price &mdash; because the plumbing is already built and your
                project inherits it on day one.
              </p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-orange" />
                  <strong className="text-white">Audit:</strong> one week, $2,500 + GST
                </li>
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-orange" />
                  <strong className="text-white">Sprint:</strong> three weeks, $18,000 + GST
                </li>
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-orange" />
                  Built on your accounts &mdash; you own it outright
                </li>
                <li className="flex items-center gap-2 text-gray-light">
                  <ChevronRight size={16} className="text-orange" />
                  Fixed price. An overrun is mine, not yours.
                </li>
              </ul>
              <Button href="/services" variant="orange" fullWidth>
                See services
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="text-center text-sm text-gray-light mt-4">Two build slots a month</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Platforms */}
      <section className="section">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
            <div>
              <p className="text-accent font-medium mb-2">Our Platforms</p>
              <h2>{PUBLISHED_PLATFORM_COUNT} Platforms Published. The Factory Never Stops.</h2>
              <p className="text-gray-light mt-2">Each platform is a public landing page you can visit. Eight shown here &mdash; the marketplace lists all {PUBLISHED_PLATFORM_COUNT}. Generators spin up white-label versions in days.</p>
            </div>
            <Button href="/marketplace" variant="secondary">
              View All Details →
            </Button>
          </div>

          {/* Parent Platforms Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {parentPlatforms.slice(0, 8).map((platform) => (
              <div key={platform.id} className="bg-black/50 p-6 rounded-lg border border-gray-border hover:border-accent/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs text-accent uppercase tracking-wide">{platform.category.replace('-', ' ')}</span>
                  <div className="flex gap-1">
                    {platform.hasVoiceAI && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Voice AI</span>
                    )}
                    {platform.isGenerator && (
                      <span className="text-xs bg-orange/20 text-orange px-2 py-1 rounded">Generator</span>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-light mb-4 line-clamp-2">{platform.problem}</p>
                <a
                  href={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  Visit Platform <ArrowRight size={14} />
                </a>
              </div>
            ))}
          </div>

          {/* Generator Examples */}
          <div className="bg-black/30 p-8 rounded-lg border border-gray-border">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="text-orange" size={20} />
              <h3 className="text-xl font-semibold">Generator Output Examples</h3>
            </div>
            <p className="text-gray-light mb-6">
              Our generator platforms (RaiseReady Template, Connexions) can spin up customized white-label versions. 
              Here are some live examples:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* RaiseReady Children */}
              <div>
                <p className="text-sm text-orange font-medium mb-3">From RaiseReady Template:</p>
                <div className="space-y-2">
                  {getChildrenOf('raiseready-template').slice(0, 4).map((child) => (
                    <a
                      key={child.id}
                      href={child.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-black/50 rounded border border-gray-border hover:border-orange/30 transition-colors group"
                    >
                      <span className="text-sm">{child.name}</span>
                      <ArrowRight size={14} className="text-gray-light group-hover:text-orange transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
              
              {/* Connexions Children */}
              <div>
                <p className="text-sm text-orange font-medium mb-3">From Connexions:</p>
                <div className="space-y-2">
                  {getChildrenOf('connexions').map((child) => (
                    <a
                      key={child.id}
                      href={child.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-black/50 rounded border border-gray-border hover:border-orange/30 transition-colors group"
                    >
                      <span className="text-sm">{child.name}</span>
                      <ArrowRight size={14} className="text-gray-light group-hover:text-orange transition-colors" />
                    </a>
                  ))}
                </div>
                <p className="text-xs text-gray-light mt-4 italic">+ more being built</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section bg-gradient-to-b from-gray-dark to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-6">Not Sure Where to Start?</h2>
          <p className="text-xl text-gray-light mb-8">
            Join our free community. Ask questions. See what others are building. 
            Find your path when you&apos;re ready.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href={SKOOL.url} external variant="purple" size="lg">
              Join &quot;The Easily Distracted&quot; Free
            </Button>
            <Button href="/contact" variant="secondary" size="lg">
              Or Just Talk to Us
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
