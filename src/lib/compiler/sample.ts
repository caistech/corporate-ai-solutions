import {
  Agent,
  Model,
  Solution,
  Task,
  Tool,
  Workflow,
} from './types'

// ============================================================================
// Sample solution — a realistic multi-agent customer service workflow.
//
// Customer request
//   → Orchestrator
//   → Intent classification
//   → Knowledge retrieval
//   → CRM lookup
//   → Specialist agent
//   → Final response
//
// The developer describes the SOLUTION; the compiler derives the WORKLOAD.
// No token counts are entered here.
// ============================================================================

const models: Model[] = [
  { id: 'm-orchestrator', name: 'Model A', role: 'Routing and intent classification' },
  { id: 'm-knowledge', name: 'Model B', role: 'Knowledge-grounded reasoning' },
  { id: 'm-crm', name: 'Model C', role: 'Structured data extraction / tool orchestration' },
  { id: 'm-response', name: 'Model D', role: 'Final customer-facing generation' },
]

const tools: Tool[] = [
  {
    id: 'tool-kb',
    name: 'Knowledge Base',
    description: 'Retrieves relevant product/support documentation for a query.',
    kind: 'knowledge-retrieval',
  },
  {
    id: 'tool-crm',
    name: 'CRM',
    description: 'Looks up customer, account and order information.',
    kind: 'database',
  },
  {
    id: 'tool-tickets',
    name: 'Ticketing',
    description: 'Creates or updates support tickets.',
    kind: 'database',
  },
  {
    id: 'tool-webhook',
    name: 'Webhook',
    description: 'Posts enrichment events downstream.',
    kind: 'http',
  },
]

const agents: Agent[] = [
  {
    id: 'agent-orchestrator',
    name: 'Orchestrator',
    purpose: 'Routes incoming customer requests.',
    modelRole: 'Intent classification and routing',
    toolIds: [],
    downstreamAgentIds: ['agent-knowledge', 'agent-crm'],
    taskIds: ['task-respond'],
  },
  {
    id: 'agent-knowledge',
    name: 'Knowledge Agent',
    purpose: 'Finds relevant information.',
    modelRole: 'Knowledge-grounded reasoning',
    toolIds: ['tool-kb'],
    downstreamAgentIds: ['agent-response'],
    taskIds: ['task-respond', 'task-enrich'],
  },
  {
    id: 'agent-crm',
    name: 'CRM Agent',
    purpose: 'Retrieves customer/account information.',
    modelRole: 'Structured data extraction / tool orchestration',
    toolIds: ['tool-crm', 'tool-tickets'],
    downstreamAgentIds: ['agent-response'],
    taskIds: ['task-respond', 'task-enrich'],
  },
  {
    id: 'agent-response',
    name: 'Response Agent',
    purpose: 'Produces the final customer response.',
    modelRole: 'Final customer-facing generation',
    toolIds: [],
    downstreamAgentIds: [],
    taskIds: ['task-respond'],
  },
]

const tasks: Task[] = [
  {
    id: 'task-respond',
    name: 'Customer response',
    businessPurpose: 'Answer an incoming customer request end-to-end.',
    triggeringEvent: 'Customer submits a request',
    agentIds: ['agent-orchestrator', 'agent-knowledge', 'agent-crm', 'agent-response'],
    toolIds: ['tool-kb', 'tool-crm', 'tool-tickets'],
    expectedVolumePerMonth: 10000,
    dependencyTaskIds: [],
    availability: 'Immediately',
    blocksOnCompletion: true,
  },
  {
    id: 'task-enrich',
    name: 'Customer enrichment',
    businessPurpose: 'Enrich customer records with profile/behavioural data for later use.',
    triggeringEvent: 'Customer request completes',
    agentIds: ['agent-knowledge', 'agent-crm'],
    toolIds: ['tool-crm', 'tool-webhook'],
    expectedVolumePerMonth: 10000,
    dependencyTaskIds: ['task-respond'],
    availability: 'By-defined-deadline',
    deadline: '6 hours after request completion',
    batchWindowMinutes: 30,
    blocksOnCompletion: false,
  },
]

const workflows: Workflow[] = [
  {
    id: 'wf-route',
    name: 'Route request',
    fromAgentId: 'agent-orchestrator',
    toAgentId: 'agent-knowledge',
    triggeringEvent: 'Customer request',
  },
  {
    id: 'wf-lookup',
    name: 'Lookup CRM',
    fromAgentId: 'agent-orchestrator',
    toAgentId: 'agent-crm',
    triggeringEvent: 'Customer request',
  },
  {
    id: 'wf-respond',
    name: 'Compose response',
    fromAgentId: 'agent-knowledge',
    toAgentId: 'agent-response',
    triggeringEvent: 'Knowledge + CRM results',
  },
  {
    id: 'wf-respond-crm',
    name: 'Compose response (CRM)',
    fromAgentId: 'agent-crm',
    toAgentId: 'agent-response',
    triggeringEvent: 'Knowledge + CRM results',
  },
]

export const SAMPLE_SOLUTION: Solution = {
  agents,
  tasks,
  tools,
  models,
  workflows,
}

// A deep copy helper so the UI can mutate state without touching the sample.
export function cloneSolution(solution: Solution): Solution {
  return JSON.parse(JSON.stringify(solution)) as Solution
}
