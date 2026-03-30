'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SKOOL } from '@/lib/constants'

export default function PartnerPage() {
  const [formState, setFormState] = useState({ isSubmitting: false, isSuccess: false })
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', industry: '', yearsInIndustry: '', problem: '', whyYou: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({ isSubmitting: true, isSuccess: false })
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          industry: formData.industry,
          years_in_industry: formData.yearsInIndustry,
          problem_description: formData.problem,
          why_you: formData.whyYou,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setFormState({ isSubmitting: false, isSuccess: true })
    } catch {
      setFormState({ isSubmitting: false, isSuccess: false })
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="tag tag-center mb-4">For Industry Veterans</div>
          <h1 className="mb-6">
            You Know Exactly What&apos;s <span className="text-gradient-orange">Broken</span><br />
            In Your Industry.
          </h1>
          <p className="text-xl text-gray-light max-w-3xl mx-auto">
            After 20, 30, 40 years in your field, you see the inefficiencies everyone else ignores.
            The workarounds that cost millions. The problems no one has bothered to fix with software
            because the people building software <strong className="text-white">don&apos;t understand your world.</strong>
          </p>
          <p className="text-xl text-white mt-6 font-semibold">
            We do. And we want to build it with you — as co-founders, not clients.
          </p>
        </div>
      </section>

      {/* The Problem We're Solving */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <div className="card-orange p-8 md:p-12">
            <h2 className="text-2xl font-bold mb-6 text-orange">Why We Need You (Not Another 25-Year-Old With an Idea)</h2>
            <p className="text-gray-light mb-4">
              Most AI companies are built by technologists guessing at industry problems.
              We tried that ourselves — we built SmartBoard, an airline boarding optimization tool.
              It&apos;s clever technology, but we&apos;re not from the airline industry.
              <strong className="text-white"> We&apos;re guessing at the pain points.</strong>
            </p>
            <p className="text-gray-light mb-4">
              Compare that to F2K, our construction compliance platform — built because our founder
              spent years in modular construction and knew <em>exactly</em> where the waste was.
              That product sells itself because it was born from real operational pain.
            </p>
            <p className="text-gray-light mb-4">
              <strong className="text-white">That&apos;s the difference between domain knowledge and guesswork.</strong>
              And that&apos;s why we&apos;re looking for people like you.
            </p>
            <p className="text-lg text-white">
              You&apos;ve spent decades learning what&apos;s broken. We can build the fix in days, not years.
              Together, we launch a product your industry will actually pay for — and you own a meaningful share of it.
            </p>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="tag tag-center mb-4">Is This You?</div>
            <h2>This Partnership Is Specifically For People Who...</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Have 15+ years in their industry',
                desc: "You've seen what works, what doesn't, and what everyone complains about but nobody fixes. Your experience IS the product specification."
              },
              {
                title: 'Know the real problems (not the obvious ones)',
                desc: "Anyone can see the surface issues. You know the ones that cost real money — the inefficiencies hidden inside workflows, compliance, logistics, or operations."
              },
              {
                title: 'Have a rolodex (and credibility) in their field',
                desc: "You know the decision-makers. When you say 'this tool solves X,' people in your industry listen because you've earned that trust over decades."
              },
              {
                title: 'Want to build something, not just consult',
                desc: "You're not looking for a consulting gig. You want equity in a product that solves the problems you've spent your career fighting. You want to be a co-founder."
              },
              {
                title: "Are ready to be a co-founder, not a customer",
                desc: "This isn't a service we sell you. You bring the domain expertise, the connections, and the credibility. We bring the AI engineering and go-to-market machine. Equal partners."
              },
              {
                title: 'Are tired of watching outsiders get it wrong',
                desc: "You've seen tech companies enter your industry with flashy products that miss the point. You know exactly what the product SHOULD look like — you just need someone who can build it."
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="text-orange text-xl mt-1 shrink-0">&#10003;</span>
                <div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-light">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2>How the Partnership Works</h2>
          </div>
          <div className="space-y-8">
            {[
              {
                num: '01',
                title: 'You tell us what you know',
                desc: 'A conversation — not a pitch deck. Walk us through the problems you see every day. The workarounds your industry uses. The things that cost money, waste time, or create risk. We listen.'
              },
              {
                num: '02',
                title: 'We design the solution together',
                desc: 'You define what the product needs to do. We figure out how to build it with AI. You keep us honest about whether it actually solves the problem — because you\'ve lived it.'
              },
              {
                num: '03',
                title: 'We build it — fast',
                desc: 'Our AI-native engineering process means we ship working products in days, not months. You see progress immediately. You give feedback on real software, not mockups.'
              },
              {
                num: '04',
                title: 'You help us sell it (because your network trusts you)',
                desc: 'You introduce the product to your industry. Your credibility opens doors that no amount of cold outreach ever could. When your peers see YOU behind it, they pay attention.'
              },
              {
                num: '05',
                title: 'Revenue is shared — permanently',
                desc: 'This is not a finder\'s fee. You are a co-founder of the product. As it grows, you earn. Your decades of knowledge become a revenue-generating asset — potentially for years to come.'
              },
            ].map((step) => (
              <div key={step.num} className="flex gap-6">
                <div className="font-mono text-3xl font-bold text-orange shrink-0">{step.num}</div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  <p className="text-gray-light">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Economics */}
      <section className="section">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">The Deal</h2>
          <p className="text-center text-gray-light mb-8">
            No investment required. No technical skills needed. Your knowledge is the investment.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="card">
              <div className="font-mono text-3xl font-bold text-accent mb-2">10-30%</div>
              <div className="text-gray-light">Ongoing revenue share</div>
              <div className="text-xs text-gray-mt-2 mt-2">Based on your level of involvement</div>
            </div>
            <div className="card">
              <div className="font-mono text-3xl font-bold text-accent mb-2">$0</div>
              <div className="text-gray-light">Your financial investment</div>
              <div className="text-xs text-gray-mt-2 mt-2">We fund all development</div>
            </div>
            <div className="card">
              <div className="font-mono text-3xl font-bold text-accent mb-2">Co-Founder</div>
              <div className="text-gray-light">Your title on the product</div>
              <div className="text-xs text-gray-mt-2 mt-2">Not consultant. Not advisor. Founder.</div>
            </div>
          </div>
          <p className="text-center text-gray-light mt-8">
            Example: A SaaS product reaching $10K MRR means $1K-3K/month to you — from your industry knowledge,
            not your labour. That grows as the product grows.
          </p>
        </div>
      </section>

      {/* Real Talk */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2>Let&apos;s Be Direct</h2>
          </div>
          <div className="space-y-6">
            <div className="card p-6">
              <p className="text-gray-light">
                <strong className="text-white">&quot;I&apos;m not technical.&quot;</strong> — Good. We don&apos;t need you to be.
                We need you to know your industry inside and out. The technology is our job.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-gray-light">
                <strong className="text-white">&quot;I&apos;m in my 50s/60s — isn&apos;t this a young person&apos;s game?&quot;</strong> — The opposite.
                Young founders guess. You know. A 25-year-old with a laptop can build an app.
                Only someone with 30 years in logistics, healthcare, construction, finance, or manufacturing
                can tell you what that app <em>should actually do</em>.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-gray-light">
                <strong className="text-white">&quot;I have ideas but no one to build them.&quot;</strong> — That&apos;s exactly why
                this partnership exists. You&apos;ve probably watched problems fester for years because building
                software was too expensive, too slow, or required a team you don&apos;t have.
                AI has changed that equation entirely.
              </p>
            </div>
            <div className="card p-6">
              <p className="text-gray-light">
                <strong className="text-white">&quot;What if my idea isn&apos;t big enough?&quot;</strong> — If it&apos;s a real problem
                that real companies pay real money to work around, it&apos;s big enough.
                We&apos;ve built 17 products across construction, aviation, legal, real estate, and more.
                Niche is good. Niche means you&apos;re the expert and there&apos;s no competition.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Form */}
      <section className="section">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="tag tag-center mb-4">Start the Conversation</div>
            <h2>Tell Us What You Know</h2>
            <p className="text-gray-light mt-4">
              This isn&apos;t an application. It&apos;s the start of a conversation.
              Tell us about your industry and the problems you see — we&apos;ll reach out within 48 hours to talk.
            </p>
          </div>

          {formState.isSuccess ? (
            <div className="card-green p-8 text-center">
              <div className="text-4xl mb-4">&#10003;</div>
              <h3 className="text-xl font-bold mb-2">We&apos;ve Received Your Details</h3>
              <p className="text-gray-light">
                We&apos;ll reach out within 48 hours to set up a conversation.
                No pitch required — just a chat about your industry and what you&apos;ve seen.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Your Name *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    required
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Your Industry *</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Mining, Healthcare, Logistics, Manufacturing..."
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">How long have you worked in this industry? *</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. 25 years in commercial construction"
                  value={formData.yearsInIndustry}
                  onChange={(e) => setFormData({ ...formData, yearsInIndustry: e.target.value })}
                />
              </div>
              <div>
                <label className="label">What&apos;s the biggest problem you see in your industry that nobody has fixed properly? *</label>
                <textarea
                  required
                  className="textarea"
                  rows={5}
                  placeholder="Don't worry about being formal. Just tell us what frustrates you, what costs money, what wastes time. The more specific, the better."
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Why do you think you&apos;re the right person to help solve this?</label>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Your role, your connections, your track record in this space. Who listens when you talk?"
                  value={formData.whyYou}
                  onChange={(e) => setFormData({ ...formData, whyYou: e.target.value })}
                />
              </div>
              <Button type="submit" variant="orange" fullWidth disabled={formState.isSubmitting}>
                {formState.isSubmitting ? 'Sending...' : 'Start the Conversation →'}
              </Button>
              <p className="text-xs text-gray-light text-center">
                No commitment. No pitch deck required. Just a conversation between people who want to build something real.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Community CTA */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Want to Think on It First?</h2>
          <p className="text-gray-light mb-8">
            Join our community of founders, operators, and industry experts.
            Share what you&apos;re seeing in your field, get feedback, and connect with people building solutions.
          </p>
          <Button href={SKOOL.url} external variant="purple">
            Join the Community →
          </Button>
        </div>
      </section>
    </>
  )
}
