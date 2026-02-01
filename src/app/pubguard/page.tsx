'use client';

export default function PubGuardPage() {
  const PUBGUARD_APP_URL = 'https://kira-rho.vercel.app/pubguard/scan';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Forever Free Badge */}
        <span className="inline-block bg-green-500/15 text-green-400 px-4 py-2 rounded-full text-base font-medium mb-6 border border-green-500/30">
          🎁 Forever Free — No Catch
        </span>

        {/* Heading */}
        <h1 className="text-6xl md:text-7xl font-bold mb-6">
          <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Pub</span>
          <span className="text-red-400">Guard</span>
        </h1>

        <p className="text-2xl md:text-3xl text-slate-300 mb-4 leading-relaxed">
          Software Security Scanner powered by Kira AI
        </p>
        <p className="text-xl text-slate-400 mb-10">
          Know the risks before you publish, ship, or install.
        </p>

        {/* CTA Button - Primary */}
        <a
          href={PUBGUARD_APP_URL}
          className="inline-block px-10 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xl font-semibold rounded-xl hover:translate-y-[-2px] hover:shadow-xl hover:shadow-red-500/30 transition-all mb-12"
        >
          Start Scanning Free →
        </a>

        {/* Origin Story - Why We Built This */}
        <div className="bg-slate-800/50 border border-slate-600 rounded-xl p-8 mb-12">
          <h2 className="text-white font-semibold text-2xl mb-4">Why We Built This</h2>
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            We&apos;re <a href="https://www.corporateaisolutions.com" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline">Corporate AI Solutions</a>.
            We build AI tools for businesses—and we almost got burned recommending software that turned out to have serious security issues.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed mb-4">
            After that close call, we built PubGuard for ourselves. Then we realized:
            <strong className="text-white"> everyone evaluating software needs this</strong>—writers, developers, users, analysts.
            So we&apos;re giving it away.
          </p>
          <p className="text-slate-400 text-base">
            <strong className="text-green-400">Forever free.</strong> No premium tier. No feature limits. No data harvesting.
            Just a tool we wish we&apos;d had, now available to the community.
          </p>
        </div>

        {/* Who It's For - The Trouble You're Avoiding */}
        <div className="mb-12">
          <h3 className="text-white font-semibold text-2xl mb-2">Who Uses PubGuard?</h3>
          <p className="text-slate-400 mb-6">Four types of people. Four types of trouble. One tool to avoid it all.</p>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Tech Writers */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-red-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-3xl">✏️</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">Tech Writers &amp; Bloggers</h4>
                  <p className="text-red-300/90 text-sm mb-2 font-medium">
                    🚨 The trouble: You recommend a tool, it gets hacked, your readers lose money.
                    Angry comments. Damaged reputation. Potential lawsuits.
                  </p>
                  <p className="text-base text-slate-300 leading-relaxed">
                    <span className="text-green-400">✓</span> PubGuard gives you documented due diligence—timestamped proof you vetted the software before recommending it.
                    Copy the security summary directly into your article.
                  </p>
                </div>
              </div>
            </div>

            {/* Developers */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-3xl">💻</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">Software Developers</h4>
                  <p className="text-red-300/90 text-sm mb-2 font-medium">
                    🚨 The trouble: You ship code with a vulnerability. Users get compromised.
                    Your project gets roasted on Hacker News. Career damage.
                  </p>
                  <p className="text-base text-slate-300 leading-relaxed">
                    <span className="text-green-400">✓</span> PubGuard audits your project before release.
                    Get a prioritized checklist of issues to fix, with specific remediation steps. Ship with confidence.
                  </p>
                </div>
              </div>
            </div>

            {/* Prospective Users */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-3xl">👤</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">Prospective Users</h4>
                  <p className="text-red-300/90 text-sm mb-2 font-medium">
                    🚨 The trouble: You install something cool, it steals your credentials,
                    drains your crypto wallet, or installs malware. Real people lose real money every day.
                  </p>
                  <p className="text-base text-slate-300 leading-relaxed">
                    <span className="text-green-400">✓</span> PubGuard gives you a plain-English verdict: safe, caution, or avoid.
                    No security expertise needed—just paste the GitHub URL and get the answer.
                  </p>
                </div>
              </div>
            </div>

            {/* Security Analysts */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-colors">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🔍</span>
                <div>
                  <h4 className="font-semibold text-white text-xl mb-2">Security Analysts</h4>
                  <p className="text-red-300/90 text-sm mb-2 font-medium">
                    🚨 The trouble: Manual assessments take hours. You miss something.
                    Your report is incomplete. Your client gets breached.
                  </p>
                  <p className="text-base text-slate-300 leading-relaxed">
                    <span className="text-green-400">✓</span> PubGuard runs 14 automated checks in seconds.
                    CVE lookups, Shodan exposure, supply chain analysis—all in one exportable report with full technical depth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Critical Warning Box */}
        <div className="bg-red-950/50 border border-red-500/40 rounded-xl p-8 mb-10">
          <h2 className="text-red-400 font-semibold text-2xl mb-4">⚠️ This Isn&apos;t Hypothetical</h2>
          <p className="text-red-200/90 text-lg leading-relaxed mb-5">
            In the last year alone, millions of people have been affected by software they trusted:
          </p>
          <ul className="text-red-200/90 text-lg leading-relaxed space-y-2 mb-5">
            <li>• <strong className="text-red-300">OpenClaw</strong> hit 100K stars, then researchers found 1,800+ exposed installations stealing credentials</li>
            <li>• <strong className="text-red-300">Log4j</strong> affected 100+ million servers worldwide—Apple, Amazon, Tesla all exposed</li>
            <li>• <strong className="text-red-300">NPM packages</strong> get hijacked regularly—colors.js, faker.js, ua-parser-js all compromised</li>
          </ul>
          <p className="text-red-200/90 text-lg leading-relaxed">
            The pattern is always the same: software goes viral → people trust it → something goes wrong →
            <strong className="text-white"> someone gets blamed</strong>. Don&apos;t let it be you.
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
                    Colors.js and Faker.js (20M+ weekly downloads combined) were deliberately sabotaged by their maintainer.
                    UA-Parser-JS (8M weekly downloads) was hijacked for crypto-mining malware.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What PubGuard Does */}
        <div className="mb-12">
          <h3 className="text-white font-semibold text-2xl mb-6">What PubGuard Does</h3>

          <div className="space-y-6">
            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Traffic-light risk rating</h4>
                <p className="text-lg text-slate-300 leading-relaxed">Green, amber, or red—with plain-English explanation of what was found and what it means for your specific use case.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Kira AI explains the results</h4>
                <p className="text-lg text-slate-300 leading-relaxed">Our AI security analyst walks you through the findings by voice. Ask follow-up questions, get recommendations tailored to your role—writer, developer, user, or analyst.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Documented due diligence</h4>
                <p className="text-lg text-slate-300 leading-relaxed">Timestamped, sourced reports proving you checked before publishing, shipping, or installing. Defensible if questions arise later.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-14 h-14 bg-green-500/15 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-slate-100 text-xl mb-2">Scan history &amp; comparisons</h4>
                <p className="text-lg text-slate-300 leading-relaxed">Track how a project&apos;s security posture changes over time. Compare before and after scans to see if issues have been fixed.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 14 Automated Tests */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-8 mb-12">
          <h3 className="text-white font-semibold text-2xl mb-6">14 Automated Security Tests</h3>
          <div className="grid md:grid-cols-2 gap-4 text-slate-300">
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> GitHub Repository Analysis
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> CVE Database Lookup
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Security News Scan
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Expert/Researcher Warnings
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Credential Storage Audit
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Permission Scope Analysis
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Prompt Injection Risk
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Supply Chain Check
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Config Defaults Review
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Internet Exposure (Shodan)
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Identity Stability (Renames)
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Maintainer Responsiveness
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> SECURITY.md Policy Check
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">✓</span> Community Health Indicators
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 mb-10 text-center">
          <h2 className="text-3xl font-semibold mb-4">Know the risks before it&apos;s too late</h2>
          <p className="text-xl text-slate-400 mb-8">Scan any GitHub project in seconds.</p>

          <a
            href={PUBGUARD_APP_URL}
            className="inline-block px-12 py-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xl font-semibold rounded-xl hover:translate-y-[-2px] hover:shadow-xl hover:shadow-red-500/30 transition-all"
          >
            Start Scanning Now →
          </a>

          <p className="text-slate-500 mt-6 text-base">Forever free • No signup required • No data harvesting</p>
        </div>

        {/* Contact */}
        <div className="text-center mb-10">
          <p className="text-slate-400 mb-2">Questions? Need custom analysis for your enterprise?</p>
          <div className="flex items-center justify-center gap-4 text-slate-300">
            <a href="mailto:dennis@corporateaisolutions.com" className="hover:text-white transition-colors">
              dennis@corporateaisolutions.com
            </a>
            <span className="text-slate-600">|</span>
            <a href="https://www.calendly.com/mcmdennis" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Book a call
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4 mb-10">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="text-amber-500 font-medium">Disclaimer:</span> PubGuard scans are performed in good faith using automated analysis.
            Results are informational only and do not constitute professional security advice.
            Users must conduct their own due diligence before using any software.
            By using this service, you accept full responsibility for your own decisions.
            No liability is assumed for any outcomes resulting from software assessed here.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/10">
          <p className="text-slate-500 text-base">
            A <a href="https://www.corporateaisolutions.com" className="text-slate-400 hover:text-slate-200 transition-colors">Corporate AI Solutions</a> community project
          </p>
          <p className="text-slate-600 text-sm mt-2">
            Built with 💚 because we needed it ourselves
          </p>
        </div>
      </div>
    </div>
  );
}