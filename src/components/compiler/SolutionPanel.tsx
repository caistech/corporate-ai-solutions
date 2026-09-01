'use client'

import { useState } from 'react'
import {
  Bot,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleDot,
  GitBranch,
  Package,
  Wand2,
} from 'lucide-react'
import { Solution } from '@/lib/compiler/types'

export function SolutionPanel({
  solution,
  onSolutionChange,
}: {
  solution: Solution
  onSolutionChange: (next: Solution) => void
}) {
  const [openAgent, setOpenAgent] = useState<string | null>(null)
  const [openTask, setOpenTask] = useState<string | null>(null)

  const setVolume = (taskId: string, value: number) => {
    onSolutionChange({
      ...solution,
      tasks: solution.tasks.map((t) =>
        t.id === taskId ? { ...t, expectedVolumePerMonth: Math.max(0, value) } : t
      ),
    })
  }

  const agentById = (id: string) => solution.agents.find((a) => a.id === id)
  const toolById = (id: string) => solution.tools.find((t) => t.id === id)

  return (
    <div className="space-y-10">
      {/* Agents */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <Bot size={22} className="text-accent" />
          <h3 className="text-2xl font-bold">Agents</h3>
        </div>
        <p className="text-sm text-gray-light mb-6">
          Each agent carries a purpose and a model role. The compiler uses these to derive inference
          operations — you never describe tokens.
        </p>
        <div className="space-y-3">
          {solution.agents.map((agent) => {
            const open = openAgent === agent.id
            return (
              <div key={agent.id} className="border border-gray-border rounded-lg bg-gray-dark overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenAgent(open ? null : agent.id)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors min-h-[44px]"
                >
                  <div className="flex items-center gap-3">
                    <Bot size={18} className="text-accent flex-shrink-0" />
                    <div>
                      <span className="font-bold">{agent.name}</span>
                      <span className="text-gray-light text-sm ml-3 hidden md:inline">{agent.purpose}</span>
                    </div>
                  </div>
                  {open ? <ChevronDown size={18} className="text-gray-light flex-shrink-0" /> : <ChevronRight size={18} className="text-gray-light flex-shrink-0" />}
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-border/60">
                    <dl className="grid gap-y-4 sm:grid-cols-2 sm:gap-x-8 text-sm mt-4">
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Purpose</dt>
                        <dd>{agent.purpose}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Model role</dt>
                        <dd className="flex items-center gap-1.5">
                          <Wand2 size={14} className="text-orange" /> {agent.modelRole}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Tools</dt>
                        <dd className="flex flex-wrap gap-2">
                          {agent.toolIds.length ? (
                            agent.toolIds.map((toolId) => {
                              const tool = toolById(toolId)
                              return (
                                <span key={toolId} className="inline-flex items-center gap-1.5 text-xs bg-black/40 border border-gray-border px-2 py-1 rounded">
                                  <Package size={12} className="text-accent" /> {tool?.name ?? toolId}
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-gray-light/60">No tools</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Downstream agents</dt>
                        <dd className="flex flex-wrap gap-2">
                          {agent.downstreamAgentIds.length ? (
                            agent.downstreamAgentIds.map((downId) => (
                              <span key={downId} className="inline-flex items-center gap-1.5 text-xs bg-black/40 border border-gray-border px-2 py-1 rounded">
                                <GitBranch size={12} className="text-orange" /> {agentById(downId)?.name ?? downId}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-light/60">None</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Tasks */}
      <section>
        <div className="flex items-center gap-3 mb-2">
          <CalendarClock size={22} className="text-purple" />
          <h3 className="text-2xl font-bold">Tasks</h3>
        </div>
        <p className="text-sm text-gray-light mb-6">
          Tasks carry the business volume. Volume is developer input — the compiler derives
          operations-per-work-unit and total inference operations from the workflow.
        </p>
        <div className="space-y-3">
          {solution.tasks.map((task) => {
            const open = openTask === task.id
            return (
              <div key={task.id} className="border border-gray-border rounded-lg bg-gray-dark overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenTask(open ? null : task.id)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors min-h-[44px]"
                >
                  <div>
                    <span className="font-bold">{task.name}</span>
                    <span className="text-gray-light text-sm ml-3 hidden md:inline">{task.businessPurpose}</span>
                  </div>
                  {open ? <ChevronDown size={18} className="text-gray-light flex-shrink-0" /> : <ChevronRight size={18} className="text-gray-light flex-shrink-0" />}
                </button>
                {open && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-border/60">
                    <dl className="grid gap-y-4 sm:grid-cols-2 sm:gap-x-8 text-sm mt-4">
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Business purpose</dt>
                        <dd>{task.businessPurpose}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Triggering event</dt>
                        <dd className="flex items-center gap-1.5">
                          <CircleDot size={14} className="text-accent" /> {task.triggeringEvent}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Agents involved</dt>
                        <dd className="flex flex-wrap gap-2">
                          {task.agentIds.map((agentId) => (
                            <span key={agentId} className="inline-flex items-center gap-1.5 text-xs bg-black/40 border border-gray-border px-2 py-1 rounded">
                              <Bot size={12} className="text-accent" /> {agentById(agentId)?.name ?? agentId}
                            </span>
                          ))}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Tools involved</dt>
                        <dd className="flex flex-wrap gap-2">
                          {task.toolIds.length ? (
                            task.toolIds.map((toolId) => (
                              <span key={toolId} className="inline-flex items-center gap-1.5 text-xs bg-black/40 border border-gray-border px-2 py-1 rounded">
                                <Package size={12} className="text-purple" /> {toolById(toolId)?.name ?? toolId}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-light/60">None</span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">
                          Expected business volume (per month)
                        </dt>
                        <dd>
                          <label className="sr-only" htmlFor={`volume-${task.id}`}>
                            Expected business volume per month for {task.name}
                          </label>
                          <input
                            id={`volume-${task.id}`}
                            type="number"
                            min={0}
                            value={task.expectedVolumePerMonth}
                            onChange={(e) => setVolume(task.id, Number(e.target.value))}
                            className="input max-w-[220px]"
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-light uppercase tracking-wide text-xs mb-1">Availability</dt>
                        <dd className="text-gray-light">{task.availability}</dd>
                      </div>
                    </dl>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Workflows + Tools */}
      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center gap-3 mb-2">
            <GitBranch size={22} className="text-orange" />
            <h3 className="text-2xl font-bold">Workflows</h3>
          </div>
          <p className="text-sm text-gray-light mb-4">
            The routing between agents. Dependencies are resolved from these links.
          </p>
          <ul className="space-y-2">
            {solution.workflows.map((wf) => (
              <li key={wf.id} className="flex items-center gap-2 text-sm border border-gray-border rounded px-3 py-2 bg-gray-dark">
                <span className="text-white font-medium">{agentById(wf.fromAgentId)?.name ?? wf.fromAgentId}</span>
                <ChevronRight size={14} className="text-accent flex-shrink-0" />
                <span className="text-white font-medium">{agentById(wf.toAgentId)?.name ?? wf.toAgentId}</span>
                <span className="text-gray-light text-xs ml-auto hidden sm:inline">{wf.triggeringEvent}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-2">
            <Package size={22} className="text-purple" />
            <h3 className="text-2xl font-bold">Tools &amp; Models</h3>
          </div>
          <p className="text-sm text-gray-light mb-4">
            Tool operations are distinct from inference operations — the compiler keeps them separate.
          </p>
          <div className="space-y-2">
            {solution.tools.map((tool) => (
              <div key={tool.id} className="border border-gray-border rounded px-3 py-2 bg-gray-dark text-sm">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-accent flex-shrink-0" />
                  <span className="font-medium">{tool.name}</span>
                  <span className="text-gray-light text-xs ml-auto">{tool.kind.replace('-', ' ')}</span>
                </div>
                <p className="text-gray-light text-xs mt-1">{tool.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {solution.models.map((model) => (
              <div key={model.id} className="border border-gray-border rounded px-3 py-2 bg-gray-dark text-sm flex items-center gap-2">
                <Wand2 size={14} className="text-orange flex-shrink-0" />
                <span className="font-medium">{model.name}</span>
                <span className="text-gray-light text-xs">{model.role}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}