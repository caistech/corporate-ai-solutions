'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { PLATFORMS } from '@/lib/constants'

const livePlatforms = PLATFORMS.filter(p => p.status === 'live')

function Slide({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen flex items-center justify-center px-8 py-16 ${className}`}>
      <div className="max-w-5xl w-full mx-auto">
        {children}
      </div>
    </div>
  )
}

function SlideNumber({ current, total }: { current: number; total: number }) {
  return (
    <div className="fixed bottom-6 right-8 font-mono text-xs text-gray-500 z-50">
      {current} / {total}
    </div>
  )
}

export default function DeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 14

  const goTo = useCallback((n: number) => {
    const target = Math.max(0, Math.min(n, totalSlides - 1))
    setCurrentSlide(target)
    const el = document.getElementById(`slide-${target}`)
    el?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault()
        goTo(currentSlide + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        goTo(currentSlide - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [currentSlide, goTo])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id
            const num = parseInt(id.replace('slide-', ''))
            if (!isNaN(num)) setCurrentSlide(num)
          }
        })
      },
      { threshold: 0.5 }
    )
    for (let i = 0; i < totalSlides; i++) {
      const el = document.getElementById(`slide-${i}`)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Navigation */}
      <div className="fixed bottom-6 left-8 flex items-center gap-3 z-50">
        <button
          onClick={() => goTo(currentSlide - 1)}
          disabled={currentSlide === 0}
          className="p-2 bg-white/10 rounded hover:bg-white/20 disabled:opacity-20 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => goTo(currentSlide + 1)}
          disabled={currentSlide === totalSlides - 1}
          className="p-2 bg-white/10 rounded hover:bg-white/20 disabled:opacity-20 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <SlideNumber current={currentSlide + 1} total={totalSlides} />

      {/* Slide 0: Cover */}
      <div id="slide-0">
        <Slide>
          <div className="text-center">
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-8">Long Tail AI Venture Studio</p>
            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
              The Factory That Builds<br />
              <span className="bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent">AI Companies</span>
            </h1>
            <p className="text-xl text-gray-400 mb-12">
              38 platforms. One founder. Zero employees. Near-zero marginal cost.
            </p>
            <div className="flex justify-center gap-8 font-mono text-sm text-gray-500">
              <span>Dennis McMahon</span>
              <span>|</span>
              <span>Founder & CEO</span>
              <span>|</span>
              <span>2026</span>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 1: The Problem */}
      <div id="slide-1">
        <Slide className="bg-[#111]">
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">The Problem</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-12">
              Every industry has dozens of painful problems<br />
              <span className="text-gray-500">that will never attract VC funding.</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-3xl font-bold text-red-400 mb-2">$500K+</div>
                <p className="text-gray-400">Cost to build one SaaS product the old way</p>
              </div>
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-3xl font-bold text-red-400 mb-2">18 months</div>
                <p className="text-gray-400">Time to ship with a traditional team</p>
              </div>
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-3xl font-bold text-red-400 mb-2">90%</div>
                <p className="text-gray-400">Of VC-backed startups fail completely</p>
              </div>
            </div>
            <p className="text-xl text-gray-400 mt-12">
              Thousands of real problems go unsolved because the economics didn&apos;t work. <strong className="text-white">Until now.</strong>
            </p>
          </div>
        </Slide>
      </div>

      {/* Slide 2: The Insight */}
      <div id="slide-2">
        <Slide>
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">The Insight</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-12">
              AI collapsed the cost of building<br />software by 100x.
            </h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-8 border-2 border-[#00ff88]/30 rounded-lg text-center bg-[#00ff88]/5">
                <div className="font-mono text-sm text-[#00ff88] mb-3">BUILD COST</div>
                <div className="text-2xl font-bold"><span className="text-gray-500 line-through">$500K</span> → <span className="text-[#00ff88]">$5K</span></div>
                <div className="text-sm text-gray-400 mt-2">100x reduction</div>
              </div>
              <div className="p-8 border-2 border-[#00ff88]/30 rounded-lg text-center bg-[#00ff88]/5">
                <div className="font-mono text-sm text-[#00ff88] mb-3">TIME TO SHIP</div>
                <div className="text-2xl font-bold"><span className="text-gray-500 line-through">18 months</span> → <span className="text-[#00ff88]">7 days</span></div>
                <div className="text-sm text-gray-400 mt-2">75x faster</div>
              </div>
              <div className="p-8 border-2 border-[#00ff88]/30 rounded-lg text-center bg-[#00ff88]/5">
                <div className="font-mono text-sm text-[#00ff88] mb-3">INFRASTRUCTURE</div>
                <div className="text-2xl font-bold"><span className="text-gray-500 line-through">$millions</span> → <span className="text-[#00ff88]">$200/mo</span></div>
                <div className="text-sm text-gray-400 mt-2">Serverless, pay-as-you-go</div>
              </div>
            </div>
            <p className="text-2xl text-center font-semibold">
              This creates a new category of company:<br />
              <span className="text-[#00ff88]">the AI venture factory.</span>
            </p>
          </div>
        </Slide>
      </div>

      {/* Slide 3: The Solution */}
      <div id="slide-3">
        <Slide className="bg-[#111]">
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">The Solution</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              We built the machine that<br />
              <span className="bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent">manufactures AI companies.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12">
              One founder + AI agents replaces a full product and GTM team.
              Each product costs $5K and ships in 7 days.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: '01', title: 'Find Problem', desc: 'Identify underserved niche', time: 'Day 1' },
                { step: '02', title: 'Build Product', desc: 'AI-powered SaaS platform', time: 'Day 2-5' },
                { step: '03', title: 'Deploy & Sell', desc: 'Vercel + Stripe + RevAgent', time: 'Day 6-7' },
                { step: '04', title: 'Compound', desc: 'Add to portfolio ARR', time: 'Ongoing' },
              ].map((item) => (
                <div key={item.step} className="p-6 border border-white/10 rounded-lg">
                  <div className="font-mono text-[#00ff88] text-sm mb-3">{item.step}</div>
                  <div className="font-bold text-lg mb-1">{item.title}</div>
                  <div className="text-sm text-gray-400 mb-3">{item.desc}</div>
                  <div className="font-mono text-xs text-gray-500">{item.time}</div>
                </div>
              ))}
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 4: Proof */}
      <div id="slide-4">
        <Slide>
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Proof</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              38 platforms built in 12 months.
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Not prototypes. Production SaaS with auth, billing, databases, and AI workflows.
            </p>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-10">
              {livePlatforms.slice(0, 24).map((p) => (
                <div key={p.id} className="p-3 border border-white/10 rounded text-center hover:border-[#00ff88]/50 transition-colors">
                  <div className="text-xs font-bold truncate">{p.name}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-[#00ff88]">38</div>
                <div className="text-sm text-gray-400">Platforms live</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#00ff88]">$5K</div>
                <div className="text-sm text-gray-400">Avg build cost</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#00ff88]">7 days</div>
                <div className="text-sm text-gray-400">Avg build time</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-[#00ff88]">~$85K</div>
                <div className="text-sm text-gray-400">Total invested</div>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 5: What We've Built (categories) */}
      <div id="slide-5">
        <Slide className="bg-[#111]">
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Portfolio Span</p>
            <h2 className="text-4xl font-bold mb-10">6 industries. 38 products. All from one factory.</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { cat: 'Construction & Compliance', products: 'MMC Build, Checkpoint, NDIS SDA Automate', color: '#00ff88' },
                { cat: 'Voice AI & Coaching', products: 'Rehearsals AI, Kira, RaiseReady, Connexions', color: '#00ff88' },
                { cat: 'Real-Time Translation', products: 'UniversalLingo + 8 verticals (Tour, Gov, Hotel, Doctor...)', color: '#00d4ff' },
                { cat: 'Property & Finance', products: 'DealFindrs, F2K Fund Tokenisation (ERC-3643)', color: '#ff6b35' },
                { cat: 'Business Tools', products: 'TenderWatch, R&D Tax Tracker, OutreachReady, CleanClose', color: '#ff6b35' },
                { cat: 'Platform Infrastructure', products: 'EasyOpenClaw, Venture Studio Dashboard, StoryVerse', color: '#a855f7' },
              ].map((item) => (
                <div key={item.cat} className="p-6 border border-white/10 rounded-lg">
                  <div className="text-sm font-bold mb-2" style={{ color: item.color }}>{item.cat}</div>
                  <p className="text-sm text-gray-400">{item.products}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 mt-8">
              4 generator platforms can spin up new white-label verticals in days.
            </p>
          </div>
        </Slide>
      </div>

      {/* Slide 6: The Tech Stack */}
      <div id="slide-6">
        <Slide>
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">How It Works</p>
            <h2 className="text-4xl font-bold mb-10">The factory stack</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="font-bold text-xl mb-6 text-[#00ff88]">Build Engine</h3>
                <div className="space-y-4">
                  {[
                    { tool: 'Claude Code', role: 'AI coding agent — the engineering team' },
                    { tool: 'Next.js + Vercel', role: 'Frontend + deployment in minutes' },
                    { tool: 'Supabase', role: 'Database, auth, RLS — instant backend' },
                    { tool: 'Stripe', role: 'Billing infrastructure' },
                    { tool: 'ElevenLabs', role: 'Voice AI agents' },
                  ].map((item) => (
                    <div key={item.tool} className="flex gap-4 items-start">
                      <div className="font-mono text-sm text-[#00ff88] w-32 shrink-0">{item.tool}</div>
                      <div className="text-sm text-gray-400">{item.role}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-xl mb-6 text-[#ff6b35]">GTM Engine (RevAgent)</h3>
                <div className="space-y-4">
                  {[
                    { tool: 'Agentic GTM', role: 'AI agents run campaigns across portfolio' },
                    { tool: 'Channel Partners', role: 'Industry experts distribute products' },
                    { tool: 'Voice Agents', role: '5 deployed — sales, qualify, support' },
                    { tool: 'HeyGen Avatar', role: 'Unlimited video content at zero cost' },
                    { tool: 'Content Engine', role: 'AI-generated marketing per product' },
                  ].map((item) => (
                    <div key={item.tool} className="flex gap-4 items-start">
                      <div className="font-mono text-sm text-[#ff6b35] w-32 shrink-0">{item.tool}</div>
                      <div className="text-sm text-gray-400">{item.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 7: Portfolio Math */}
      <div id="slide-7">
        <Slide className="bg-[#111]">
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Portfolio Math</p>
            <h2 className="text-4xl font-bold mb-10">The portfolio compounds.</h2>
            <div className="space-y-4 mb-10">
              <div className="flex justify-between items-center p-4 border border-white/10 rounded-lg">
                <span className="text-gray-400">20% of products fail</span>
                <span className="font-mono text-red-400">-$200K</span>
              </div>
              <div className="flex justify-between items-center p-4 border border-white/10 rounded-lg">
                <span className="text-gray-400">50% break even</span>
                <span className="font-mono">$0</span>
              </div>
              <div className="flex justify-between items-center p-4 border border-[#00ff88]/30 rounded-lg bg-[#00ff88]/5">
                <span>25% steady earners ($10K MRR each)</span>
                <span className="font-mono text-[#00ff88]">$250K MRR</span>
              </div>
              <div className="flex justify-between items-center p-4 border border-[#00ff88]/30 rounded-lg bg-[#00ff88]/5">
                <span>5% breakouts ($50K+ MRR each)</span>
                <span className="font-mono text-[#00ff88]">$250K+ MRR</span>
              </div>
              <div className="flex justify-between items-center p-5 bg-[#00ff88] text-black rounded-lg font-bold text-lg">
                <span>100 platforms total</span>
                <span className="font-mono">$500K+ MRR = $6M+ ARR</span>
              </div>
            </div>
            <p className="text-center text-gray-500">This is just phase one. At 200 platforms, the math gets much bigger.</p>
          </div>
        </Slide>
      </div>

      {/* Slide 8: The $2B Slide */}
      <div id="slide-8">
        <Slide>
          <div className="text-center">
            <p className="font-mono text-sm text-[#ff6b35] tracking-widest uppercase mb-4">At Scale</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-12">The factory at 200 products</h2>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="p-8 border-2 border-[#ff6b35]/50 rounded-lg bg-[#ff6b35]/5">
                <div className="font-mono text-sm text-[#ff6b35] mb-3">PORTFOLIO ARR</div>
                <div className="text-5xl font-bold">$200M+</div>
                <div className="text-sm text-gray-400 mt-2">200 products × $1M avg ARR</div>
              </div>
              <div className="p-8 border-2 border-[#ff6b35]/50 rounded-lg bg-[#ff6b35]/5">
                <div className="font-mono text-sm text-[#ff6b35] mb-3">SAAS MULTIPLE</div>
                <div className="text-5xl font-bold">10-15x</div>
                <div className="text-sm text-gray-400 mt-2">Portfolio SaaS standard</div>
              </div>
              <div className="p-8 border-2 border-[#ff6b35]/50 rounded-lg bg-[#ff6b35]/5">
                <div className="font-mono text-sm text-[#ff6b35] mb-3">VALUATION</div>
                <div className="text-5xl font-bold bg-gradient-to-r from-[#ff6b35] to-[#ff9500] bg-clip-text text-transparent">$2B+</div>
                <div className="text-sm text-gray-400 mt-2">The unicorn is the factory</div>
              </div>
            </div>
            <p className="text-xl text-gray-400">
              Individual exits at $6-10M each are <strong className="text-white">optional liquidity events</strong>, not the strategy.
            </p>
          </div>
        </Slide>
      </div>

      {/* Slide 9: Business Model */}
      <div id="slide-9">
        <Slide className="bg-[#111]">
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Business Model</p>
            <h2 className="text-4xl font-bold mb-10">Three return mechanisms</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 border-2 border-[#00ff88]/30 rounded-lg">
                <div className="font-mono text-sm text-[#00ff88] mb-4">01 — PORTFOLIO ARR</div>
                <div className="text-3xl font-bold mb-3">$200M+</div>
                <p className="text-sm text-gray-400">
                  Subscriptions compound monthly. Each new product adds to total ARR.
                  The main play — hold and compound.
                </p>
              </div>
              <div className="p-8 border-2 border-[#ff6b35]/30 rounded-lg">
                <div className="font-mono text-sm text-[#ff6b35] mb-4">02 — STRATEGIC EXITS</div>
                <div className="text-3xl font-bold mb-3">6-10x ARR</div>
                <p className="text-sm text-gray-400">
                  Products at $1M ARR sell to corporates at $6-10M.
                  Optional cash events. Corporates can&apos;t build this fast.
                </p>
              </div>
              <div className="p-8 border-2 border-[#a855f7]/30 rounded-lg">
                <div className="font-mono text-sm text-[#a855f7] mb-4">03 — FACTORY VALUE</div>
                <div className="text-3xl font-bold mb-3">$2B+</div>
                <p className="text-sm text-gray-400">
                  The build engine itself is the most valuable asset.
                  Replicable, scalable, defensible.
                </p>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 10: Why Now */}
      <div id="slide-10">
        <Slide>
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Why Now</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-12">
              The window is open.<br />
              <span className="text-gray-500">It won&apos;t stay open.</span>
            </h2>
            <div className="space-y-8">
              <div className="flex gap-6 items-start">
                <div className="font-mono text-[#00ff88] text-sm shrink-0 w-8">01</div>
                <div>
                  <h3 className="font-bold text-xl mb-2">AI build cost collapse</h3>
                  <p className="text-gray-400">Claude + AI agents cut dev cost 100x. One person ships what took teams of 10. This is temporary — in 3 years, everyone catches up.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="font-mono text-[#00ff88] text-sm shrink-0 w-8">02</div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Infrastructure is free</h3>
                  <p className="text-gray-400">Vercel, Supabase, Stripe — serverless, pay-as-you-go. 38 products run on $200/month. Zero capital expenditure.</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className="font-mono text-[#00ff88] text-sm shrink-0 w-8">03</div>
                <div>
                  <h3 className="font-bold text-xl mb-2">Corporate AI FOMO</h3>
                  <p className="text-gray-400">Every mid-market company wants AI but can&apos;t build it. They&apos;ll acquire at 6-10x rather than spend 4 years building internally.</p>
                </div>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 11: Competition */}
      <div id="slide-11">
        <Slide className="bg-[#111]">
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Competition</p>
            <h2 className="text-4xl font-bold mb-10">They sell shovels. We mine the gold.</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 pr-6 text-gray-500 font-mono text-xs"></th>
                    <th className="text-left py-4 px-6 text-gray-500 font-mono text-xs">TRAD. STUDIOS</th>
                    <th className="text-left py-4 px-6 text-gray-500 font-mono text-xs">AI APP BUILDERS</th>
                    <th className="text-left py-4 px-6 text-[#00ff88] font-mono text-xs">LONG TAIL AI</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-6 font-medium text-white">Products/year</td>
                    <td className="py-3 px-6">3-5</td>
                    <td className="py-3 px-6">Tools, not products</td>
                    <td className="py-3 px-6 text-[#00ff88] font-bold">38+</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-6 font-medium text-white">Cost per product</td>
                    <td className="py-3 px-6">$500K-2M</td>
                    <td className="py-3 px-6">N/A</td>
                    <td className="py-3 px-6 text-[#00ff88] font-bold">$5K</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-6 font-medium text-white">Team per product</td>
                    <td className="py-3 px-6">10-20 people</td>
                    <td className="py-3 px-6">Customer&apos;s team</td>
                    <td className="py-3 px-6 text-[#00ff88] font-bold">1 person + AI</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-6 font-medium text-white">Revenue model</td>
                    <td className="py-3 px-6">Equity in spinoffs</td>
                    <td className="py-3 px-6">Platform fees</td>
                    <td className="py-3 px-6 text-[#00ff88] font-bold">Own 100% of ARR</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-6 font-medium text-white">Outcome needed</td>
                    <td className="py-3 px-6">Unicorn per company</td>
                    <td className="py-3 px-6">User growth</td>
                    <td className="py-3 px-6 text-[#00ff88] font-bold">Portfolio compounds</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 12: Traction & Roadmap */}
      <div id="slide-12">
        <Slide>
          <div>
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">Traction & Roadmap</p>
            <h2 className="text-4xl font-bold mb-10">Where we are. Where we&apos;re going.</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border-2 border-[#00ff88] rounded-lg bg-[#00ff88]/5">
                <div className="font-mono text-sm text-[#00ff88] mb-3">DONE — Year 0</div>
                <h3 className="font-bold text-lg mb-4">Factory Built</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>38 platforms deployed</li>
                  <li>First paying client (MMC Build)</li>
                  <li>5 voice AI agents live</li>
                  <li>4 generator platforms</li>
                  <li>RevAgent GTM system</li>
                  <li>HeyGen avatar content</li>
                </ul>
              </div>
              <div className="p-6 border border-white/20 rounded-lg">
                <div className="font-mono text-sm text-[#ff6b35] mb-3">NEXT — Year 1</div>
                <h3 className="font-bold text-lg mb-4">Monetise</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>50 platforms total</li>
                  <li>$100K MRR target</li>
                  <li>Stripe billing on all products</li>
                  <li>RevAgent across portfolio</li>
                  <li>First strategic exits</li>
                </ul>
              </div>
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="font-mono text-sm text-[#a855f7] mb-3">SCALE — Year 2-3</div>
                <h3 className="font-bold text-lg mb-4">Compound</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>200+ platforms</li>
                  <li>$2M+ MRR ($24M+ ARR)</li>
                  <li>Factory replication playbook</li>
                  <li>Path to $200M ARR visible</li>
                </ul>
              </div>
            </div>
          </div>
        </Slide>
      </div>

      {/* Slide 13: The Ask */}
      <div id="slide-13">
        <Slide className="bg-[#111]">
          <div className="text-center">
            <p className="font-mono text-sm text-[#00ff88] tracking-widest uppercase mb-4">The Ask</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-8">$500K to prove the factory scales.</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-2xl font-bold text-[#00ff88] mb-2">40%</div>
                <div className="font-bold mb-1">GTM</div>
                <div className="text-sm text-gray-400">RevAgent monetisation across all 38 products</div>
              </div>
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-2xl font-bold text-[#ff6b35] mb-2">40%</div>
                <div className="font-bold mb-1">Hardening</div>
                <div className="text-sm text-gray-400">Stripe billing, onboarding, enterprise features</div>
              </div>
              <div className="p-6 border border-white/10 rounded-lg">
                <div className="text-2xl font-bold text-[#a855f7] mb-2">20%</div>
                <div className="font-bold mb-1">Pipeline</div>
                <div className="text-sm text-gray-400">Build next 30 products from problem backlog</div>
              </div>
            </div>
            <div className="max-w-2xl mx-auto p-8 border-2 border-[#00ff88] rounded-lg bg-[#00ff88]/5">
              <p className="text-2xl font-bold mb-4">
                The unicorn isn&apos;t the product.<br />
                <span className="bg-gradient-to-r from-[#00ff88] to-[#00d4ff] bg-clip-text text-transparent">It&apos;s the factory.</span>
              </p>
              <p className="text-gray-400">
                38 products built. First revenue. One founder. Zero employees.
                The factory works. Now we scale.
              </p>
            </div>
            <div className="mt-10 flex justify-center gap-6 font-mono text-sm">
              <a href="mailto:invest@corporateaisolutions.com" className="text-[#00ff88] hover:text-white transition-colors">
                invest@corporateaisolutions.com
              </a>
              <span className="text-gray-500">|</span>
              <a href="https://www.calendly.com/mcmdennis" target="_blank" rel="noopener noreferrer" className="text-[#00ff88] hover:text-white transition-colors">
                Book a call
              </a>
              <span className="text-gray-500">|</span>
              <a href="https://corporateaisolutions.com" target="_blank" rel="noopener noreferrer" className="text-[#00ff88] hover:text-white transition-colors">
                corporateaisolutions.com
              </a>
            </div>
          </div>
        </Slide>
      </div>
    </>
  )
}
