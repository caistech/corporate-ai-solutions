import {
  Agent,
  Assumption,
  CompiledWorkload,
  ExecutionProfile,
  InferenceOperation,
  Opportunity,
  Solution,
  Task,
  TokenProfile,
  ValidationResult,
  WorkloadScenario,
} from './types'

// ============================================================================
// Agentic Workload Compiler — deterministic client-side compilation.
//
// `compileWorkload(solution)` inspects agents/tasks/workflows/tools/execution
// requirements and DERIVES a standardised, provider- and model-neutral workload:
// inference-operation graph, execution profiles, token profiles, batching and
// parallel opportunities, assumptions (with provenance), and validation.
//
// The developer never provides token counts — token profiles are derived from
// content/context characteristics and clearly labelled "Compiler-derived".
//
// Deterministic: identical input always produces identical output.
// ============================================================================

export const COMPILER_VERSION = '0.1.0'
export const SCHEMA_VERSION = '0.1.0'

// A short deterministic hash so a workload compiled from the same solution is
// stable, and changes when the solution changes.
function solutionDigest(solution: Solution): string {
  const json = JSON.stringify({
    agents: solution.agents,
    tasks: solution.tasks,
    tools: solution.tools,
    workflows: solution.workflows,
  })
  let hash = 0
  for (let i = 0; i < json.length; i++) {
    hash = (hash << 5) - hash + json.charCodeAt(i)
    hash |= 0
  }
  return (hash >>> 0).toString(16)
}

// --- Execution profile derivation --------------------------------------------
// Derive an ExecutionProfile from a business-level availability requirement.
// This is the "important UI question": WHEN does this result need to be available?
// Exported so the UI can preview a single task's profile without a full compile.
export function compileExecutionProfile(task: Task): ExecutionProfile {
  const base: ExecutionProfile = {
    mode: 'realtime',
    batchable: false,
    parallelisable: false,
    orderingRequired: false,
    precomputable: false,
    cacheable: false,
  }

  switch (task.availability) {
    case 'Immediately':
      base.mode = 'realtime'
      base.latencyRequirementSeconds = 3
      break
    case 'Within-seconds':
      base.mode = 'realtime'
      base.latencyRequirementSeconds = 30
      break
    case 'Within-minutes':
      base.mode = 'async'
      base.latencyRequirementSeconds = 300
      base.batchable = true
      base.batchWindowMinutes = 5
      break
    case 'Within-an-hour':
      base.mode = 'async'
      base.latencyRequirementSeconds = 3600
      base.batchable = true
      base.batchWindowMinutes = 15
      break
    case 'By-defined-deadline': {
      base.mode = 'batch'
      base.deadline = task.deadline
      base.batchable = true
      base.batchWindowMinutes = task.batchWindowMinutes ?? 30
      break
    }
    case 'No-immediate-requirement':
      base.mode = 'batch'
      base.batchable = true
      base.batchWindowMinutes = task.batchWindowMinutes ?? 60
      break
  }

  // A task that does not block the user can be batched/parallelised.
  if (!task.blocksOnCompletion) {
    base.batchable = true
    base.parallelisable = true
  }

  // More than one agent involved in a task implies parallel branches.
  if (task.agentIds.length > 1) {
    base.parallelisable = true
  }

  return base
}

function kindForAgent(agent: Agent): InferenceOperation['kind'] {
  const role = agent.modelRole.toLowerCase()
  if (role.includes('classif') || role.includes('rout')) return 'classification'
  if (role.includes('retriev') || role.includes('extract')) return 'retrieval'
  if (role.includes('generation') || role.includes('final')) return 'generation'
  return 'reasoning'
}

function kindLabel(kind: InferenceOperation['kind']): string {
  switch (kind) {
    case 'classification': return 'classification'
    case 'reasoning': return 'reasoning'
    case 'generation': return 'response generation'
    case 'retrieval': return 'lookup'
  }
}

function executionForProfile(
  op: Pick<InferenceOperation, 'kind'>,
  profile: ExecutionProfile
): InferenceOperation['execution'] {
  if (profile.mode === 'batch') return 'batch'
  if (profile.mode === 'async') return 'async'
  // Tool-first lookups that run alongside reasoning (CRM branch) are parallel.
  if (op.kind === 'retrieval' && profile.parallelisable) return 'parallel'
  return 'realtime'
}

