// @explanatory-header-exempt — hand-built dark-theme hero opens with name/role/intro covering what/what-to-do/why; full <ExplanatoryHeader/> would clash with the theme
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Linkedin, Youtube, Calendar, Building2, Factory, Newspaper, ExternalLink, FileText, Github } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'About Dennis McMahon',
  description: '35+ years solving business problems across construction, aerospace, hospitality and SaaS. Solutions Architect, AI Platform Engineer, and CTO Advisor at PreLabz and LingoPure.',
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 items-start">
            <div className="md:col-span-2">
              <p className="text-accent font-medium mb-4">About</p>
              <h1 className="mb-6">Dennis McMahon</h1>
              <p className="text-xl text-gray-light mb-6 leading-relaxed">
                Solutions Architect &amp; AI Platform Engineer. Chief Technology Advisor at
                PreLabz &amp; LingoPure. Founder of Corporate AI Solutions.
              </p>
              <p className="text-gray-light mb-4">
                35+ years of executive operations across construction, aerospace, hospitality and
                SaaS &mdash; including 14 years operating between Australia and Southeast Asia
                (Malaysia, Indonesia).
              </p>
              <p className="text-gray-light mb-6">
                I started building AI platforms because the tools I needed didn&apos;t exist.
                Now they do. And I&apos;m sharing them with others who have the same problems.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://www.calendly.com/mcmdennis" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Calendar size={18} /> Book a Call
                </a>
                <a
                  href="https://www.linkedin.com/in/denniskl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary inline-flex items-center gap-2"
                >
                  <Linkedin size={18} /> Connect on LinkedIn
                </a>
                <a
                  href="/resume"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary inline-flex items-center gap-2"
                >
                  <FileText size={18} /> View Resume
                </a>
              </div>
            </div>

            {/* Photo and Quick Links */}
            <div className="space-y-4">
              {/* Photo */}
              <div className="relative">
                <img 
                  src="/dennis_web_image.jpg" 
                  alt="Dennis McMahon - Founder of Corporate AI Solutions"
                  className="w-full aspect-square object-cover rounded-lg border-2 border-accent/30"
                />
                <div className="absolute -bottom-2 -right-2 bg-accent text-black text-xs font-bold px-3 py-1 rounded">
                  35+ Years
                </div>
              </div>
              
              <a
                href="/resume"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <FileText className="text-accent" size={24} />
                <div>
                  <p className="font-medium">Resume</p>
                  <p className="text-xs text-gray-light">Solutions Architect · AI Platform Engineer</p>
                </div>
              </a>
              <a
                href="https://www.linkedin.com/in/denniskl/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <Linkedin className="text-[#0077B5]" size={24} />
                <div>
                  <p className="font-medium">LinkedIn</p>
                  <p className="text-xs text-gray-light">@denniskl</p>
                </div>
              </a>
              <a
                href="https://github.com/dennissolver"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <Github className="text-white" size={24} />
                <div>
                  <p className="font-medium">GitHub</p>
                  <p className="text-xs text-gray-light">@dennissolver &middot; profile</p>
                </div>
              </a>
              <a
                href="https://github.com/dennissolver?tab=repositories"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <Github className="text-accent" size={24} />
                <div>
                  <p className="font-medium">My Repos</p>
                  <p className="text-xs text-gray-light">All public repositories</p>
                </div>
              </a>
              <a
                href="https://www.youtube.com/@globalbuildtech"
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-gray-dark rounded-lg border border-gray-border hover:border-accent/50 transition-colors"
              >
                <Youtube className="text-[#FF0000]" size={24} />
                <div>
                  <p className="font-medium">YouTube</p>
                  <p className="text-xs text-gray-light">@globalbuildtech</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Current Engagements — moved to /clients */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="mb-2">Current engagements</h2>
          <p className="text-gray-light mb-8">
            Three concurrent commercial engagements as of 2026: one fixed-price build contract
            (MMC Build) and two Chief Technology Advisor positions (LingoPure, PreLabz).
            Full scope, stack and dates on the clients page.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/clients"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              See client engagements <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Studio in Residence invitation */}
      <section className="section bg-gradient-to-b from-black to-gray-dark border-y border-orange/20">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#fb923c' }}>Studio in Residence</div>
          <h2 className="mb-6">Looking for studio-in-residence engagements</h2>
          <p className="text-lg text-gray-light mb-4">
            The factory shape that produced 46 BYOK-first products is now offered as an in-residence
            engagement at studios, accelerators, and dev shops that want the substrate installed
            in-house. Two engagements per year. By application.
          </p>
          <p className="text-gray-light mb-4">
            <strong className="text-white">What gets installed:</strong> the auth pattern (forgot-password,
            visibility toggle, magic link), bootstrap automation (env sync, SMTP wiring, project
            scaffolding), CLAUDE.md customised to your stack, the first 3 <code>@caistech/*</code>
            packages wired in, voice agent surface per the portfolio standard.
          </p>
          <p className="text-gray-light mb-4">
            <strong className="text-white">Who it fits:</strong> engineering leaders and dev-shop
            owners running 5&ndash;20 person teams who want their next cohort of portfolio companies
            shipping BYOK-first within weeks &mdash; with the factory operational long after I leave.
          </p>
          <p className="text-gray-light mb-8">
            <strong className="text-white">The model:</strong> $65k/month retainer (3 or 6 months) +
            1&ndash;3% equity in the host. Hybrid shape available where individual cohort companies
            cover a fractional CTO retainer on top of a lower studio base. Kill criteria built into
            every contract &mdash; either party exits at the halfway mark if the criteria miss.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/engagement" className="btn btn-orange inline-flex items-center gap-2">
              Studio in Residence details <ArrowRight size={16} />
            </Link>
            <a
              href="https://www.calendly.com/mcmdennis"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Calendar size={18} /> Book a 30-min call
            </a>
          </div>
        </div>
      </section>

      {/* The Journey */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="mb-8">The Journey</h2>
          
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="w-16 h-16 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="text-accent" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Construction & Modular Expert</h3>
                <p className="text-gray-light mb-3">
                  Started in construction over 35 years ago. Became a specialist in modular and
                  prefabricated building methods. Seen the industry evolve from traditional 
                  stick-built to factory-manufactured.
                </p>
                <a 
                  href="https://www.global-buildtech.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-accent hover:text-white transition-colors inline-flex items-center gap-1 text-sm"
                >
                  Global Buildtech <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-16 h-16 bg-orange/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Factory className="text-orange" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Factory2Key Partnership</h3>
                <p className="text-gray-light mb-3">
                  Currently partnering in Factory2Key, delivering turnkey modular homes 
                  including SDA (Specialist Disability Accommodation). This is where 
                  Checkpoint was born—I needed a project management system that actually 
                  fit how construction works.
                </p>
                <a 
                  href="https://www.factory2key.com.au" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-orange hover:text-white transition-colors inline-flex items-center gap-1 text-sm"
                >
                  Factory2Key <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-16 h-16 bg-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI Platform Builder</h3>
                <p className="text-gray-light mb-3">
                  Started using AI coding support to solve my own business problems.
                  Then voice AI to improve customer experience. Then platforms for others.
                  Now running Corporate AI Solutions—a portfolio of BYOK-first AI platforms,
                  each solving real problems.
                </p>
                <Link 
                  href="/marketplace"
                  className="text-purple hover:text-white transition-colors inline-flex items-center gap-1 text-sm"
                >
                  See the Platforms <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* My Businesses */}
      <section className="section">
        <div className="max-w-5xl mx-auto">
          <h2 className="mb-8">My Businesses</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="https://www.global-buildtech.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-8 bg-gray-dark rounded-lg border border-gray-border hover:border-accent transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <Building2 className="text-accent" size={32} />
                <ExternalLink className="text-gray-light group-hover:text-accent transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Buildtech</h3>
              <p className="text-sm text-accent mb-3">Modular Construction Consultancy</p>
              <p className="text-gray-light text-sm">
                35+ years of building expertise. Helping developers, governments, and
                manufacturers navigate the modular construction landscape.
              </p>
            </a>

            <a 
              href="https://www.factory2key.com.au" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-8 bg-gray-dark rounded-lg border border-gray-border hover:border-orange transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <Factory className="text-orange" size={32} />
                <ExternalLink className="text-gray-light group-hover:text-orange transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Factory2Key</h3>
              <p className="text-sm text-orange mb-3">Turnkey Modular Homes</p>
              <p className="text-gray-light text-sm">
                SDA specialist. Delivering complete modular homes from factory to finished. 
                Where Checkpoint project management platform was born.
              </p>
            </a>

            <Link 
              href="/marketplace"
              className="p-8 bg-gray-dark rounded-lg border border-gray-border hover:border-purple transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">🚀</span>
                <ArrowRight className="text-gray-light group-hover:text-purple transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Corporate AI Solutions</h3>
              <p className="text-sm text-purple mb-3">BYOK Factory · AI Platform Portfolio</p>
              <p className="text-gray-light text-sm">
                A portfolio of BYOK-first parent platforms plus white-label children. Voice AI, business tools,
                generators. Methodology installed inside dev shops as studio-in-residence engagements.
              </p>
            </Link>

            <Link 
              href="/"
              className="p-8 bg-gray-dark rounded-lg border border-gray-border hover:border-accent transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl">🎙️</span>
                <ArrowRight className="text-gray-light group-hover:text-accent transition-colors" size={20} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Corporate AI Solutions</h3>
              <p className="text-sm text-accent mb-3">AI Voice Agents for Business</p>
              <p className="text-gray-light text-sm">
                The business solutions arm. Building AI voice agents that improve how 
                businesses talk to their customers.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletters */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Newspaper className="text-accent" size={28} />
            <h2 className="mb-0">LinkedIn Newsletters</h2>
          </div>
          <p className="text-gray-light mb-8">
            I write regularly about construction innovation and AI in business. 
            Subscribe to stay updated.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="https://www.linkedin.com/newsletters/go-offsite-7016211191035289600/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-6 bg-black rounded-lg border border-gray-border hover:border-accent transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                  <Building2 className="text-accent" size={24} />
                </div>
                <ExternalLink className="text-gray-light group-hover:text-accent transition-colors" size={18} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Go Offsite</h3>
              <p className="text-gray-light text-sm mb-4">
                Insights on modular construction, prefab building methods, and the future 
                of offsite manufacturing in the construction industry.
              </p>
              <span className="text-accent text-sm font-medium">Subscribe on LinkedIn →</span>
            </a>

            <a 
              href="https://www.linkedin.com/newsletters/bi-ai-advantage-7218131009064640512/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-6 bg-black rounded-lg border border-gray-border hover:border-purple transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-purple/20 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🤖</span>
                </div>
                <ExternalLink className="text-gray-light group-hover:text-purple transition-colors" size={18} />
              </div>
              <h3 className="text-lg font-semibold mb-2">BI AI Advantage</h3>
              <p className="text-gray-light text-sm mb-4">
                Business intelligence meets AI. How to leverage artificial intelligence 
                for real business outcomes, not hype.
              </p>
              <span className="text-purple text-sm font-medium">Subscribe on LinkedIn →</span>
            </a>
          </div>
        </div>
      </section>

      {/* YouTube */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Youtube className="text-[#FF0000]" size={28} />
            <h2 className="mb-0">YouTube Channel</h2>
          </div>
          
          <div className="p-8 bg-gray-dark rounded-lg border border-gray-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Global Buildtech</h3>
                <p className="text-gray-light mb-4">
                  Videos on modular construction, AI in building, and business insights. 
                  Subscribe to see the builds, the tools, and the journey.
                </p>
                <a 
                  href="https://www.youtube.com/@globalbuildtech" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  <Youtube size={18} /> Subscribe on YouTube
                </a>
              </div>
              <div className="text-6xl">🎬</div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="mb-8">My Philosophy</h2>
          
          <div className="space-y-6">
            <blockquote className="border-l-4 border-accent pl-6 py-2">
              <p className="text-xl text-white italic mb-2">
                &quot;I don&apos;t build software because I love software. I build it because 
                the tools I needed didn&apos;t exist.&quot;
              </p>
            </blockquote>

            <p className="text-gray-light">
              Every platform in the portfolio started as a problem I had—or a problem
              someone brought to me. I don&apos;t build features. I solve problems.
            </p>

            <p className="text-gray-light">
              After 35+ years in construction, I&apos;ve learned that the best solutions come from 
              people who actually do the work. Not consultants who observe. Not developers who 
              assume. People who feel the pain.
            </p>

            <p className="text-white font-medium">
              That&apos;s why I build. That&apos;s why I partner with others who have problems 
              worth solving. And that&apos;s why I&apos;m inviting you to join the journey.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Let&apos;s Talk</h2>
          <p className="text-xl text-gray-light mb-8">
            Got a problem worth solving? Want to partner on a platform? 
            Or just want to connect? I&apos;m easy to find.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="https://www.calendly.com/mcmdennis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Calendar size={18} /> Book a Call
            </a>
            <a 
              href="https://www.linkedin.com/in/denniskl/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              <Linkedin size={18} /> Connect on LinkedIn
            </a>
            <Button href="/contact" variant="secondary">
              Send a Message
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
