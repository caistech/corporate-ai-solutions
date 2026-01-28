import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CheckCircle2,
  Rocket,
  Target,
  Users,
  Briefcase,
  Code,
  TrendingUp,
  Calendar,
  Shield,
  Zap,
  Network,
  Award,
  Clock,
  DollarSign,
  Building2,
  Lightbulb,
  MessageCircle,
  Mic,
  Linkedin
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FOUNDER } from '@/lib/constants'
import { VoiceAgent } from '@/components/voice'

export const metadata: Metadata = {
  title: 'LaunchStack | Strategy. Product. Funding. One Package.',
  description: 'For experienced professionals building their next chapter. We turn your domain expertise and network into a funded startup — without you needing to code.',
}

export default function LaunchStackPage() {
  return (
    <>
      {/* Brand Header */}
      <section className="pt-12 pb-8 px-6 bg-black border-b border-gray-border">
        <div className="max-w-7xl mx-auto">
          {/* LaunchStack Branding */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">LaunchStack</h1>
            <p className="text-xl md:text-2xl text-accent font-medium">Strategy. Product. Funding. One package.</p>
          </div>

          {/* Partner Photos */}
          <div className="flex justify-center items-start gap-12 md:gap-24">
            {/* Dennis - Left */}
            <div className="text-center">
              <a
                href="https://www.linkedin.com/in/denniskl/"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-orange group-hover:border-accent transition-colors mx-auto mb-3">
                  <Image
                    src="/dennis_web_image.jpg"
                    alt="Dennis McMahon"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-bold text-white group-hover:text-accent transition-colors">Dennis McMahon</p>
                <p className="text-sm text-orange">Tech & Product</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-gray-light group-hover:text-accent transition-colors">
                  <Linkedin size={14} />
                  <span className="text-xs">LinkedIn</span>
                </div>
              </a>
            </div>

            {/* Daniel - Right */}
            <div className="text-center">
              <a
                href="https://www.linkedin.com/in/daniel-maneveld-2246a81b1/"
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-accent group-hover:border-orange transition-colors mx-auto mb-3">
                  {/* Add Daniel's photo to /public/daniel_maneveld.jpg */}
                  <Image
                    src="/daniel_image.jpg"
                    alt="Daniel Maneveld"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="font-bold text-white group-hover:text-accent transition-colors">Daniel Maneveld</p>
                <p className="text-sm text-accent">Strategy & GTM</p>
                <div className="flex items-center justify-center gap-1 mt-1 text-gray-light group-hover:text-accent transition-colors">
                  <Linkedin size={14} />
                  <span className="text-xs">LinkedIn</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hero */}
      <section className="section bg-grid">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Briefcase size={16} />
              For Experienced Professionals Building What&apos;s Next
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              You have the expertise.<br />
              <span className="text-accent">We build the tech.</span>
            </h2>

            <p className="text-xl text-gray-light mb-8 max-w-2xl">
              Turn decades of industry knowledge into a funded startup — in weeks, not years.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button href={FOUNDER.calendly} variant="primary" className="text-lg px-8 py-4">
                Book a Strategy Call <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button href="#how-it-works" variant="secondary" className="text-lg px-8 py-4">
                See How It Works
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-8 text-sm text-gray-light">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                No coding required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                Working MVP in 4-8 weeks
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                Investment-ready package
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Talk to Kira CTA */}
      <section className="py-12 px-6 bg-gradient-to-r from-accent/10 to-purple/10 border-y border-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                <Mic className="text-accent" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold">Not sure if this is right for you?</h3>
                <p className="text-gray-light">Talk to Kira — our AI thinking partner. She&apos;ll help you pressure-test your idea.</p>
              </div>
            </div>
            <div className="flex-shrink-0">
              {/* VoiceAgent auto-detects agent based on page path */}
              <VoiceAgent />
            </div>
          </div>
        </div>
      </section>

      {/* The Reality Check */}
      <section className="py-16 px-6 bg-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">You&apos;ve done the hard part already.</h2>
            <p className="text-xl text-gray-light mb-8">
              20+ years building expertise. A network that trusts you.
              You&apos;ve spotted a problem that needs solving — probably one you&apos;ve lived with for years.
            </p>
            <p className="text-xl text-white">
              The only thing between you and building it?
              <span className="text-accent"> The tech.</span>
            </p>
          </div>
        </div>
      </section>

      {/* What You Bring vs What We Bring */}
      <section className="section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">The Partnership</h2>
            <p className="text-gray-light text-lg">You bring what can&apos;t be taught. We bring what you don&apos;t have time to learn.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What You Bring */}
            <div className="card border-accent/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Award className="text-accent" size={24} />
                </div>
                <h3 className="text-2xl font-bold">What You Bring</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: Lightbulb, text: 'Deep domain expertise — you\'ve lived the problem' },
                  { icon: Network, text: 'A network of potential customers and partners' },
                  { icon: Target, text: 'Industry credibility that opens doors' },
                  { icon: Building2, text: 'Understanding of how enterprises actually buy' },
                  { icon: DollarSign, text: 'The resources to invest in doing this right' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <item.icon size={20} className="text-accent mt-1 flex-shrink-0" />
                    <span className="text-gray-light">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What We Bring */}
            <div className="card border-orange/30">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-orange/20 flex items-center justify-center">
                  <Rocket className="text-orange" size={24} />
                </div>
                <h3 className="text-2xl font-bold">What We Bring</h3>
              </div>
              <ul className="space-y-4">
                {[
                  { icon: Code, text: 'Full-stack AI development — MVPs in weeks' },
                  { icon: Target, text: 'Go-to-market strategy and positioning' },
                  { icon: Briefcase, text: 'Brand, website, and pitch deck design' },
                  { icon: Users, text: 'Investor network and fundraising support' },
                  { icon: Zap, text: '35+ years combined startup and tech experience' },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <item.icon size={20} className="text-orange mt-1 flex-shrink-0" />
                    <span className="text-gray-light">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section bg-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-light text-lg">A clear path from idea to investment-ready</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Strategy Session',
                description: 'We dive deep into your domain expertise, target market, and competitive landscape. Define the MVP scope together.',
                time: 'Week 1',
                owner: 'JustFound + You'
              },
              {
                step: '02',
                title: 'Brand & Positioning',
                description: 'Website, messaging, and visual identity that positions you credibly in the market. Investor-ready from day one.',
                time: 'Week 2-3',
                owner: 'JustFound'
              },
              {
                step: '03',
                title: 'Build the MVP',
                description: 'We build your product — AI-powered where it matters. Real software, real users, real feedback.',
                time: 'Week 3-6',
                owner: 'Corporate AI Solutions'
              },
              {
                step: '04',
                title: 'Launch & Raise',
                description: 'Go-to-market execution, pitch deck, investor introductions. Everything you need to close your round.',
                time: 'Week 6+',
                owner: 'JustFound + You'
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="card h-full">
                  <div className="text-5xl font-bold text-accent/20 mb-4">{item.step}</div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-gray-light text-sm mb-4">{item.description}</p>
                  <div className="mt-auto pt-4 border-t border-gray-border">
                    <div className="flex items-center gap-2 text-xs text-gray-light">
                      <Clock size={12} />
                      {item.time}
                    </div>
                    <div className="text-xs text-accent mt-1">{item.owner}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Package Tiers */}
      <section id="packages" className="section">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Path</h2>
            <p className="text-gray-light text-lg">Three packages. One outcome: a fundable business.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Launch Ready */}
            <div className="card border-gray-border hover:border-accent/50 transition-colors">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Launch Ready</h3>
                <p className="text-gray-light">Validate fast. Look legit.</p>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-accent">3-4 weeks</div>
                <div className="text-sm text-gray-light">to market</div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <div className="text-xs text-accent uppercase tracking-wide mb-2">Strategy & Brand</div>
                  <ul className="space-y-2 text-sm text-gray-light">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Brand positioning & messaging</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Conversion-focused landing page</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Basic go-to-market playbook</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-orange uppercase tracking-wide mb-2">Product</div>
                  <ul className="space-y-2 text-sm text-gray-light">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Technical scoping session</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Simple AI tool or agent</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Deployed MVP</li>
                  </ul>
                </div>
              </div>

              <div className="text-sm text-gray-light mb-6">
                <strong className="text-white">Best for:</strong> Testing an idea before committing fully
              </div>

              <Button href={FOUNDER.calendly} variant="secondary" className="w-full">
                Discuss Launch Ready
              </Button>
            </div>

            {/* Market Ready - Featured */}
            <div className="card border-accent bg-accent/5 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-accent text-black text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Market Ready</h3>
                <p className="text-gray-light">Ready to raise. Ready to scale.</p>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-accent">6-8 weeks</div>
                <div className="text-sm text-gray-light">to investment-ready</div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <div className="text-xs text-accent uppercase tracking-wide mb-2">Strategy & Brand</div>
                  <ul className="space-y-2 text-sm text-gray-light">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Full brand identity & website</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Sales funnel setup</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Investor pitch deck design</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> GTM strategy session</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-orange uppercase tracking-wide mb-2">Product</div>
                  <ul className="space-y-2 text-sm text-gray-light">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Custom AI-powered MVP</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Key integrations (CRM, email, etc.)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Technical documentation</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> 30-day post-launch support</li>
                  </ul>
                </div>
              </div>

              <div className="text-sm text-gray-light mb-6">
                <strong className="text-white">Best for:</strong> Founders preparing to raise pre-seed or seed
              </div>

              <Button href={FOUNDER.calendly} variant="primary" className="w-full">
                Discuss Market Ready
              </Button>
            </div>

            {/* Scale Ready */}
            <div className="card border-gray-border hover:border-orange/50 transition-colors">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Scale Ready</h3>
                <p className="text-gray-light">Full execution partnership.</p>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold text-orange">8-12 weeks</div>
                <div className="text-sm text-gray-light">+ ongoing retainer</div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <div className="text-xs text-accent uppercase tracking-wide mb-2">Strategy & Brand</div>
                  <ul className="space-y-2 text-sm text-gray-light">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Everything in Market Ready</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Ongoing strategic advisory</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Content & PR support</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Investor introductions</li>
                  </ul>
                </div>
                <div>
                  <div className="text-xs text-orange uppercase tracking-wide mb-2">Product</div>
                  <ul className="space-y-2 text-sm text-gray-light">
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Full product build (multi-feature)</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> AI agent ecosystem</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Ongoing technical iteration</li>
                    <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-orange" /> Dedicated development capacity</li>
                  </ul>
                </div>
              </div>

              <div className="text-sm text-gray-light mb-6">
                <strong className="text-white">Best for:</strong> Post-funding founders scaling operations
              </div>

              <Button href={FOUNDER.calendly} variant="orange" className="w-full">
                Discuss Scale Ready
              </Button>
            </div>
          </div>

          {/* Platform Access Note */}
          <div className="mt-12 p-6 bg-gray-dark rounded-lg border border-gray-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center flex-shrink-0">
                <Zap className="text-purple" size={20} />
              </div>
              <div>
                <h4 className="font-bold mb-2">Bonus: Platform Access</h4>
                <p className="text-gray-light text-sm">
                  All LaunchStack clients get access to our suite of AI platforms — including <strong className="text-white">RaiseReady</strong> for pitch practice, <strong className="text-white">Kira</strong> for strategic thinking, and <strong className="text-white">LaunchReady</strong> for IP protection.
                  Use them yourself or deploy them for your own customers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section bg-gray-dark">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Built for founders like you</h2>
              <p className="text-gray-light mb-8">
                You&apos;re not a 23-year-old in a hoodie. You&apos;ve run teams, closed deals, and navigated corporate politics.
                You know how to execute — you just need the right technical partner to move fast.
              </p>

              <div className="space-y-4">
                {[
                  'Ex-executives who\'ve spotted a gap in their industry',
                  'Consultants ready to productize their expertise',
                  'Industry veterans tired of watching amateurs get funded',
                  'Corporate refugees who want to build something that matters',
                  'Professionals with networks that would love to buy from them',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-accent flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-black/50">
              <h3 className="text-xl font-bold mb-4 text-accent">The Profile We Look For</h3>
              <p className="text-sm text-gray-light mb-6">
                We&apos;re selective. We work with founders who have real potential for meaningful outcomes.
              </p>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-gray-dark rounded-lg">
                  <div className="font-bold mb-1">$1M ARR Capacity</div>
                  <div className="text-gray-light">Clear path to meaningful revenue, not just &quot;cool tech&quot;</div>
                </div>
                <div className="p-4 bg-gray-dark rounded-lg">
                  <div className="font-bold mb-1">Identified Buyers</div>
                  <div className="text-gray-light">You know who pays for this and can reach them</div>
                </div>
                <div className="p-4 bg-gray-dark rounded-lg">
                  <div className="font-bold mb-1">Domain Credibility</div>
                  <div className="text-gray-light">You&apos;ve lived the problem you&apos;re solving</div>
                </div>
                <div className="p-4 bg-gray-dark rounded-lg">
                  <div className="font-bold mb-1">Exit Awareness</div>
                  <div className="text-gray-light">You understand who acquires companies in your space</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Talk to Kira - Mid Page */}
      <section className="section bg-gradient-to-b from-black to-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="text-accent" size={36} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Still thinking it through?</h2>
          <p className="text-gray-light mb-8">
            Talk to Kira. She&apos;s our AI thinking partner — designed to help experienced professionals
            like you pressure-test ideas and get clarity before committing. No pitch. Just a conversation.
          </p>
          <p className="text-sm text-gray-light">
            Click the chat button in the bottom right corner to start a conversation.
          </p>
        </div>
      </section>

      {/* Portfolio Potential */}
      <section className="section">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-purple/10 text-purple px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Shield size={16} />
              For Select Founders
            </div>
            <h2 className="text-3xl font-bold mb-6">Long Tail AI Studio Portfolio</h2>
            <p className="text-gray-light mb-8">
              Founders who meet our investment thesis may be invited to join the Long Tail AI Studio portfolio.
              This means more than just building — it means partnership.
            </p>

            <div className="grid sm:grid-cols-3 gap-6 text-left">
              {[
                { title: 'Equity Partnership', description: 'We take 0.5-2% equity in exchange for reduced fees and ongoing commitment' },
                { title: 'Portfolio Visibility', description: 'Featured in our portfolio, case studies, and investor communications' },
                { title: 'Network Access', description: 'Introductions to our corporate network and investor relationships' },
              ].map((item, i) => (
                <div key={i} className="card">
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-light">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>

          <div className="space-y-6">
            {[
              {
                q: 'I\'m not technical. Will I be able to manage this product?',
                a: 'That\'s the whole point. We build products that you can operate without coding. And we\'re available ongoing to iterate and improve as you learn from your market.'
              },
              {
                q: 'How much does this cost?',
                a: 'It depends on scope. Launch Ready starts around $15-25k, Market Ready $40-60k, Scale Ready is custom. We also offer equity arrangements for the right founders. Let\'s talk about what makes sense for your situation.'
              },
              {
                q: 'What if I\'m not sure my idea will work?',
                a: 'That\'s what Launch Ready is for. Validate fast, learn, then decide whether to go deeper. We\'d rather you test cheaply than bet big on an unvalidated concept.'
              },
              {
                q: 'How is this different from hiring an agency?',
                a: 'Agencies build what you spec. We help you figure out what to build, then build it, then help you sell it and raise for it. We\'re partners, not vendors.'
              },
              {
                q: 'Do you take equity in every deal?',
                a: 'No. Equity partnerships are reserved for founders who meet our portfolio criteria and want a deeper, longer-term relationship. Most clients start with a fee-based engagement.'
              },
              {
                q: 'What industries do you work in?',
                a: 'We\'re industry-agnostic but thesis-driven. If there\'s a clear corporate buyer at a 6-10x multiple and you have domain credibility, we\'re interested. We\'ve built for tourism, healthcare, government, real estate, legal, and more.'
              },
            ].map((item, i) => (
              <div key={i} className="card">
                <h3 className="font-bold mb-2">{item.q}</h3>
                <p className="text-gray-light text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section bg-gradient-to-b from-gray-dark to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to build your next chapter?
          </h2>
          <p className="text-xl text-gray-light mb-8">
            You&apos;ve spent decades becoming an expert. Let&apos;s spend a few weeks turning that into a company.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button href={FOUNDER.calendly} variant="primary" className="text-lg px-8 py-4">
              Book a Strategy Call <Calendar size={20} className="ml-2" />
            </Button>
          </div>
          <p className="text-sm text-gray-light mb-6">
            30-minute call. No pitch. Just a conversation about what you&apos;re building.
          </p>

          {/* Or talk to Kira */}
          <div className="pt-6 border-t border-gray-border">
            <p className="text-sm text-gray-light mb-4">Or pressure-test your idea first — click the chat button below</p>
          </div>
        </div>
      </section>

      {/* VoiceAgent - renders floating button */}
      <VoiceAgent />
    </>
  )
}