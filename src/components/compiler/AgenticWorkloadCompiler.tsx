'use client'

import { useCallback, useRef, useState } from 'react'
import {
  Boxes,
  FlaskConical,
  Hammer,
  Info,
  Layers,
  Loader2,
  RefreshCcw,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'
import { compileWorkload } from '@/lib/compiler/compiler'
import { SAMPLE_SOLUTION, cloneSolution } from '@/lib/compiler/sample'
import { CompiledWorkload, Solution } from '@/lib/compiler/types'
import { SolutionPanel } from './SolutionPanel'
import { ExecutionPanel } from './ExecutionPanel'
import { CompilePanel } from './CompilePanel'
import { WorkloadPanel } from './WorkloadPanel'

export type Stage = 1 | 2 | 3 | 4 | 5

const STAGES: { id: Stage; label: string }[] = [
  { id: 1, label: 'Solution' },
  { id: 2, label: 'Execution' },
  { id: 3, label: 'Compile' },
  { id: 4, label: 'Workload' },
  { id: 5, label: 'Simulate' },
]

export function AgenticWorkloadCompiler() {
  const [solution, setSolution] = useState<Solution>(() => cloneSolution(SAMPLE_SOLUTION))
  const [compiled, setCompiled] = useState<CompiledWorkload | null>(null)
  const [snapshot, setSnapshot] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>(1)
  const [compiling, setCompiling] = useState(false)
  const [progressStep, setProgressStep] = useState(-1)
  const [completeMessage, setCompleteMessage] = useState(false)
  // Guards against a stale compile-progress chain committing after the user
  // started a new compile or reloaded the example mid-flight.
  const compileRunIdRef = useRef(0)

  const solutionSignature = JSON.stringify(solution)

  const loadExample = () => {
    compileRunIdRef.current += 1
    setSolution(cloneSolution(SAMPLE_SOLUTION))
    setCompiled(null)
    setSnapshot(null)
    setCompiling(false)
    setCompleteMessage(false)
    setProgressStep(-1)
    setStage(1)
  }

  const compile = () => {
    const runId = ++compileRunIdRef.current
    setCompiling(true)
    setCompleteMessage(false)
    setProgressStep(0)

    // Run the deterministic compile immediately (the result is real, not faked);
    // reveal it through the staged progress steps so the pipeline is visible.
    const workload = compileWorkload(solution)
    const run = (index: number) => {
      window.setTimeout(() => {
        if (compileRunIdRef.current !== runId) return
        setProgressStep(index)
        if (index === 4) {
          setCompiled(workload)
          setSnapshot(JSON.stringify(solution))
          setCompleteMessage(true)
          setCompiling(false)
          return
        }
        run(index + 1)
      }, 320)
    }
    run(0)
  }

  const isStale = compiled !== null && snapshot !== null && snapshot !== solutionSignature

  const updateTask = useCallback(
    (taskId: string, patch: Partial<Solution['tasks'][number]>) => {
      setSolution((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      }))
    },
    []
  )

  const goToWorkload = () => {
    compileRunIdRef.current += 1
    setProgressStep(-1)
    setStage(4)
  }

  const stageIcons: Record<Stage, React.ReactNode> = {
    1: <Layers size={24} className="text-accent" />,
    2: <SlidersHorizontal size={24} className="text-orange" />,
    3: <Hammer size={24} className="text-purple" />,
    4: <Boxes size={24} className="text-accent" />,
    5: <FlaskConical size={24} className="text-orange" />,
  }

  const stageDescriptions: Record<Stage, string> = {
    1: 'Describe what the system does: agents, tasks, workflows and tools. You describe the solution; the compiler derives the workload from its structure.',
    2: 'The only question worth asking: when does the result need to be available? The compiler maps the business answer to execution characteristics.',
    3: 'Runs the deterministic compiler over the current solution: inference operations, execution profiles, token profiles, batching and validation.',
    4: 'The standardised, provider-neutral workload dataset derived from your solution — inference operations, execution opportunities, assumptions with provenance, and validation.',
    5: 'The compiled workload is ready to run against different inference configurations to estimate workload, performance and cost.',
  }

  return (
    <div className="min-h-screen">
      {/* ============ Hero ============ */}
      <section className="section bg-grid pt-20 pb-14">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-medium uppercase tracking-wider">
              Functional prototype
            </span>
            <span className="text-xs bg-gray-mid/60 text-gray-light px-3 py-1 rounded-full font-medium uppercase tracking-wider">
              Compiler boundary only
            </span>
          </div>
          <h1 className="mb-5">Agentic Workload Compiler</h1>
          <p className="text-xl text-white mb-4 max-w-3xl">
            Turn an agentic solution into a standardised workload model —{' '}
            <span className="text-accent">without asking the developer to estimate token usage.</span>
          </p>
          <p className="text-lg text-gray-light mb-8 max-w-3xl">
            You know what your agentic system does. We determine what inference workload that creates.
          </p>

          {/* Core product principle — developer provides / compiler determines */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl">
            <div className="p-5 bg-black/40 rounded-lg border border-accent/30">
              <p className="text-sm font-bold text-accent uppercase tracking-wide mb-2">
                Developers provide the solution
              </p>
              <p className="text-sm text-gray-light">
                Agents, tasks, workflows, tools and business volume. No token counts.
              </p>
            </div>
            <div className="p-5 bg-black/40 rounded-lg border border-orange/30">
              <p className="text-sm font-bold text-orange uppercase tracking-wide mb-2">
                The compiler determines the workload
              </p>
              <p className="text-sm text-gray-light">
                Inference operations, execution profiles, token profiles and batching opportunities —
                derived, not requested.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={compile}
              disabled={compiling}
              className="btn btn-primary inline-flex items-center gap-2 min-h-[44px]"
            >
              {compiling ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              Compile Workload
            </button>
            <button
              type="button"
              onClick={loadExample}
              className="btn btn-secondary inline-flex items-center gap-2 min-h-[44px]"
            >
              <RefreshCcw size={18} /> Load Example
            </button>
          </div>
        </div>
      </section>

      {/* ============ Stepper ============ */}
      <nav
        aria-label="Compiler workflow stages"
        className="sticky top-0 z-40 bg-black/90 backdrop-blur border-b border-gray-border"
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 overflow-x-auto">
          <ol className="flex items-center gap-1 py-3 min-w-max">
            {STAGES.map((s, index) => {
              const active = stage === s.id
              const reachable = s.id <= 3 || compiled !== null
              return (
                <li key={s.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (reachable) setStage(s.id)
                    }}
                    disabled={!reachable}
                    aria-current={active ? 'step' : undefined}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                      active
                        ? 'bg-accent/15 text-accent'
                        : reachable
                          ? 'text-gray-light hover:text-white hover:bg-white/5'
                          : 'text-gray-light/40 cursor-not-allowed'
                    }`}
                  >
                    <span className="font-mono text-xs">{index + 1}</span>
                    <span>{s.label}</span>
                  </button>
                  {index < STAGES.length - 1 && <span className="w-6 h-px bg-gray-border mx-1" aria-hidden />}
                </li>
              )
            })}
          </ol>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        {/* Stale banner */}
        {isStale && (
          <div className="mb-8 p-4 rounded-lg border border-orange/40 bg-orange/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-grow">
              <Info size={18} className="text-orange flex-shrink-0" />
              <p className="text-sm text-orange">
                Your solution changed since the last compilation. Recompile to refresh the workload
                dataset.
              </p>
            </div>
            <button type="button" onClick={compile} className="btn btn-orange btn-sm inline-flex items-center gap-2">
              <Hammer size={16} /> Recompile
            </button>
          </div>
        )}

        {/* Stage heading */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {stageIcons[stage]}
            <span className="font-mono text-xs uppercase tracking-widest text-gray-light">
              Stage {stage} of 5
            </span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{STAGES.find((s) => s.id === stage)?.label}</h2>
          <p className="text-gray-light max-w-3xl">{stageDescriptions[stage]}</p>
        </header>

        {/* Stage 1 — Solution */}
        {stage === 1 && <SolutionPanel solution={solution} onSolutionChange={setSolution} />}

        {/* Stage 2 — Execution requirements */}
        {stage === 2 && <ExecutionPanel solution={solution} onTaskChange={updateTask} />}

        {/* Stage 3 — Compile */}
        {stage === 3 && (
          <CompilePanel
            compiling={compiling}
            progressStep={progressStep}
            completeMessage={completeMessage}
            onCompile={compile}
            onViewWorkload={goToWorkload}
            hasWorkload={compiled !== null}
            operationCount={compiled?.inferenceOperations.length ?? 0}
            taskCount={solution.tasks.length}
          />
        )}

        {/* Stages 4 + 5 — Workload dataset + simulation */}
        {(stage === 4 || stage === 5) &&
          (compiled ? (
            <WorkloadPanel compiled={compiled} stage={stage} />
          ) : (
            <div className="p-8 border border-gray-border rounded-lg bg-gray-dark text-center">
              <p className="text-gray-light mb-4">No workload compiled yet.</p>
              <button
                type="button"
                onClick={compile}
                className="btn btn-primary inline-flex items-center gap-2 min-h-[44px]"
              >
                <Hammer size={18} /> Compile Workload
              </button>
            </div>
          ))}
      </main>
    </div>
  )
}