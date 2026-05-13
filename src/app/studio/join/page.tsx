'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

export default function JoinPage() {
  const [selectedRole, setSelectedRole] = useState<'devops' | 'gtm' | null>(null)
  const [formState, setFormState] = useState({ isSubmitting: false, isSuccess: false })

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[50vh] flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="tag tag-center mb-4">Join the Studio</div>
          <h1 className="mb-6">
            Build the Portfolio.<br />
            <span className="text-gradient-accent">Share the Upside.</span>
          </h1>
          <p className="text-xl text-gray-light">
            We&apos;re assembling a team to scale 17+ AI platforms. Not employees—partners.
            Equity in what you build. Upside in what you scale.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">What You Get</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold mb-2">Equity</h3>
              <p className="text-sm text-gray-light">Studio equity + specific platforms you build or scale</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold mb-2">Ownership</h3>
              <p className="text-sm text-gray-light">Revenue share on platforms you strengthen</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="font-bold mb-2">Flexibility</h3>
              <p className="text-sm text-gray-light">Remote / async / Brisbane optional</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Open Roles</h2>
          
          {/* DevOps Role */}
          <div className="card p-8 mb-6 border-2 border-transparent hover:border-accent transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs text-accent">ENGINEERING</span>
                <h3 className="text-xl font-bold">DevOps / Platform Engineers</h3>
              </div>
              <span className="text-sm bg-accent/20 text-accent px-3 py-1">2-3 positions</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-3">What you&apos;ll do:</h4>
                <ul className="space-y-2 text-sm text-gray-light">
                  <li>• Harden and scale the existing portfolio of 35+ live platforms</li>
                  <li>• Build new platforms from validated problems (3-7 day cycles)</li>
                  <li>• Own infrastructure: Vercel, Supabase, ElevenLabs, Claude AI</li>
                  <li>• Improve build velocity of the studio</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">What you bring:</h4>
                <ul className="space-y-2 text-sm text-gray-light">
                  <li>• Next.js / React / TypeScript</li>
                  <li>• Supabase or similar (Postgres, auth, realtime)</li>
                  <li>• Vercel deployment + edge functions</li>
                  <li>• Bonus: Voice AI (ElevenLabs), Claude API</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={() => setSelectedRole('devops')} 
              className="mt-6"
              variant={selectedRole === 'devops' ? 'primary' : 'secondary'}
            >
              Apply for DevOps →
            </Button>
          </div>

          {/* GTM Role */}
          <div className="card p-8 border-2 border-transparent hover:border-orange transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="font-mono text-xs text-orange">GROWTH</span>
                <h3 className="text-xl font-bold">GTM / Growth Experts</h3>
              </div>
              <span className="text-sm bg-orange/20 text-orange px-3 py-1">1-2 positions</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold mb-3">What you&apos;ll do:</h4>
                <ul className="space-y-2 text-sm text-gray-light">
                  <li>• Own traction for individual platforms (or the marketplace)</li>
                  <li>• Find product-market fit signals and double down</li>
                  <li>• Build distribution: SEO, content, partnerships</li>
                  <li>• Work with partners to scale their rev-share platforms</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-3">What you bring:</h4>
                <ul className="space-y-2 text-sm text-gray-light">
                  <li>• Track record scaling SaaS / AI products</li>
                  <li>• PLG + Sales-assisted hybrid experience</li>
                  <li>• Content / SEO / community-led growth</li>
                  <li>• Bonus: AI/voice AI market experience</li>
                </ul>
              </div>
            </div>
            
            <Button 
              onClick={() => setSelectedRole('gtm')} 
              variant={selectedRole === 'gtm' ? 'orange' : 'secondary'}
              className="mt-6"
            >
              Apply for GTM →
            </Button>
          </div>
        </div>
      </section>

      {/* Application Form */}
      {selectedRole && (
        <section className="section bg-gray-dark">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Apply for {selectedRole === 'devops' ? 'DevOps' : 'GTM'} Role
            </h2>
            
            {formState.isSuccess ? (
              <div className="card-green p-8 text-center">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-bold mb-2">Application Received!</h3>
                <p className="text-gray-light">We&apos;ll review and reach out within a week.</p>
              </div>
            ) : (
              <form 
                onSubmit={async (e) => {
                  e.preventDefault()
                  setFormState({ isSubmitting: true, isSuccess: false })
                  await new Promise(r => setTimeout(r, 1000))
                  setFormState({ isSubmitting: false, isSuccess: true })
                }}
                className="card p-8 space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Your Name *</label>
                    <input type="text" required className="input" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" required className="input" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">LinkedIn URL</label>
                    <input type="url" className="input" placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div>
                    <label className="label">Portfolio / GitHub</label>
                    <input type="url" className="input" placeholder="https://..." />
                  </div>
                </div>
                <div>
                  <label className="label">Tell us about your experience *</label>
                  <textarea 
                    required 
                    className="textarea" 
                    placeholder="What have you built or scaled? What are you most proud of?"
                  />
                </div>
                <div>
                  <label className="label">Why are you interested in the studio model?</label>
                  <textarea 
                    className="textarea" 
                    placeholder="What excites you about building multiple platforms?"
                  />
                </div>
                <div>
                  <label className="label">Availability *</label>
                  <select required className="input">
                    <option value="">Select...</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time (20+ hrs/week)</option>
                    <option value="contract">Contract / Project-based</option>
                  </select>
                </div>
                <Button 
                  type="submit" 
                  variant={selectedRole === 'devops' ? 'primary' : 'orange'} 
                  fullWidth 
                  disabled={formState.isSubmitting}
                >
                  {formState.isSubmitting ? 'Submitting...' : 'Submit Application →'}
                </Button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* Referral */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Not a Fit But Know Someone?</h2>
          <p className="text-gray-light mb-6">
            Referral bonus: If you refer someone we hire, you get a share of their first-year equity allocation.
          </p>
          <Button href="/contact?type=referral" variant="secondary">
            Refer Someone →
          </Button>
        </div>
      </section>
    </>
  )
}
