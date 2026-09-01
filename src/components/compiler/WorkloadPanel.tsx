'use client'

import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleOff,
  Copy,
  FileJson,
  FlaskConical,
  GitBranch,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react'
import {
  CompiledWorkload,
  InferenceOperation,
  Opportunity,
  Provenance,
} from '@/lib/compiler/types'
import { WorkflowGraph } from './WorkflowGraph'

export type PanelTab = 'Dataset' | 'Simulate'

const richlyColoredProvenance = (origin: Provenance) => {
  switch (origin) {
    case 'Developer input':
      return 'text-orange'
    case 'Compiler-derived':
      return 'text-accent'
    case 'Workflow-derived':
      return 'text-purple'
    default:
      return 'text-gray-light'
  }
}

export function WorkloadPanel({ compiled, stage }: { compiled: CompiledWorkload; stage: 4 | 5 }) {
  const [tab, setTab] = useState<PanelTab>(stage === 5 ? 'Simulate' : 'Dataset')
  const [jsonOpen, setJsonOpen] = useState(false)

  const agentName = useMemo(() => {
    const map = new Map(compiled.agents.map((a) => [a.id, a.name]))
    return (id: string) => map.get(id) ?? id
  }, [compiled])

  const opName = useMemo(() => {
    const map = new Map(compiled.inferenceOperations.map((o) => [o.id, o.name]))
    return (id: string) => map.get(id) ?? id
  }, [compiled])

  const toolOpCount = compiled.inferenceOperations.filter((o) => o.kind === 'retrieval').length
  const realtimeCount = compiled.inferenceOperations.filter((o) => o.execution === 'realtime').length
  const asyncCount = compiled.inferenceOperations.filter((o) => o.execution === 'async').length
  const parallelCount = compiled.inferenceOperations.filter((o) => o.execution === 'parallel').length
  const batchCount = compiled.opportunities.filter((o) => o.kind === 'batch').length
  const warningCount = compiled.validation.filter((v) => v.severity !== 'ok').length

  return (
    <div className="space-y-12">
      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2 border-b border-gray-border pb-4">
        <button
          type="button"
          onClick={() => setTab('Dataset')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
            tab === 'Dataset' ? 'bg-accent/15 text-accent' : 'text-gray-light hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers size={16} /> Workload dataset
        </button>
        <button
          type="button"
          onClick={() => setTab('Simulate')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
            tab === 'Simulate' ? 'bg-orange/15 text-orange' : 'text-gray-light hover:text-white hover:bg-white/5'
          }`}
        >
          <FlaskConical size={16} /> Simulation ready
        </button>
      </div>

      {tab === 'Dataset' ? (
        <>
          {/* Workload Summary */}
          <Section heading="Workload Summary" sub="Derived from your solution — nothing typed in by a developer beyond the solution itself.">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-center">
              <Stat value={compiled.tasks.length} label="Tasks" />
              <Stat value={compiled.agents.length} label="Agents" />
              <Stat value={compiled.inferenceOperations.length} label="Inference operations" accent />
              <Stat value={toolOpCount} label="Tool operations" />
              <Stat value={realtimeCount} label="Real-time operations" />
              <Stat value={asyncCount} label="Async operations" />
              <Stat value={batchCount} label="Batch candidates" orange />
              <Stat value={parallelCount} label="Parallel operations" processAccent />
              <Stat value={warningCount} label="Warnings" warn />
            </div>

            {/* Derived volume strip */}
            <div className="mt-6 p-4 rounded-lg border border-accent/30 bg-accent/5">
              <p className="text-sm text-gray-light">
                <span className="text-accent font-bold">Compiler-derived volume:</span>{' '}
                {compiled.scenarios
                  .map((s) => `${s.name}: ${s.inferenceOperationsPerWorkUnit} inference ops/unit → ${s.totalInferenceOperationsPerMonth.toLocaleString()}/month`)
                  .join(' · ')}
              </p>
            </div>
          </Section>

          {/* Inference Operations */}
          <Section heading="Inference Operations" sub="Dependencies are resolved from the workflow graph, not listed linearly.">
            <div className="overflow-x-auto rounded-lg border border-gray-border">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="bg-gray-dark text-left text-xs uppercase tracking-wider text-gray-light">
                    <th className="px-4 py-3">Operation</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Execution</th>
                    <th className="px-4 py-3">Dependency</th>
                  </tr>
                </thead>
                <tbody>
                  {compiled.inferenceOperations.map((op) => (
                    <tr key={op.id} className="border-t border-gray-border/60">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{op.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{agentName(op.agentId)}</td>
                      <td className="px-4 py-3 text-gray-light">{op.trigger}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ExecutionBadge execution={op.execution} />
                      </td>
                      <td className="px-4 py-3 text-gray-light">
                        {op.dependencyIds.length ? (
                          <span className="flex flex-wrap gap-1">
                            {op.dependencyIds.map((depId) => (
                              <span
                                key={depId}
                                className="inline-block text-xs bg-black/40 border border-gray-border px-1.5 py-0.5 rounded whitespace-nowrap"
                              >
                                {shortName(opName(depId))}
                              </span>
                            ))}
                          </span>
                        ) : (
                          <span className="text-gray-light/50">Request entry</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-gray-light mt-2">
              A 4-operation path per customer request (orchestrator classification → knowledge
              reasoning + parallel CRM lookup → response generation) is derived from the workflow —
              not counted by the developer.
            </p>
          </Section>

          {/* Workflow Graph */}
          <Section heading="Workload Graph" sub="Inference operations, tool operations, dependencies, parallel branches and batch candidates.">
            <WorkflowGraph compiled={compiled} />
          </Section>

          {/* Execution Opportunities */}
          <ExecutionOpportunities compiled={compiled} />

          {/* Assumptions + Validation */}
          <div className="grid lg:grid-cols-2 gap-8">
            <AssumptionsTable compiled={compiled} />
            <ValidationPanel compiled={compiled} />
          </div>

          {/* JSON view */}
          <div className="border border-gray-border rounded-lg bg-gray-dark">
            <button
              type="button"
              onClick={() => setJsonOpen((v) => !v)}
              aria-expanded={jsonOpen}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-3">
                <FileJson size={18} className="text-accent" />
                <span className="font-bold text-sm">Structured workload dataset (JSON)</span>
              </div>
              {jsonOpen ? <ChevronDown size={18} className="text-gray-light" /> : <ChevronRight size={18} className="text-gray-light" />}
            </button>
            {jsonOpen && (
              <pre className="px-5 pb-5 overflow-x-auto text-xs font-mono text-gray-light">
                {JSON.stringify(compiled, null, 2)}
              </pre>
            )}
          </div>

          {/* Privacy / local compilation */}
          <PrivacyPanel />
        </>
      ) : (
        <SimulationReady compiled={compiled} />
      )}
    </div>
  )
}

function Section({
  heading,
  sub,
  children,
}: {
  heading: string
  sub: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h3 className="text-2xl font-bold mb-1">{heading}</h3>
      <p className="text-sm text-gray-light mb-6">{sub}</p>
      {children}
    </section>
  )
}

function Stat({
  value,
  label,
  accent,
  orange,
  processAccent,
  warn,
}: {
  value: number
  label: string
  accent?: boolean
  orange?: boolean
  processAccent?: boolean
  warn?: boolean
}) {
  const color = accent
    ? 'text-accent'
    : orange
      ? 'text-orange'
      : processAccent
        ? 'text-purple'
        : warn
          ? 'text-orange'
          : 'text-white'
  return (
    <div className="px-3 py-4 rounded-lg border border-gray-border bg-black/30">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-light mt-1">{label}</div>
    </div>
  )
}

function shortName(name: string): string {
  return name.replace(' — ', ' ')
}

function ExecutionBadge({ execution }: { execution: InferenceOperation['execution'] }) {
  const styles: Record<InferenceOperation['execution'], string> = {
    realtime: 'bg-accent/15 text-accent border-accent/30',
    parallel: 'bg-purple/15 text-purple border-purple/30',
    batch: 'bg-orange/15 text-orange border-orange/30',
    async: 'bg-gray-mid/40 text-gray-light border-gray-border',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded border text-xs font-medium ${styles[execution]}`}>
      {execution}
    </span>
  )
}

