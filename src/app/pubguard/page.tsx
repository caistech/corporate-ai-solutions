'use client';

export default function PubGuardPage() {
  const PUBGUARD_APP_URL = 'https://kira-rho.vercel.app/pubguard/scan';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Badge */}
        <span className="inline-block bg-green-500/15 text-green-400 px-4 py-2 rounded-full text-base font-medium mb-6 border border-green-500/30">
          🛡️ Now Available
        </span>

        {/* Heading */}
        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Pub</span>
          <span className="text-red-400">Guard</span>
        </h1>

        <p className="text-2xl md:text-3xl text-slate-300 mb-10 leading-relaxed">
          Pre-publication security vetting for tech writers.<br />
          <span className="text-slate-400">Because recommending the wrong software can destroy your career.</span>
        </p>

        {/* CTA Button - Primary */}
        <a
          href={PUBGUARD_APP_URL}
          className="inline-block px-10 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xl font-semibold rounded-xl hover:translate-y-[-2px] hover:shadow-xl hover:shadow-red-500/30 transition-all mb-12"
        >
          Start Scanning Free →
        </a>

        {/* Critical Warning Box */}
        <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-8 mb-10">
          <h2 className="text-red-400 font-semibold text-2xl mb-4">⚠️ The Risk You&apos;re Taking Every Time You Hit Publish</h2>
          <p className="text-red-200/90 text-lg leading-relaxed mb-5">
            When you recommend software to your audience and that software causes harm—credential theft, data breaches,
            financial loss—you&apos;re not just facing angry readers. In the US, class action attorneys are actively
            targeting influencers and publishers who promoted products that harmed consumers.
          </p>
          <p className="text-red-200/90 text-lg leading-relaxed">
            <strong className="text-red-300">This isn&apos;t hypothetical.</strong> Class actions seeking $50M–$500M have been
            filed against brands and individual influencers in 2025 alone.
          </p>
        </div>

        {/* Recent Disasters Section */}
        <div className="mb-12">
          <h3 className="text-white font-semibold text-2xl mb-6">Recent Software That Went Viral—Then Went Wrong</h3>

          <div className="space-y-5">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🦞</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">OpenClaw / Clawdbot (January 2026)</h4>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Hit 100K+ GitHub stars in 48 hours. Security researchers found 1,800+ exposed installations within days.
                    Credential theft via prompt injection demonstrated in under 5 minutes. Cisco called it &quot;an absolute nightmare.&quot;
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🪵</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">Log4j / Log4Shell (December 2021)</h4>
                  <p className="text-base text-slate-300 leading-relaxed">
                    A logging library used in millions of Java applications had a critical vulnerability rated 10/10.
                    Over 100 million server instances affected worldwide. Apple, Twitter, Steam, Tesla exposed.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">☀️</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">SolarWinds (2020)</h4>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Russian intelligence hijacked the build system. 18,000 customers downloaded trojanized updates.
                    Backdoors planted in networks of major corporations and government agencies.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">📦</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">NPM Package Attacks (Ongoing)</h4>
                  <p className="text-base text-slate-300 leading-relaxed">
                    Colors.js and Faker.js (20M+ weekly downloads combined) were deliberately sabotaged.
                    UA-Parser-JS (8M weekly downloads) was hijacked for crypto-mining malware.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Liability Deep Dive */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-8 mb-12">
          <h3 className="text-amber-400 font-semibold text-2xl mb-4">📋 The Legal Reality for Publishers</h3>
          <div className="space-y-4 text-lg text-amber-200/80 leading-relaxed">
            <p>
              <strong className="text-amber-300">Class actions are exploding:</strong> Data breach lawsuits tripled in 2023.
              Influencer marketing class actions emerged as a major trend in 2025.
            </p>
            <p>
              <strong className="text-amber-300">Major settlements prove the risk:</strong> Equifax paid $700M. T-Mobile paid
              $350M. Yahoo paid $117.5M.
            </p>
            <p>
              <strong className="text-amber-300">Influencers are liable too:</strong> Courts have ruled that anyone receiving
              compensation to promote something can be held responsible under product liability law.
            </p>
            <p>
              <strong className="text-amber-300">Even winning costs everything:</strong> Defending a lawsuit takes years and
              drains your resources—even if you&apos;re ultimately cleared.
            </p>
          </div>
        </div>

        {/* Solution Section */}
        <div className="mb-12">
          <h3 className="text-white font-semibold text-2xl mb-6">What PubGuard Does</h3>
          <div className="space-y-6">
            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Paste a GitHub URL. Get a risk report.</h4>
                <p className="text-lg text-slate-300 leading-relaxed">We scan repos, CVE databases, security publications, Shodan exposure data, and researcher warnings—aggregated and synthesized so you don&apos;t have to become a security expert.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Traffic-light risk rating</h4>
                <p className="text-lg text-slate-300 leading-relaxed">Green, amber, or red—with plain-English explanation of what was found and what it means for your readers (and your liability).</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Liability-ready documentation</h4>
                <p className="text-lg text-slate-300 leading-relaxed">PDF report proving you performed due diligence before publishing. Timestamped. Sourced. Defensible.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Post-publication monitoring</h4>
                <p className="text-lg text-slate-300 leading-relaxed">Get alerts if security issues emerge after you&apos;ve published—so you can update your article or warn readers before damage spreads.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 mb-10 text-center">
          <h2 className="text-3xl font-semibold mb-4">Protect yourself before your next article</h2>
          <p className="text-xl text-slate-400 mb-8">Vet tools before you stake your reputation on them.</p>

          <a
            href={PUBGUARD_APP_URL}
            className="inline-block px-12 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xl font-semibold rounded-xl hover:translate-y-[-2px] hover:shadow-xl hover:shadow-red-500/30 transition-all"
          >
            Start Scanning Now →
          </a>

          <p className="text-slate-500 mt-6 text-base">Free to try • No credit card required</p>
        </div>

        {/* Target Audience */}
        <p className="text-center text-slate-400 text-lg italic mb-10">
          <strong className="text-slate-300">Built for:</strong> Newsletter authors, tech bloggers, developer advocates,
          YouTubers, podcasters—anyone who recommends tools to an audience.
        </p>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-slate-500 text-base">
            A <a href="/" className="text-slate-400 hover:text-slate-200 transition-colors">Corporate AI Solutions</a> project
          </p>
        </div>
      </div>
    </div>
  );
}