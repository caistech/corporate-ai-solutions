// @explanatory-header-exempt — hand-built dark-theme hero opens with what/what-to-do/why; full <ExplanatoryHeader/> would clash with the theme
import { Metadata } from 'next'
import { Button } from '@/components/ui/Button'
import { SKOOL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Community',
  description: 'Join The Easily Distracted - a free community for problem-solvers who can\'t ignore mess.',
}

export default function CommunityPage() {
  return (
    <>
      {/* Hero */}
      <section className="section bg-grid min-h-[60vh] flex items-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="tag tag-center mb-4">The Journey</div>
          <h1 className="mb-4">
            <span className="text-gradient-purple">The Easily Distracted</span>
          </h1>
          <p className="text-2xl text-gray-light mb-2">
            No Funnels. No Gurus. Just Problems Worth Solving.
          </p>
          <p className="text-xl text-gray-light mb-8">
            A free community for late-night thinkers, chaos navigators, and real-world fixers 
            who can&apos;t ignore a problem once they see it.
          </p>
          <Button href={SKOOL.url} external variant="purple" size="lg">
            Join Free on Skool →
          </Button>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Who This Is For</h2>
          <div className="space-y-4">
            {[
              'You see problems everywhere and can\'t unsee them',
              'You\'ve got half-formed ideas you\'re not sure are worth building',
              'You want feedback from people who actually build things',
              'You\'re tired of guru-speak and funnel-bro marketing',
              'You want to find collaborators, not just "network"',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="text-purple text-xl">✓</span>
                <p className="text-lg">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Happens Inside */}
      <section className="section">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">What Happens Inside</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📣', title: 'Share Problems', desc: 'Post real-world problems — even the messy, half-formed ones' },
              { icon: '🔧', title: 'Get Feedback', desc: 'From builders, not theorists. People who ship things.' },
              { icon: '🤝', title: 'Find Partners', desc: 'Some problems discussed here become real platforms we build together' },
              { icon: '📚', title: 'Access Tools', desc: 'Templates, frameworks, and approaches we actually use' },
              { icon: '🚀', title: 'Watch Builds', desc: 'See problems become platforms in real-time' },
              { icon: '💬', title: 'No BS', desc: 'Plain language. Real talk. No guru-speak allowed.' },
            ].map((item) => (
              <div key={item.title} className="card-purple p-6">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Rules */}
      <section className="section bg-gray-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">The Rules</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { num: '01', title: 'No pitching', desc: 'Share problems, not products.' },
              { num: '02', title: 'No guru-speak', desc: 'Plain language or GTFO.' },
              { num: '03', title: 'Build in public', desc: 'Share wins AND failures.' },
              { num: '04', title: 'Help first', desc: 'The best partners emerge naturally.' },
            ].map((rule) => (
              <div key={rule.num} className="flex gap-4">
                <div className="font-mono text-2xl font-bold text-purple">{rule.num}</div>
                <div>
                  <h3 className="font-bold">{rule.title}</h3>
                  <p className="text-sm text-gray-light">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Path */}
      <section className="section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">The Path from Community to Partner</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="card-purple p-4 text-center">
              <div className="font-mono text-sm text-purple">JOIN</div>
              <div className="font-bold">Community</div>
              <div className="text-xs text-gray-light">Free</div>
            </div>
            <div className="text-gray-light">→</div>
            <div className="card p-4 text-center">
              <div className="font-mono text-sm text-accent">SHARE</div>
              <div className="font-bold">A Problem</div>
              <div className="text-xs text-gray-light">Get feedback</div>
            </div>
            <div className="text-gray-light">→</div>
            <div className="card p-4 text-center">
              <div className="font-mono text-sm text-accent">VALIDATE</div>
              <div className="font-bold">With Group</div>
              <div className="text-xs text-gray-light">Test interest</div>
            </div>
            <div className="text-gray-light">→</div>
            <div className="card-orange p-4 text-center">
              <div className="font-mono text-sm text-orange">PARTNER</div>
              <div className="font-bold">Build It</div>
              <div className="text-xs text-gray-light">Revenue share</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section bg-gradient-to-b from-gray-dark to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4">Ready to Join the Chaos?</h2>
          <p className="text-xl text-gray-light mb-8">
            Come for the problems. Stay for the solutions.
          </p>
          <Button href={SKOOL.url} external variant="purple" size="lg">
            Join The Easily Distracted →
          </Button>
          <p className="text-sm text-gray-light mt-4">Free. No credit card. No BS.</p>
        </div>
      </section>
    </>
  )
}