// --- Inference operation construction ----------------------------------------
// One inference operation per (task, agent) pair. Tool-first agents (CRM lookup)
// are still emitted so tool operations are visible in the graph.
function buildInferenceOperations(
  solution: Solution,
  executionProfiles: Record<string, ExecutionProfile>
): InferenceOperation[] {
  const operations: InferenceOperation[] = []
  const agentById = new Map(solution.agents.map((a) => [a.id, a]))

  for (const task of solution.tasks) {
    for (const agentId of task.agentIds) {
      const agent = agentById.get(agentId)
      if (!agent) continue

      const kind = kindForAgent(agent)
      const profile = executionProfiles[task.id]

      operations.push({
        id: `${task.id}::${agent.id}::${kind}`,
        name: `${agent.name} — ${kindLabel(kind)}`,
        kind,
        agentId: agent.id,
        taskId: task.id,
        trigger: task.triggeringEvent,
        execution: executionForProfile({ kind }, profile),
        dependencyIds: [],
      })
    }
  }

  return operations
}

// Workflow adjacency: agentId -> downstream agent ids (ordered, deduped).
function workflowEdges(solution: Solution): Map<string, string[]> {
  const edges = new Map<string, string[]>()
  for (const wf of solution.workflows) {
    const list = edges.get(wf.fromAgentId) ?? []
    if (!list.includes(wf.toAgentId)) list.push(wf.toAgentId)
    edges.set(wf.fromAgentId, list)
  }
  return edges
}

// --- Dependency resolution ---------------------------------------------------
// An operation depends on every inference operation whose agent is *upstream*
// of it in the workflow graph for the same task context. Cross-task, an
// operation depends on every operation of the tasks its task depends on —
// enrichment (deferred) only starts once the realtime respond path is done.
function resolveDependencies(
  solution: Solution,
  operations: InferenceOperation[],
  edges: Map<string, string[]>
) {
  const opByKey = new Map(operations.map((op) => [op.id, op]))
  const agentById = new Map(solution.agents.map((a) => [a.id, a]))
  const taskById = new Map(solution.tasks.map((t) => [t.id, t]))
  const opsByTask = new Map<string, InferenceOperation[]>()
  for (const op of operations) {
    const list = opsByTask.get(op.taskId) ?? []
    list.push(op)
    opsByTask.set(op.taskId, list)
  }

  const pushDep = (op: InferenceOperation, dep: InferenceOperation) => {
    if (dep.id !== op.id && !op.dependencyIds.includes(dep.id)) op.dependencyIds.push(dep.id)
  }

  // Same-task direct upstream dependencies via the workflow graph. An operation
  // depends on the operations of the agents that route directly INTO it for the
  // same task context. (Transitive hops stay implicit — Classification is an
  // upstream of Response only through Knowledge + CRM.)
  for (const op of operations) {
    for (const [from, downstream] of Array.from(edges.entries())) {
      if (!downstream.includes(op.agentId)) continue
      const agent = agentById.get(from)
      if (!agent) continue
      const counterpart = opByKey.get(`${op.taskId}::${from}::${kindForAgent(agent)}`)
      if (counterpart) pushDep(op, counterpart)
    }
  }

  // Cross-task dependencies: task X depends on task Y => every op of X waits on every op of Y.
  for (const op of operations) {
    const task = taskById.get(op.taskId)
    if (!task) continue
    for (const depTaskId of task.dependencyTaskIds) {
      for (const depOp of opsByTask.get(depTaskId) ?? []) {
        pushDep(op, depOp)
      }
    }
  }
}

