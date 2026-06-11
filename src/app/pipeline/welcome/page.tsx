// @explanatory-header-exempt — Pipeline/methodology surface slated for extraction to its own product (docs/PIPELINE_SEPARATION_PLAN.md); a proper <ExplanatoryHeader/> lands in that rewrite, not the cost-dashboard PR.
'use client';

/**
 * /pipeline/welcome
 * 
 * Public-facing landing page for Pipeline (validation engine product)
 * Explains the product to visitors before they log in
 * 
 * Positioning: "Validation engine for product teams and distributors"
 * - ICP: Sales agencies, marketing agencies, dev shops, accountants, consultants, product teams
 * - Problem: Teams want to validate & launch products quickly
 * - Solution: Pipeline de-risks with objective readiness scoring + dual-stream demand validation
 * - Lane: Lane 1 Paid Distributor SaaS
 * - Distribution: Each distributor gets their own admin panel to manage clients' product pipelines
 */

import Link from 'next/link';
import { ArrowRight, CheckCircle, BarChart3, Users, Zap } from 'lucide-react';

export default function PipelineWelcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold text-slate-900">🔄 Pipeline</div>
            <span className="text-sm text-slate-600">Validation Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/pipeline/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">
              Admin Login
            </Link>
            <Link 
              href="/pipeline/login" 
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              User Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Validate products with confidence
            </h1>
            <p className="text-xl text-slate-600 mb-8">
              Pipeline gives product teams and distributors objective readiness scoring and dual-stream demand validation. De-risk your next launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/pipeline/login"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start as User <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/admin/pipeline/login"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:border-slate-400 transition-colors"
              >
                Admin Login <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-slate-600 font-medium">Validation Dashboard Preview</p>
              <p className="text-sm text-slate-500 mt-2">(Sign in to see your products)</p>
            </div>
          </div>
        </div>
      </section>

      {/* What is Pipeline */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">What is Pipeline?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Objective Readiness Scoring</h3>
              <p className="text-slate-600">
                Get a 0-100 readiness score based on hard gates, weighted validation criteria, and test results. Know exactly when your product is ready to launch.
              </p>
            </div>
            
            <div>
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Dual-Stream Validation</h3>
              <p className="text-slate-600">
                Validate with real distributors AND real end-users simultaneously. Get supply-side + demand-side signals before you invest in scale.
              </p>
            </div>
            
            <div>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">De-Risk Your Launch</h3>
              <p className="text-slate-600">
                Identify gaps early. Test assumptions before shipping. Move from idea → validation → execution with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gradient-to-br from-slate-50 to-blue-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">How It Works</h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                number: '1',
                title: 'Add Your Product',
                description: 'Define your promise, end-user, distributor, and friction point.',
              },
              {
                number: '2',
                title: 'Run Validation',
                description: 'Pipeline tests your product against readiness gates. See your score in real-time.',
              },
              {
                number: '3',
                title: 'Fill Gaps',
                description: 'Address missing validations. Refine your product story based on feedback.',
              },
              {
                number: '4',
                title: 'Execute Outreach',
                description: 'When ready, trigger dual-stream validation with distributors and end-users.',
              },
            ].map((step) => (
              <div key={step.number} className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="text-3xl font-bold text-blue-600 mb-3">{step.number}</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Should Use Pipeline */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Who Should Use Pipeline?</h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-start gap-4 mb-6">
                <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Product Teams</h3>
                  <p className="text-slate-600">
                    Validate your product idea with real users before investing in scale. Get objective feedback on positioning and viability.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Distributors & Agencies</h3>
                  <p className="text-slate-600">
                    Manage your clients&apos; product pipelines in one place. See which products are ready to market, which need work.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Accelerators & Consultants</h3>
                  <p className="text-slate-600">
                    Help your portfolio companies validate faster. Use Pipeline&apos;s scoring as an objective investment gate.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Perfect For:</h3>
              <ul className="space-y-3">
                {[
                  'Sales agencies validating new market verticals',
                  'Marketing agencies testing new service offerings',
                  'Dev shops launching SaaS products',
                  'Accountants exploring new practice areas',
                  'Consultants building productized services',
                  'Product teams at any stage of development',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gradient-to-br from-slate-50 to-indigo-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Powerful Features</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Real-Time Readiness Scoring',
                description: 'Watch your product\'s readiness score update as you fill validation gaps. 0-100 scale guides you to launch-ready.',
              },
              {
                title: 'Automated Gap Detection',
                description: 'Pipeline identifies exactly what\'s missing: promise clarity, distributor alignment, user research, market fit signals.',
              },
              {
                title: 'Validation Workflow Execution',
                description: 'One click to launch dual-stream validation. Automatically reaches distributors and end-users in your target market.',
              },
              {
                title: 'Team Collaboration',
                description: 'Invite your team to contribute. Shared pipeline means everyone knows the product status and next steps.',
              },
              {
                title: 'Research Conversation',
                description: 'Talk to your voice agent about product thinking. Refine positioning, brainstorm features, log market observations.',
              },
              {
                title: 'Audit Trail & Memory',
                description: 'Every decision, every piece of feedback, every iteration is logged. History that informs future launches.',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-slate-200 hover:border-blue-300 transition-colors">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-4xl font-bold text-slate-900 mb-12 text-center">Simple Pricing</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-slate-50 rounded-lg p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Starter</h3>
              <div className="text-4xl font-bold text-slate-900 mb-2">$0<span className="text-lg text-slate-600">/mo</span></div>
              <p className="text-slate-600 mb-6 text-sm">For solo operators and early-stage validation</p>
              <ul className="space-y-3 text-sm text-slate-700 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  1 product
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Readiness scoring
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Gap detection
                </li>
              </ul>
              <Link href="/pipeline/login" className="block w-full px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:border-slate-400 text-center">
                Get Started Free
              </Link>
            </div>

            <div className="bg-blue-50 rounded-lg p-8 border-2 border-blue-600 shadow-lg">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">POPULAR</div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Team</h3>
              <div className="text-4xl font-bold text-slate-900 mb-2">$<span className="text-2xl">TBD</span><span className="text-lg text-slate-600">/mo</span></div>
              <p className="text-slate-600 mb-6 text-sm">For agencies and consultants managing multiple products</p>
              <ul className="space-y-3 text-sm text-slate-700 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Up to 10 products
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Team collaboration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Validation workflows
                </li>
              </ul>
              <Link href="/pipeline/login" className="block w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-center">
                Start Free Trial
              </Link>
            </div>

            <div className="bg-slate-50 rounded-lg p-8 border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold text-slate-900 mb-2">Custom</div>
              <p className="text-slate-600 mb-6 text-sm">For large teams with custom integrations</p>
              <ul className="space-y-3 text-sm text-slate-700 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Unlimited products
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  White-label option
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Dedicated support
                </li>
              </ul>
              <a href="mailto:sales@corporateaisolutions.com" className="block w-full px-4 py-2 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:border-slate-400 text-center">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 border-t border-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to validate your product?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start free today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pipeline/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              User Sign Up <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              href="/admin/pipeline/login"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Admin Login <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-sm text-center">
            <p>&copy; 2026 Pipeline. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
