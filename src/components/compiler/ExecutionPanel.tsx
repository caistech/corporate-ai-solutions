'use client'

import { CheckCircle2, Clock, Hourglass } from 'lucide-react'
import { compileExecutionProfile } from '@/lib/compiler/compiler'
import { Solution, Task } from '@/lib/compiler/types'
import { AVAILABILITY_OPTIONS } from './constants'

function formatLatency(seconds?: number): string {
  if (!seconds) return '—'
  if (seconds < 60) return `< ${seconds}s`
  if (seconds < 3600) return `< ${Math.round(seconds / 60)} min`
  return `< ${seconds / 3600} h`
}

function formatMode(mode: string): string {
  switch (mode) {
    case 'realtime':
      return 'Synchronous'
    case 'async':
      return 'Asynchronous'
    case 'batch':
      return 'Asynchronous / Batch'
    default:
      return mode
  }
}

export function ExecutionPanel({
  solution,
  onTaskChange,
}: {
  solution: Solution
  onTaskChange: (taskId: string, patch: Partial<Task>) => void
}) {
  return (
    <div className="space-y-12">
      {/* The one business question, per task */}
      <section>
        <h3 className="text-2xl font-bold mb-2">When does this result need to be available?</h3>
        <p className="text-sm text-gray-light mb-6">
          Answer in business terms. The compiler translates the answer into execution
          characteristics — latency requirement, batching, parallelism. No technical token
          question is exposed.
        </p>

        <div className="space-y-6">
          {solution.tasks.map((task) => {
            const profile = compileExecutionProfile(task)
            return (
              <div key={task.id} className="border border-gray-border rounded-lg bg-gray-dark p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <div className="flex-grow">
                    <h4 className="font-bold">{task.name}</h4>
                    <p className="text-xs text-gray-light">{task.businessPurpose}</p>
                  </div>
                  <label className="block">
                    <span className="sr-only">Availability requirement for {task.name}</span>
                    <select
                      value={task.availability}
                      onChange={(e) =>
                        onTaskChange(task.id, {
                          availability: e.target.value as Task['availability'],
                        })
                      }
                      className="input max-w-none md:max-w-[320px]"
                    >
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Blocks-on-completion toggle */}
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={task.blocksOnCompletion}
                    onClick={() =>
                      onTaskChange(task.id, { blocksOnCompletion: !task.blocksOnCompletion })
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors min-h-[44px] ${
                      task.blocksOnCompletion ? 'bg-accent' : 'bg-gray-mid'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        task.blocksOnCompletion ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-light">
                    Does the user need the result before continuing?
                  </span>
                </div>

                {/* Derived profile */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                  <ProfileChip label="Execution mode" value={formatMode(profile.mode)} accent />
                  {profile.latencyRequirementSeconds ? (
                    <ProfileChip
                      label="Latency requirement"
                      value={formatLatency(profile.latencyRequirementSeconds)}
                    />
                  ) : null}
                  {profile.deadline ? <ProfileChip label="Deadline" value={profile.deadline} /> : null}
                  {profile.batchable ? (
                    <ProfileChip
                      label="Batch window"
                      value={profile.batchWindowMinutes ? `${profile.batchWindowMinutes} min` : 'Yes'}
                    />
                  ) : (
                    <ProfileChip label="Batchable" value="No" />
                  )}
                  <ProfileChip label="Parallelisable" value={profile.parallelisable ? 'Yes' : 'No'} />
                  <ProfileChip label="Ordering required" value={profile.orderingRequired ? 'Yes' : 'No'} />
                </div>
                <p className="text-xs text-gray-light mt-3 flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-accent" />
                  Derived by the compiler from the business answer — not entered by the developer.
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ============ CRITICAL DEMONSTRATION ============ */}
      <section id="why-execution-matters">
        <div className="flex items-center gap-3 mb-2">
          <Hourglass size={22} className="text-orange" />
          <h3 className="text-2xl font-bold">Why execution requirements matter</h3>
        </div>
        <p className="text-sm text-gray-light mb-6 max-w-3xl">
          The same logical workload under two execution profiles — real-time vs deferred. The work
          may be identical; the execution requirements are not. That can materially change how
          inference should be provisioned, and therefore its economics.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Scenario A — Real-time */}
          <ScenarioCard
            tag="Scenario A"
            tone="accent"
            title={solution.tasks[0]?.name ?? 'Customer response'}
            subtitle="Customer response"
            rows={[
              ['Latency', '< 3 seconds'],
              ['Execution', 'Synchronous'],
              ['Batching', 'Unavailable'],
            ]}
            illustration={
              <div className="space-y-2">
                <div className="h-3 rounded bg-accent/30 w-full" />
                <div className="h-3 rounded bg-accent/20 w-3/4" />
                <div className="h-3 rounded bg-accent/20 w-5/6" />
              </div>
            }
          />

          {/* Scenario B — Deferred */}
          <ScenarioCard
            tag="Scenario B"
            tone="orange"
            title={solution.tasks[1]?.name ?? 'Customer enrichment'}
            subtitle="Customer enrichment"
            rows={[
              ['Deadline', '6 hours'],
              ['Batch window', '30 minutes'],
              ['Execution', 'Asynchronous / Batch'],
              ['Batching', 'Available'],
            ]}
            illustration={
              <div className="space-y-2 opacity-60">
                <div className="h-3 rounded bg-orange/30 w-2/3" />
                <div className="h-3 rounded bg-orange/20 w-1/2" />
              </div>
            }
          />
        </div>

        <div className="mt-6 p-5 rounded-lg border border-gray-border bg-gray-dark">
          <p className="text-gray-light text-sm italic">
            The logical work may be identical, but the execution requirements are different. That can
            materially change how inference should be provisioned and therefore its economics.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2 text-accent">
              <Clock size={16} /> Real-time: inference must be provisioned for peak concurrency
            </span>
            <span className="flex items-center gap-2 text-orange">
              <Hourglass size={16} /> Deferred: inference can be smoothed into 30-min batches
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-light mt-4">
          Workload modelling is about more than counting tokens. A 3-second response requirement is
          economically different from a 6-hour batch deadline — even when the number of inference
          calls is identical.
        </p>
      </section>
    </div>
  )
}

function ProfileChip({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className={`px-3 py-2 rounded border ${accent ? 'border-accent/40 bg-accent/10' : 'border-gray-border bg-black/30'}`}>
      <div className="text-xs text-gray-light uppercase tracking-wide mb-0.5">{label}</div>
      <div className={`font-medium ${accent ? 'text-accent' : 'text-white'}`}>{value}</div>
    </div>
  )
}

function ScenarioCard({
  tag,
  tone,
  title,
  subtitle,
  rows,
  illustration,
}: {
  tag: string
  tone: 'accent' | 'orange'
  title: string
  subtitle: string
  rows: [string, string][]
  illustration: React.ReactNode
}) {
  const accentBorder = tone === 'accent' ? 'border-accent/40' : 'border-orange/40'
  const tagColor = tone === 'accent' ? 'text-accent' : 'text-orange'
  return (
    <div className={`p-6 border rounded-lg bg-gray-dark ${accentBorder}`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`font-mono text-xs uppercase tracking-widest ${tagColor}`}>{tag}</span>
        <span className="text-xs bg-black/40 border border-gray-border px-2 py-1 rounded">{subtitle}</span>
      </div>
      <h4 className="text-lg font-bold mb-4">{title}</h4>
      <div className="text-sm mb-5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-border/40 last:border-0">
            <span className="text-gray-light">{label}</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none select-none">{illustration}</div>
    </div>
  )
}