// --- Token profile derivation (compiler-derived only) ------------------------
function deriveTokenProfile(op: InferenceOperation, agent: Agent): TokenProfile {
  const role = agent.modelRole.toLowerCase()
  const base: Record<InferenceOperation['kind'], [number, number]> = {
    classification: [200, 40], // short instruction + small classifier output
    reasoning: [1200, 300], // instruction + retrieved context
    generation: [1800, 500], // instruction + larger generated output
    retrieval: [500, 120], // instruction + structured extraction output
  }
  let [input, output] = base[op.kind]
  if ((role.includes('knowledge') || role.includes('reason')) && agent.toolIds.length > 0) {
    input += 800 // retrieved context (knowledge base)
  }
  if (role.includes('extract') || role.includes('final')) {
    output += 200
  }
  return {
    provenance: 'Compiler-derived',
    description: `Derived from ${op.kind} workload characteristics (${agent.modelRole.toLowerCase()}).`,
    inputTokensPerCall: input,
    outputTokensPerCall: output,
  }
}

// --- Batch opportunity analysis ----------------------------------------------
function identifyOpportunities(
  solution: Solution,
  operations: InferenceOperation[],
  executionProfiles: Record<string, ExecutionProfile>,
  tokenProfiles: Record<string, TokenProfile>
): Opportunity[] {
  const opportunities: Opportunity[] = []
  const taskById = new Map(solution.tasks.map((t) => [t.id, t]))

  for (const op of operations) {
    const task = taskById.get(op.taskId)
    const profile = executionProfiles[op.taskId]
    if (!task || !profile) continue

    if (profile.batchable && profile.batchWindowMinutes) {
      const reasons: string[] = []
      if (!task.blocksOnCompletion) reasons.push('no immediate user dependency')
      if (profile.deadline) reasons.push(`${profile.deadline} deadline`)
      if (profile.batchWindowMinutes) reasons.push(`${profile.batchWindowMinutes}-minute batch window`)
      if (profile.parallelisable) reasons.push('parallelisable')
      opportunities.push({ kind: 'batch', operationId: op.id, title: task.name, reasons })
    }

    if (profile.parallelisable && op.kind !== 'generation' && op.kind !== 'reasoning' && op.kind !== 'classification') {
      opportunities.push({
        kind: 'parallel',
        operationId: op.id,
        title: task.name,
        reasons: ['independent branch in the workflow graph', 'no ordering required between branches'],
      })
    }

    if (profile.cacheable) {
      opportunities.push({
        kind: 'cache',
        operationId: op.id,
        title: task.name,
        reasons: ['identical requests may recur within a freshness window'],
      })
    }

    if (profile.precomputable) {
      opportunities.push({
        kind: 'precompute',
        operationId: op.id,
        title: task.name,
        reasons: ['result does not depend on per-request variation'],
      })
    }
  }

  return opportunities
}

// --- Assumptions ---------------------------------------------------------------
function buildAssumptions(solution: Solution): Assumption[] {
  const assumptions: Assumption[] = []
  const classificationAgents = solution.agents.filter(
    (a) => a.modelRole.includes('classif') || a.modelRole.includes('rout')
  ).length
  const crmAgents = solution.agents.filter((a) => a.toolIds.includes('tool-crm')).length
  const finalAgents = solution.agents.filter((a) => a.modelRole.includes('final')).length

  for (const task of solution.tasks) {
    assumptions.push({
      parameter: `Requests/month (${task.name})`,
      value: String(task.expectedVolumePerMonth),
      origin: task.expectedVolumePerMonth > 0 ? 'Developer input' : 'Unknown',
    })
  }
  assumptions.push({
    parameter: 'Classification calls/request',
    value: String(classificationAgents),
    origin: 'Compiler-derived',
  })
  assumptions.push({
    parameter: 'CRM calls/request',
    value: String(crmAgents),
    origin: 'Workflow-derived',
  })
  assumptions.push({
    parameter: 'Response calls/request',
    value: String(finalAgents),
    origin: 'Workflow-derived',
  })
  assumptions.push({
    parameter: 'Token profiles',
    value: 'Derived from content/context characteristics',
    origin: 'Compiler-derived',
  })
  return assumptions
}

