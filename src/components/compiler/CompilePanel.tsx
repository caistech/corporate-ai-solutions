'use client'

import { Boxes, CheckCircle2, Hammer, Loader2 } from 'lucide-react'
import { COMPILE_STEPS } from './constants'

export function CompilePanel({
  compiling,
  progressStep,
  completeMessage,
  onCompile,
  onViewWorkload,
  hasWorkload,
  operationCount,
  taskCount,
}: {
  compiling: boolean
  progressStep: number
  completeMessage: boolean
  onCompile: () => void
  onViewWorkload: () => void
  hasWorkload: boolean
  operationCount: number
  taskCount: number
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="p-8 border border-gray-border rounded-lg bg-gray-dark">
        <h3 className="text-xl font-bold mb-2">Compilation</h3>
        <p className="text-sm text-gray-light mb-6">
          The compiler inspects agents, tasks, workflows, tools and execution constraints, then
          derives the inference-operation graph, compiler-derived token profiles, execution
          opportunities and validation. Identical input always produces identical output — the
          workload digest encoding the source solution is printed in the dataset view.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onCompile}
            disabled={compiling}
            className="btn btn-primary inline-flex items-center gap-2 min-h-[44px]"
          >
            {compiling ? <Loader2 size={18} className="animate-spin" /> : <Hammer size={18} />}
            {compiling ? 'Compiling…' : 'Compile Workload'}
          </button>
          {hasWorkload && (
            <button
              type="button"
              onClick={onViewWorkload}
              className="btn btn-secondary inline-flex items-center gap-2 min-h-[44px]"
            >
              <Boxes size={18} /> View workload dataset
            </button>
          )}
        </div>

        {compiling && (
          <div className="mt-6 space-y-2" role="status" aria-live="polite">
            {COMPILE_STEPS.map((stepLabel, index) => (
              <div
                key={stepLabel}
                className={`flex items-center gap-3 text-sm transition-colors ${
                  index < progressStep || completeMessage
                    ? 'text-accent'
                    : index === progressStep
                      ? 'text-white'
                      : 'text-gray-light/40'
                }`}
              >
                {index < progressStep || completeMessage ? (
                  <CheckCircle2 size={16} className="text-accent" />
                ) : index === progressStep ? (
                  <Loader2 size={16} className="animate-spin text-accent" />
                ) : (
                  <span className="w-4 h-4 border border-gray-border rounded-full" aria-hidden />
                )}
                {stepLabel}
              </div>
            ))}
          </div>
        )}

        {completeMessage && (
          <div className="mt-6 p-4 rounded-lg border border-accent/40 bg-accent/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={18} className="text-accent" />
              <span className="font-bold text-accent">Compilation complete</span>
            </div>
            <p className="text-sm text-gray-light">
              Derived {operationCount} inference operations across {taskCount} tasks. No token counts
              were requested — every token profile is compiler-derived.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}