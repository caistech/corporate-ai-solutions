// ============================================================================
// Agentic Workload Compiler — provider- and model-neutral data model.
//
// Core principle: the developer describes the SOLUTION (agents, tasks, tools,
// workflows). The compiler DERIVES the WORKLOAD (inference operations, execution
// profiles, token profiles, batching opportunities). The developer is never asked
// for token consumption — tokens are always a compiler-derived output.
// ============================================================================

// ---- Origin / provenance ----------------------------------------------------
// Every value the compiler emits carries a provenance so a user can always
// inspect WHY a particular result appeared. Nothing is silently invented.
export type Provenance =
  | 'Developer input' // Entered by the developer (e.g. expected business volume)
  | 'Workflow-derived' // Derived from the workflow structure
  | 'Observed' // Observed from real run data (not used in the local prototype)
  | 'Compiler-derived' // Derived deterministically from the solution definition
  | 'Default' // A sensible default applied where nothing specified it
  | 'Unknown' // The compiler could not determine this value

// ---- Execution profile ------------------------------------------------------
// Adapted from the spec §17 skeleton to the project's naming convention.
export type ExecutionMode = 'realtime' | 'async' | 'batch'

export interface ExecutionProfile {
  mode: ExecutionMode
  latencyRequirementSeconds?: number
  deadline?: string // ISO date or a human deadline like "6 hours"
  batchable: boolean
  batchWindowMinutes?: number
  parallelisable: boolean
  orderingRequired: boolean
  precomputable: boolean
  cacheable: boolean
  freshnessRequirementMinutes?: number
}

// ---- Tools ------------------------------------------------------------------
// A tool an agent may call. Tool operations are distinct from inference
// operations: they represent deterministic/external work, not model calls.
export type ToolKind =
  | 'knowledge-retrieval'
  | 'database' // e.g. CRM lookup / write
  | 'http'
  | 'code-execution'
  | 'embedding'
  | 'other'

export interface Tool {
  id: string
  name: string
  description: string
  kind: ToolKind
  /** Whether this tool has an observed failure profile. Absence is a validation warning. */
  hasFailureProfile?: boolean
}

// ---- Models -----------------------------------------------------------------
// Abstracts the inference configuration — intentionally provider- and model-
// neutral. Pricing/simulation details are out of scope for the compiler.
export interface Model {
  id: string
  name: string
  role: string // what this model is used for
}

// ---- Agents ------------------------------------------------------------------
export interface Agent {
  id: string
  name: string
  purpose: string
  modelRole: string // model requirement/role
  toolIds: string[]
  downstreamAgentIds: string[]
  taskIds: string[]
}

// ---- Tasks -------------------------------------------------------------------
// A task's "execution requirement" is captured at the business level (when does
// this result need to be available?) and compiled into an ExecutionProfile.
export type BusinessAvailability =
  | 'Immediately' // user/system is waiting
  | 'Within-seconds'
  | 'Within-minutes'
  | 'Within-an-hour'
  | 'By-defined-deadline'
  | 'No-immediate-requirement'

export interface Task {
  id: string
  name: string
  businessPurpose: string
  triggeringEvent: string
  agentIds: string[]
  toolIds: string[]
  /** Expected business volume, e.g. requests per month. Developer input. */
  expectedVolumePerMonth: number
  dependencyTaskIds: string[]
  /** Business-level availability requirement — NOT a token question. */
  availability: BusinessAvailability
  deadline?: string
  batchWindowMinutes?: number
  /** True when the user/system needs the result before continuing. */
  blocksOnCompletion: boolean
}

// ---- Workflow ----------------------------------------------------------------
// A named link in the dependency graph. References agents/tasks by id.
export interface Workflow {
  id: string
  name: string
  fromAgentId: string
  toAgentId: string
  triggeringEvent: string
}

// ---- Solution ----------------------------------------------------------------
// Everything the developer provides. This is the input to compileWorkload().
export interface Solution {
  agents: Agent[]
  tasks: Task[]
  tools: Tool[]
  models: Model[]
  workflows: Workflow[]
}

// ---- Inference operation -----------------------------------------------------
// One derived model call in the workload graph.
export type OperationKind = 'classification' | 'reasoning' | 'generation' | 'retrieval'
export type OperationExecution = 'realtime' | 'parallel' | 'batch' | 'async'

export interface InferenceOperation {
  id: string
  name: string
  kind: OperationKind
  agentId: string
  /** The task this operation belongs to. */
  taskId: string
  trigger: string // what triggers this operation
  execution: OperationExecution
  /** ids of other operations this operation depends on. */
  dependencyIds: string[]
  /** True when this operation is best modelled as a tool operation (agent has no model role). */
  isToolOperation?: boolean
}

// ---- Token profile -----------------------------------------------------------
// Compiler-derived from content/context characteristics. Never developer-entered.
export interface TokenProfile {
  provenance: Provenance
  description: string
  inputTokensPerCall: number
  outputTokensPerCall: number
}

// ---- Scenarios ---------------------------------------------------------------
// A workload scenario binds operations + volume (e.g. 10k customer requests/month).
export interface WorkloadScenario {
  id: string
  name: string
  volumePerMonth: number
  volumeProvenance: Provenance
  operationCounts: Record<string, number> // operationId -> calls per scenario volume
  inferenceOperationsPerWorkUnit: number
  totalInferenceOperationsPerMonth: number
}

// ---- Assumption --------------------------------------------------------------
export interface Assumption {
  parameter: string
  value: string
  origin: Provenance
}

// ---- Opportunities -----------------------------------------------------------
export interface Opportunity {
  kind: 'batch' | 'async' | 'parallel' | 'cache' | 'precompute'
  operationId: string
  title: string
  reasons: string[]
}

// ---- Validation --------------------------------------------------------------
export interface ValidationResult {
  message: string
  severity: 'ok' | 'warning' | 'error'
}

// ---- Compiled workload -------------------------------------------------------
export interface CompiledWorkload {
  schemaVersion: string
  compilerVersion: string
  /** Stable hash of the source solution — changes iff the solution changes. */
  digest: string
  agents: Agent[]
  tasks: Task[]
  workflows: Workflow[]
  tools: Tool[]
  inferenceOperations: InferenceOperation[]
  executionProfiles: Record<string, ExecutionProfile> // taskId -> profile
  scenarios: WorkloadScenario[]
  assumptions: Assumption[]
  opportunities: Opportunity[]
  validation: ValidationResult[]
  tokenProfiles: Record<string, TokenProfile> // operationId -> token profile
}