// --- Validation ---------------------------------------------------------------
function buildValidation(
  solution: Solution,
  operations: InferenceOperation[],
  executionProfiles: Record<string, ExecutionProfile>
): ValidationResult[] {
  const validation: ValidationResult[] = []

  validation.push({
    message: solution.agents.every((a) => a.purpose.trim().length > 0)
      ? 'All agents have a defined purpose'
      : 'Some agents are missing a defined purpose',
    severity: solution.agents.every((a) => a.purpose.trim().length > 0) ? 'ok' : 'error',
  })

  const agentIds = new Set(solution.agents.map((a) => a.id))
  const unresolved = solution.workflows.filter((w) => !agentIds.has(w.fromAgentId) || !agentIds.has(w.toAgentId))
  validation.push({
    message: unresolved.length === 0
      ? 'All workflow dependencies resolved'
      : `${unresolved.length} workflow(s) reference an unknown agent`,
    severity: unresolved.length === 0 ? 'ok' : 'error',
  })

  validation.push({
    message: solution.tasks.every((t) => executionProfiles[t.id]?.mode)
      ? 'Execution mode assigned to all tasks'
      : 'One or more tasks have no execution mode',
    severity: solution.tasks.every((t) => executionProfiles[t.id]?.mode) ? 'ok' : 'error',
  })

  validation.push({
    message: operations.some((op) => op.execution === 'batch')
      ? 'Batch candidates evaluated'
      : 'No batch candidates identified',
    severity: operations.some((op) => op.execution === 'batch') ? 'ok' : 'warning',
  })

  const crmTool = solution.tools.find((t) => t.id === 'tool-crm' || t.name === 'CRM')
  if (crmTool && !crmTool.hasFailureProfile) {
    validation.push({ message: 'CRM tool has no observed failure profile', severity: 'warning' })
  }

  if (solution.tasks.some((t) => t.expectedVolumePerMonth <= 0)) {
    validation.push({ message: 'Workload volume is an assumption', severity: 'warning' })
  }

  if (solution.agents.length === 0 || solution.tasks.length === 0) {
    validation.push({
      message: 'Solution contains no agents or tasks — nothing to compile',
      severity: 'error',
    })
  }

  return validation
}

// --- Scenario -----------------------------------------------------------------
function buildScenario(
  task: Task,
  operationIds: string[]
): WorkloadScenario {
  const volume = Math.max(task.expectedVolumePerMonth, 0)
  const counts: Record<string, number> = {}
  for (const opId of operationIds) counts[opId] = 1
  return {
    id: `scenario-${task.id}`,
    name: task.name,
    volumePerMonth: volume,
    volumeProvenance: volume > 0 ? 'Developer input' : 'Unknown',
    operationCounts: counts,
    inferenceOperationsPerWorkUnit: operationIds.length,
    totalInferenceOperationsPerMonth: operationIds.length * volume,
  }
}

// --- Main entry ---------------------------------------------------------------
export function compileWorkload(solution: Solution): CompiledWorkload {
  const executionProfiles: Record<string, ExecutionProfile> = {}
  for (const task of solution.tasks) {
    executionProfiles[task.id] = compileExecutionProfile(task)
  }

  const operations = buildInferenceOperations(solution, executionProfiles)
  const edges = workflowEdges(solution)
  resolveDependencies(solution, operations, edges)

  const agentById = new Map(solution.agents.map((a) => [a.id, a]))
  const tokenProfiles: Record<string, TokenProfile> = {}
  for (const op of operations) {
    const agent = agentById.get(op.agentId)
    if (agent) tokenProfiles[op.id] = deriveTokenProfile(op, agent)
  }

  const opportunities = identifyOpportunities(solution, operations, executionProfiles, tokenProfiles)
  const assumptions = buildAssumptions(solution)

  const sourceOpByTask = new Map<string, InferenceOperation[]>()
  for (const op of operations) {
    const list = sourceOpByTask.get(op.taskId) ?? []
    list.push(op)
    sourceOpByTask.set(op.taskId, list)
  }
  const scenarios = solution.tasks.map((task) =>
    buildScenario(task, (sourceOpByTask.get(task.id) ?? []).map((op) => op.id))
  )

  const validation = buildValidation(solution, operations, executionProfiles)

  return {
    schemaVersion: SCHEMA_VERSION,
    compilerVersion: COMPILER_VERSION,
    digest: solutionDigest(solution),
    agents: solution.agents,
    tasks: solution.tasks,
    workflows: solution.workflows,
    tools: solution.tools,
    inferenceOperations: operations,
    executionProfiles,
    scenarios,
    assumptions,
    opportunities,
    validation,
    tokenProfiles,
  }
}