function ExecutionOpportunities({ compiled }: { compiled: CompiledWorkload }) {
  const batchOpportunities = compiled.opportunities.filter((o) => o.kind === 'batch')
  const otherOpportunities = compiled.opportunities.filter((o) => o.kind !== 'batch')
  const taskById = new Map(compiled.tasks.map((t) => [t.id, t]))

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <GitBranch size={22} className="text-purple" />
        <h3 className="text-2xl font-bold">Execution Opportunities</h3>
      </div>
      <p className="text-sm text-gray-light mb-6">
        Automatically identified from execution constraints. Workload modelling is about more than
        counting tokens: a 3-second response requirement is economically different from a 6-hour
        batch deadline, even at the same inference count.
      </p>

      {batchOpportunities.length > 0 && (
        <div className="space-y-4 mb-8">
          {batchOpportunities.map((opportunity) => (
            <div key={opportunity.operationId} className="border border-orange/40 bg-orange/5 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs bg-orange/20 text-orange px-2 py-1 rounded font-medium uppercase tracking-wide">
                  Batch opportunity identified
                </span>
                <h4 className="font-bold">{opportunity.title}</h4>
              </div>
              <ul className="text-sm text-gray-light space-y-1 mb-4">
                {opportunity.reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-orange flex-shrink-0 mt-0.5" />
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="px-3 py-2 rounded border border-gray-border bg-black/30 text-gray-light">
                  <div className="text-xs uppercase tracking-wide text-gray-light mb-0.5">Real-time execution</div>
                  <div className="font-medium text-white">Peak concurrency provisioning</div>
                </div>
                <div className="px-3 py-2 rounded border border-orange/40 bg-orange/10 text-gray-light">
                  <div className="text-xs uppercase tracking-wide text-orange mb-0.5">Deferred / batched execution</div>
                  <div className="font-medium text-orange">
                    {taskById.get(compiled.inferenceOperations.find((o) => o.id === opportunity.operationId)?.taskId ?? '')?.deadline ??
                      'Smoothed into regular batches'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {otherOpportunities.length > 0 && (
        <div className="grid md:grid-cols-2 gap-3">
          {otherOpportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.operationId + opportunity.kind} opportunity={opportunity} />
          ))}
        </div>
      )}

      {compiled.opportunities.length === 0 && (
        <p className="p-4 rounded-lg border border-gray-border text-sm text-gray-light">
          No batching or parallelisation opportunities identified for the current execution constraints.
        </p>
      )}
    </section>
  )
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const label =
    opportunity.kind === 'cache'
      ? 'Caching opportunity'
      : opportunity.kind === 'precompute'
        ? 'Precomputation opportunity'
        : opportunity.kind === 'parallel'
          ? 'Parallel opportunity'
          : opportunity.kind === 'async'
            ? 'Asynchronous opportunity'
            : 'Opportunity'
  return (
    <div className="border border-gray-border rounded-lg bg-gray-dark p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs bg-purple/20 text-purple px-2 py-1 rounded font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <h4 className="font-bold text-sm mb-2">{opportunity.title}</h4>
      <ul className="text-xs text-gray-light space-y-1">
        {opportunity.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2">
            <ArrowRight size={12} className="text-purple flex-shrink-0 mt-0.5" />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  )
}

function AssumptionsTable({ compiled }: { compiled: CompiledWorkload }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck size={20} className="text-accent" />
        <h3 className="text-xl font-bold">Assumptions</h3>
      </div>
      <p className="text-xs text-gray-light mb-4">
        Every value carries provenance. Nothing is silently invented.
      </p>
      <div className="overflow-x-auto rounded-lg border border-gray-border">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="bg-gray-dark text-left text-xs uppercase tracking-wider text-gray-light">
              <th className="px-4 py-3">Parameter</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Origin</th>
            </tr>
          </thead>
          <tbody>
            {compiled.assumptions.map((assumption, index) => (
              <tr key={assumption.parameter + index} className="border-t border-gray-border/60">
                <td className="px-4 py-2.5">{assumption.parameter}</td>
                <td className="px-4 py-2.5 font-mono text-xs">{assumption.value}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium ${richlyColoredProvenance(assumption.origin)}`}>
                    {assumption.origin}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ValidationPanel({ compiled }: { compiled: CompiledWorkload }) {
  const errors = compiled.validation.filter((v) => v.severity === 'error')
  const warnings = compiled.validation.filter((v) => v.severity === 'warning')
  const ok = compiled.validation.filter((v) => v.severity === 'ok')

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <Zap size={20} className="text-orange" />
        <h3 className="text-xl font-bold">Validation</h3>
      </div>
      <p className="text-xs text-gray-light mb-4">
        Errors prevent compilation only when the workload cannot be meaningfully represented;
        warnings still allow it.
      </p>
      <div className="space-y-2">
        {ok.map((validation) => (
          <div key={validation.message} className="flex items-start gap-2 text-sm text-accent">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
            {validation.message}
          </div>
        ))}
        {warnings.map((validation) => (
          <div key={validation.message} className="flex items-start gap-2 text-sm text-orange">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            {validation.message}
          </div>
        ))}
        {errors.map((validation) => (
          <div key={validation.message} className="flex items-start gap-2 text-sm text-red-400">
            <CircleOff size={16} className="flex-shrink-0 mt-0.5" />
            {validation.message}
          </div>
        ))}
        {compiled.validation.length === 0 && (
          <p className="text-sm text-gray-light">No validation results.</p>
        )}
      </div>
    </section>
  )
}

function PrivacyPanel() {
  return (
    <section>
      <div className="flex items-start gap-4 p-6 rounded-lg border border-gray-border bg-gray-dark">
        <Lock size={22} className="text-accent flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-bold mb-1">Your solution stays yours</h3>
          <p className="text-sm text-gray-light mb-2">
            The compiler is designed so proprietary implementation details can be analysed locally
            and transformed into a standardised workload representation. The downstream workload
            dataset contains the information required for simulation without requiring disclosure of
            the developer&apos;s proprietary solution.
          </p>
          <p className="text-xs text-gray-light/70">
            Intended architecture — this prototype does not yet provide production-grade
            privacy / security guarantees.
          </p>
        </div>
      </div>
    </section>
  )
}

function SimulationReady({ compiled }: { compiled: CompiledWorkload }) {
  const [copied, setCopied] = useState(false)
  const totalInference = compiled.scenarios.reduce((sum, s) => sum + s.totalInferenceOperationsPerMonth, 0)

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(compiled, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical size={24} className="text-orange" />
          <h3 className="text-2xl font-bold">Ready for inference simulation</h3>
        </div>
        <p className="text-sm text-gray-light mb-6 max-w-3xl">
          The compiled workload is provider- and model-neutral. It can now be run against different
          inference configurations to estimate workload, performance and cost — without the
          developer ever entering a token count.
        </p>

        <div className="p-5 rounded-lg border border-orange/40 bg-orange/5 mb-6">
          <p className="text-sm text-orange">
            <span className="font-bold">Token consumption is an output of the compilation and
            simulation process</span> — not an input the developer is expected to know. Every token
            profile below is marked <span className="font-bold">Compiler-derived</span>.
          </p>
        </div>

        {/* Example target configurations */}
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={18} className="text-purple" />
          <h4 className="text-lg font-bold">Example simulation targets</h4>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <TargetCard label="Model A" value="Single real-time model, all operations" />
          <TargetCard label="Model B" value="High-throughput model for batch ops" />
          <TargetCard label="Model C" value="Cheap classification model for routing" />
          <TargetCard label="Model combination" value="Mix per operation kind" />
          <TargetCard label="Real-time strategy" value="Peak-concurrency provisioning" />
          <TargetCard label="Batch strategy" value="Smoothed 30-min enrichment batches" />
        </div>

        <p className="text-xs text-gray-light mt-4">
          Provider pricing is not implemented in this prototype. This page demonstrates the compiler
          boundary, not the complete cost engine.
        </p>
      </section>

      {/* Token profile preview */}
      <section>
        <h4 className="text-lg font-bold mb-4">Compiler-derived token profiles</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-border">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="bg-gray-dark text-left text-xs uppercase tracking-wider text-gray-light">
                <th className="px-4 py-3">Operation</th>
                <th className="px-4 py-3">Input / call</th>
                <th className="px-4 py-3">Output / call</th>
                <th className="px-4 py-3">Origin</th>
              </tr>
            </thead>
            <tbody>
              {compiled.inferenceOperations.map((op) => {
                const profile = compiled.tokenProfiles[op.id]
                if (!profile) return null
                return (
                  <tr key={op.id} className="border-t border-gray-border/60">
                    <td className="px-4 py-2.5 whitespace-nowrap">{op.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{profile.inputTokensPerCall}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{profile.outputTokensPerCall}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-medium bg-accent/15 text-accent px-2 py-0.5 rounded">
                        {profile.provenance}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-light mt-2">
          Derived from content / context characteristics (instruction size, retrieved context, tool
          result size, output requirements) — {totalInference.toLocaleString()} inference
          operations/month in the sample workload scale with these profiles when simulated.
        </p>
      </section>

      {/* Export */}
      <section>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={copyJson}
            className="btn btn-secondary inline-flex items-center gap-2 min-h-[44px]"
          >
            <Copy size={18} /> {copied ? 'Copied' : 'Copy workload JSON'}
          </button>
        </div>
        <p className="text-xs text-gray-light mt-3">
          The workload dataset is the interchange format — provider- and model-neutral, runnable by
          a downstream simulation engine.
        </p>
      </section>
    </div>
  )
}

function TargetCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-border rounded-lg bg-gray-dark p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs bg-purple/20 text-purple px-2 py-0.5 rounded font-mono">{label}</span>
      </div>
      <p className="text-xs text-gray-light">{value}</p>
    </div>
  )
}