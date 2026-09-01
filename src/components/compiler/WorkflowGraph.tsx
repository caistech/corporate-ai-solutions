'use client'

import { useMemo } from 'react'
import { CompiledWorkload, InferenceOperation } from '@/lib/compiler/types'

// ============================================================================
// Lightweight SVG workflow graph built from existing UI primitives — no graph
// library. Nodes are laid out in layers based on dependency depth; operations
// in the same layer are parallel branches. Styling distinguishes inference
// operations, tool operations, dependencies, parallel branches and batch
// candidates.
// ============================================================================

const VIEW_W = 860
const VIEW_H_PAD = 40
const ROW_H = 96
const NODE_W = 168
const NODE_H = 44

interface NodeInfo {
  id: string
  label: string
  kind: 'inference' | 'tool' | 'trigger'
  execution?: InferenceOperation['execution']
  depth: number
}

interface EdgeInfo {
  from: string
  to: string
  style: 'solid' | 'parallel' | 'batch' | 'cross'
}

function executionStyle(execution?: InferenceOperation['execution']): EdgeInfo['style'] {
  switch (execution) {
    case 'batch':
      return 'batch'
    case 'async':
      return 'cross'
    case 'parallel':
      return 'parallel'
    default:
      return 'solid'
  }
}

export function WorkflowGraph({ compiled }: { compiled: CompiledWorkload }) {
  const { nodes, edges, height } = useMemo(() => {
    const agentName = new Map(compiled.agents.map((a) => [a.id, a.name]))
    const opById = new Map(compiled.inferenceOperations.map((o) => [o.id, o]))

    const nodes: NodeInfo[] = []
    const edges: EdgeInfo[] = []
    const depthById = new Map<string, number>()

    // Trigger pseudo-nodes per task.
    const triggerByTask = new Map<string, NodeInfo>()
    for (const task of compiled.tasks) {
      const triggerId = `trigger::${task.id}`
      const trigger: NodeInfo = {
        id: triggerId,
        label: task.triggeringEvent,
        kind: 'trigger',
        depth: 0,
      }
      triggerByTask.set(task.id, trigger)
      nodes.push(trigger)
      depthById.set(triggerId, 0)
    }

    // Ops, with dependency depth.
    for (const op of compiled.inferenceOperations) {
      const raw = new Set<string>(op.dependencyIds)
      let depth = 1
      const pending: string[] = Array.from(raw)
      const seen = new Set<string>()
      while (pending.length > 0) {
        const depId = pending.shift()
        if (!depId || seen.has(depId)) continue
        seen.add(depId)
        const known = depthById.get(depId)
        if (known !== undefined) {
          depth = Math.max(depth, known + 1)
        }
        const depOp = opById.get(depId)
        if (depOp) {
          for (const inner of depOp.dependencyIds) pending.push(inner)
        }
      }
      depthById.set(op.id, depth)
      nodes.push({
        id: op.id,
        label: `${agentName.get(op.agentId) ?? op.agentId} — ${op.kind}`,
        kind: op.kind === 'retrieval' ? 'tool' : 'inference',
        execution: op.execution,
        depth,
      })
    }

    // Edges: dependency edges (within + across tasks), styled by the *target* op execution.
    for (const op of compiled.inferenceOperations) {
      if (op.dependencyIds.length === 0) {
        const trigger = triggerByTask.get(op.taskId)
        if (trigger) edges.push({ from: trigger.id, to: op.id, style: 'solid' })
      }
      for (const depId of op.dependencyIds) {
        edges.push({
          from: depId,
          to: op.id,
          style: executionStyle(op.execution),
        })
      }
    }

    // Lay out by depth.
    const maxDepth = Math.max(0, ...nodes.map((n) => n.depth))
    const height = VIEW_H_PAD * 2 + (maxDepth + 1) * ROW_H

    return { nodes, edges, height }
  }, [compiled])

  // Grouped per depth for x positioning.
  const byDepth = useMemo(() => {
    const map = new Map<number, NodeInfo[]>()
    for (const node of nodes) {
      const list = map.get(node.depth) ?? []
      list.push(node)
      map.set(node.depth, list)
    }
    return map
  }, [nodes])

  const xFor = (node: NodeInfo): number => {
    const siblings = byDepth.get(node.depth)?.length ?? 1
    const index = (byDepth.get(node.depth) ?? []).findIndex((n) => n.id === node.id)
    const slot = siblings === 1 ? 0.5 : (index + 1) / (siblings + 1)
    return (slot * (VIEW_W - NODE_W)) + NODE_W / 2
  }

  const yFor = (depth: number): number => VIEW_H_PAD + depth * ROW_H + NODE_H / 2

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        className="w-full h-auto bg-black/30 border border-gray-border rounded-lg"
        role="img"
        aria-label="Derived inference-operation workflow graph"
      >
        <defs>
          <marker id="awc-arrow-solid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#00ff88" />
          </marker>
          <marker id="awc-arrow-parallel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
          </marker>
          <marker id="awc-arrow-batch" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff6b35" />
          </marker>
        </defs>

        {edges.map((edge, index) => {
          const from = nodes.find((n) => n.id === edge.from)
          const to = nodes.find((n) => n.id === edge.to)
          if (!from || !to) return null
          const x1 = xFor(from)
          const y1 = yFor(from.depth) + NODE_H / 2
          const x2 = xFor(to)
          const y2 = yFor(to.depth) - NODE_H / 2
          const midY = (y1 + y2) / 2
          const stroke =
            edge.style === 'parallel'
              ? '#a855f7'
              : edge.style === 'batch'
                ? '#ff6b35'
                : edge.style === 'cross'
                  ? '#888888'
                  : '#00ff88'
          const dash =
            edge.style === 'parallel'
              ? '6 4'
              : edge.style === 'batch'
                ? '3 5'
                : edge.style === 'cross'
                  ? '2 4'
                  : undefined
          const marker =
            edge.style === 'parallel'
              ? 'url(#awc-arrow-parallel)'
              : edge.style === 'batch'
                ? 'url(#awc-arrow-batch)'
                : 'url(#awc-arrow-solid)'
          return (
            <path
              key={`${edge.from}-${edge.to}-${index}`}
              d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
              fill="none"
              stroke={stroke}
              strokeWidth={edge.style === 'cross' ? 1.25 : 1.75}
              strokeDasharray={dash}
              markerEnd={marker}
              opacity={0.85}
            />
          )
        })}

        {nodes.map((node) => {
          const cx = xFor(node)
          const cy = yFor(node.depth)
          const isTrigger = node.kind === 'trigger'
          const isTool = node.kind === 'tool'
          const isBatch = node.execution === 'batch'
          const fill = isTrigger
            ? '#0a0a0a'
            : isTool
              ? 'rgba(168,85,247,0.08)'
              : 'rgba(0,255,136,0.06)'
          const stroke = isTrigger
            ? '#888888'
            : isTool
              ? '#a855f7'
              : isBatch
                ? '#ff6b35'
                : '#00ff88'
          const dash = isBatch ? '3 4' : isTrigger ? '3 4' : undefined
          return (
            <g key={node.id} transform={`translate(${cx} ${cy})`}>
              <rect
                x={-NODE_W / 2}
                y={-NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                rx={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
                strokeDasharray={dash}
              />
            </g>
          )
        })}

        {nodes.map((node) => {
          const cx = xFor(node)
          const cy = yFor(node.depth)
          const isTrigger = node.kind === 'trigger'
          const isTool = node.kind === 'tool'
          const isBatch = node.execution === 'batch'
          const face = isTrigger ? '#888888' : isTool ? '#c084fc' : isBatch ? '#ff6b35' : '#00ff88'
          return (
            <text
              key={node.id}
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11.5}
              fontFamily="inherit"
              fontWeight={isTrigger ? 500 : 600}
              fill={face}
            >
              <title>{node.id}</title>
              {node.label.length > 26 ? node.label.slice(0, 24) + '…' : node.label}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-light">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-accent inline-block" /> Inference op
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple inline-block" /> Tool op
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-accent inline-block" /> Real-time dependency
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-dashed border-purple inline-block" /> Parallel branch
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 border-t-2 border-dashed border-orange inline-block" /> Batch candidate
        </span>
      </div>
    </div>
  )
}