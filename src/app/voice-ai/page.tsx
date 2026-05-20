import { Metadata } from 'next'
import { Mic, MicOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { PLATFORMS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Voice AI Approach',
  description: 'We add voice AI where it solves real problems—not because we can.',
}

export default function VoiceAIPage() {
  const voicePlatforms = PLATFORMS.filter(p => p.hasVoiceAI)

  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto">
          <div className="tag mb-4">Our Approach</div>
          <h1 className="mb-6">
            Voice AI Where It <span className="text-gradient-accent">Matters</span>
          </h1>
          <p className="text-2xl text-gray-light mb-4">
            We don&apos;t add voice agents because we can.
            We add them when they solve the actual problem.
          </p>
          <p className="text-base text-gray-light">
            One canonical voice persona &mdash; <strong className="text-white">Morgan</strong> &mdash;
            across every surface in the portfolio. Same voice on marketplace,
            engagement, and pricing pages so the operator voice you hear here is the same
            one your team will hear when the factory is installed in-house.
          </p>
        </div>
      </section>

      {/* When Voice Makes Sense */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <Mic className="text-accent" size={24} />
                </div>
                <h2 className="text-2xl font-bold">When Voice Works</h2>
              </div>
              <ul className="space-y-4">
                {[
                  { title: 'Practice & Rehearsal', desc: 'Pitch practice, interview prep, presentation coaching' },
                  { title: 'Real-time Interaction', desc: 'Customer service, live translation, accessibility' },
                  { title: 'Hands-free Contexts', desc: 'Driving, cooking, working with tools' },
                  { title: 'Emotional Connection', desc: 'Coaching, therapy support, companionship' },
                  { title: 'Speed Over Precision', desc: 'Quick queries, brainstorming, ideation' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="text-accent mt-1">✓</span>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-light">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <MicOff className="text-red-400" size={24} />
                </div>
                <h2 className="text-2xl font-bold">When Voice Doesn&apos;t</h2>
              </div>
              <ul className="space-y-4">
                {[
                  { title: 'Data Entry', desc: 'Forms, spreadsheets, structured input' },
                  { title: 'Visual Tasks', desc: 'Design, photo editing, mapping' },
                  { title: 'Precision Required', desc: 'Code, legal documents, contracts' },
                  { title: 'Privacy Concerns', desc: 'Public spaces, shared offices' },
                  { title: 'Complex Navigation', desc: 'Multi-step workflows, dashboards' },
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="text-red-400 mt-1">✗</span>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-gray-light">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Our Voice Stack */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-2 text-center">Our Voice Stack</h2>
          <p className="text-sm text-gray-light text-center mb-8">
            Every BYOK-first product ships with the voice agent surface pre-wired.
            Operator&apos;s ElevenLabs key, operator&apos;s agent.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card text-center">
              <div className="text-3xl mb-3">🎙️</div>
              <h3 className="font-bold mb-2">@caistech/elevenlabs-convai</h3>
              <p className="text-sm text-gray-light">Hub package wrapping ElevenLabs Conversational AI &mdash; agent provisioning, webhooks, persistent memory</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-bold mb-2">Anthropic Claude</h3>
              <p className="text-sm text-gray-light">Conversation intelligence on the operator&apos;s API key</p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold mb-2">Vercel Edge</h3>
              <p className="text-sm text-gray-light">Low-latency global deployment on the operator&apos;s account</p>
            </div>
          </div>
        </div>
      </section>

      {/* Voice-Enabled Platforms */}
      <section className="section bg-gray-dark">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Voice-Enabled Platforms</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {voicePlatforms.map((platform) => (
              <div key={platform.id} className="card">
                <div className="flex items-center gap-2 mb-3">
                  <Mic size={16} className="text-accent" />
                  <span className="font-mono text-xs text-accent uppercase">{platform.category}</span>
                </div>
                <h3 className="font-bold mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-light mb-3">{platform.problem}</p>
                <p className="text-xs text-gray-light italic">
                  Voice AI: {platform.id === 'raiseready' && 'Practice pitches with AI investors'}
                  {platform.id === 'rehearsals' && 'Rehearse any high-stakes conversation'}
                  {platform.id === 'tourlingo' && 'Real-time translation for tours'}
                  {platform.id === 'soxton' && 'Voice-first legal document queries'}
                  {platform.id === 'interviews' && 'Practice job interviews out loud'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Voice Is Our Edge */}
      <section className="section">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Why Voice Is Our Edge</h2>
          <div className="space-y-6">
            {[
              { title: 'Differentiation', desc: 'Competitors can copy features. They can\'t copy conversations. Voice creates a moat.' },
              { title: 'Stickiness', desc: 'Voice creates habits. Habits create retention. Our voice-enabled platforms have 40% higher retention.' },
              { title: 'Data Advantage', desc: 'Every conversation improves the product. We learn what users actually need, not what they click.' },
              { title: 'Premium Positioning', desc: 'Voice commands premium pricing. Users pay more for natural interaction.' },
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Got a Problem That Needs Voice?</h2>
          <p className="text-gray-light mb-8">
            Let&apos;s talk about whether voice AI actually solves your problem &mdash;
            or just sounds cool. Bring it to a studio-in-residence engagement
            or pick up a voice-enabled product from the marketplace.
          </p>
          <div className="flex justify-center gap-4">
            <Button href="/engagement" variant="orange">Studio in Residence</Button>
            <Button href="/marketplace" variant="secondary">Voice-Enabled Marketplace</Button>
          </div>
        </div>
      </section>
    </>
  )
}
