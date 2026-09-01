# Agentic Workload Compiler — Functional Prototype

## Project

Existing project:

`C:\Users\denni\PycharmProjects\Corporate-AI-Solutions`

Build a new functional page within the existing application for:

`/agentic-workload-compiler`

First inspect the existing project structure, routing, UI components, styling system, and conventions. Reuse the existing design system/components rather than introducing a new framework or visual language.

Do not modify unrelated functionality.

# 0. Repository Capability Discover

Existing Component Reuse Audit — cais-shared-services

Before implementing any new compiler component, perform a repository-wide inspection of cais-shared-services to identify existing services, utilities, schemas, interfaces, harnesses, adapters, model-routing components, token/cost measurement functions, orchestration logic, or other reusable capabilities.

For every required compiler capability, classify it as:

REUSE — existing component can be used directly
ADAPT — existing component can be extended/configured with minimal change
COMPOSE — existing components can be combined to provide the capability
BUILD — no suitable existing capability exists

BUILD must require evidence that reuse/adaptation/composition was considered first.

The audit should also identify components that appear similar but should not be reused because doing so would introduce unnecessary coupling, complexity, or architectural conflict.

# 1. PURPOSE

Build a functional prototype of an **Agentic Workload Compiler**.

The page demonstrates how a developer can provide or expose the characteristics of an agentic AI solution and have the system derive a standardised workload representation.

The developer must NOT be asked to provide token consumption.

Core principle:

> The developer describes/exposes the solution and its workload drivers. The compiler derives inference workload characteristics.

The page should make this distinction extremely clear.

This is NOT yet the full production compiler.

It is a working prototype demonstrating:

1. solution definition
2. workload compilation
3. execution constraint modelling
4. derived inference workload
5. batch/async opportunities
6. simulation-ready output

---

# 2. CORE PRODUCT MESSAGE

Primary heading:

**Agentic Workload Compiler**

Subheading:

**Turn an agentic solution into a standardised workload model — without asking the developer to estimate token usage.**

Supporting explanation:

> You know what your agentic system does. We determine what inference workload that creates.

Do not position the page as a token calculator.

Tokens are a DERIVED OUTPUT.

---

# 3. PAGE FLOW

Build the page as a progressive workflow with five stages.

## Stage 1 — Solution

Allow the user to define a representative agentic solution.

Entities:

- Agents
- Tasks
- Workflows
- Tools
- Models
- Dependencies

The UI can use a sample solution by default.

Provide:

**Load Example**

The example should represent a realistic multi-agent customer service workflow.

Example:

Customer request
→ Orchestrator
→ Intent classification
→ Knowledge retrieval
→ CRM lookup
→ Specialist agent
→ Final response

The actual implementation can use local mock data/state.

No backend is required for the prototype unless an existing project service is appropriate.

---

# 4. STAGE 1 — AGENT DEFINITIONS

Show a list of agents.

Example:

### Orchestrator
Purpose:
Routes incoming customer requests.

### Knowledge Agent
Purpose:
Finds relevant information.

### CRM Agent
Purpose:
Retrieves customer/account information.

### Response Agent
Purpose:
Produces the final customer response.

Each agent should display:

- agent name
- purpose
- model role/requirement
- tools
- downstream agents
- task associations

Do not ask the user for token counts.

---

# 5. STAGE 2 — TASK DEFINITIONS

Allow tasks to be added/edited.

Each task should contain:

- name
- business purpose
- triggering event
- agents involved
- tools involved
- expected business volume
- dependency relationships
- execution requirement

The important UI question is:

### When does this result need to be available?

Options:

- Immediately — user/system is waiting
- Within seconds
- Within minutes
- Within an hour
- By a defined deadline
- No immediate requirement

Translate these into execution characteristics.

Do NOT expose this as a technical token question.

---

# 6. EXECUTION CONSTRAINTS

Every task should have an execution profile.

Properties:

- synchronous/asynchronous
- latency requirement
- deadline
- priority
- batchable
- batch window
- parallelisable
- ordering required
- precomputable
- cacheable
- freshness requirement

Not every property needs to be manually entered.

Where possible, derive them from the business-level answers.

For example:

If:

"Does the user need the result before continuing?"

= Yes

then:

execution_mode = synchronous

If:

"No"

and:

"Can this work be accumulated and processed periodically?"

= Yes

then:

execution_mode = batch_candidate

---

# 7. CRITICAL DEMONSTRATION

Include an interactive section titled:

## Why execution requirements matter

Show the same logical workload under two execution profiles.

### Scenario A — Real-time

Customer response

Latency:
`< 3 seconds`

Execution:
`Synchronous`

Batching:
`Unavailable`

### Scenario B — Deferred

Customer enrichment

Deadline:
`6 hours`

Batch window:
`30 minutes`

Execution:
`Asynchronous / Batch`

Batching:
`Available`

Display a visual explanation:

> The logical work may be identical, but the execution requirements are different. That can materially change how inference should be provisioned and therefore its economics.

This section is central to the prototype.

---

# 8. STAGE 3 — COMPILATION

Add a prominent:

**Compile Workload**

button.

When clicked, run an actual client-side compilation function against the current state.

Do not simply reveal prewritten text.

The compiler should:

1. inspect agents
2. inspect tasks
3. inspect workflow relationships
4. inspect tools
5. inspect execution constraints
6. construct an inference-operation graph
7. derive expected inference calls
8. derive token profiles from supplied content/context characteristics
9. identify batching opportunities
10. identify parallel execution opportunities
11. identify assumptions
12. produce validation warnings

The UI should show a short compilation progress state.

Example:

`Discovering solution`

`Building workload graph`

`Deriving inference operations`

`Evaluating execution constraints`

`Generating workload dataset`

Then:

**Compilation complete**

---

# 9. TOKEN HANDLING

This is a critical product requirement.

The user should NEVER be required to enter:

- input tokens
- output tokens
- average tokens
- tokens per request
- monthly token usage

Instead, tokens are compiler-derived.

Where actual prompt/content data is available locally, the prototype may estimate token counts from the content.

Where content is abstracted, derive a token profile from characteristics such as:

- instruction content
- conversation/context size
- retrieved context
- tool result size
- output requirements

Clearly label derived values as:

**Compiler-derived**

Never present them as developer-supplied facts.

---

# 10. STAGE 4 — WORKLOAD DATASET

After compilation, display the resulting standardised workload dataset.

Sections:

## Workload Summary

Display:

- Tasks
- Agents
- Inference operations
- Tool operations
- Real-time operations
- Async operations
- Batch candidates
- Parallel operations
- Warnings

## Inference Operations

Example:

| Operation | Agent | Trigger | Execution | Dependency |
|---|---|---|---|---|
| Classification | Orchestrator | Customer request | Real-time | Request |
| Knowledge reasoning | Knowledge Agent | Classification | Real-time | Classification |
| CRM retrieval | CRM Agent | Classification | Parallel | Classification |
| Response generation | Response Agent | Results | Real-time | Knowledge + CRM |

Do not make this a simplistic linear list. Represent dependencies.

---

# 11. WORKLOAD GRAPH

Create a visual workflow graph.

Example:

Customer Request
↓
Orchestrator
↓
Classification
↙        ↘
Knowledge    CRM
Agent        Agent
↘        ↙
Response Agent

Use the existing project's available graph/diagram library if one exists.

If not, implement a lightweight visual representation using existing UI primitives.

The graph must distinguish:

- inference operations
- tool operations
- dependencies
- parallel branches
- batch candidates

---

# 12. BATCH OPPORTUNITY ANALYSIS

Add a section:

## Execution Opportunities

Automatically identify operations that appear suitable for:

- batching
- asynchronous execution
- parallel execution
- caching
- precomputation

Example:

### Batch opportunity identified

`Customer enrichment`

Reason:

- no immediate user dependency
- 6-hour deadline
- 30-minute batch window
- parallelisable

Display:

**Real-time execution**

vs

**Deferred/batched execution**

The purpose is to demonstrate that workload modelling is about more than counting tokens.

---

# 13. ASSUMPTIONS

Display all assumptions separately.

Example:

| Parameter | Value | Origin |
|---|---:|---|
| Requests/month | 10,000 | Developer input |
| Classification calls/request | 1 | Compiler-derived |
| CRM calls/request | 1 | Workflow-derived |
| Response calls/request | 1 | Workflow-derived |
| Token profile | Derived | Compiler-derived |

Every value should have provenance.

Use these categories:

- Developer input
- Observed
- Compiler-derived
- Default
- Unknown

Do not silently invent values.

---

# 14. VALIDATION

Display compiler validation results.

Example:

### Validation

✓ All agents have a defined purpose

✓ All workflow dependencies resolved

✓ Execution mode assigned

✓ Batch candidates evaluated

⚠ CRM tool has no observed failure profile

⚠ Workload volume is an assumption

Errors should prevent compilation only when the workload cannot be meaningfully represented.

Warnings should allow compilation.

---

# 15. STAGE 5 — SIMULATION READY

End with:

## Ready for inference simulation

Explain:

> The compiled workload is provider- and model-neutral. It can now be run against different inference configurations to estimate workload, performance and cost.

Show example targets:

- Model A
- Model B
- Model C
- Model combination
- Real-time strategy
- Batch strategy

Do not implement provider pricing yet unless existing project functionality already supports it.

This page is demonstrating the compiler boundary, not the complete cost engine.

---

# 16. DATA MODEL

Create TypeScript types/interfaces for the prototype.

At minimum:

```ts
Agent
Task
Workflow
Tool
ExecutionProfile
InferenceOperation
WorkloadScenario
Assumption
ValidationResult
CompiledWorkload
```

A compiled workload should contain:

```ts
{
  schemaVersion,
  compilerVersion,
  agents,
  tasks,
  workflows,
  tools,
  inferenceOperations,
  executionProfiles,
  scenarios,
  assumptions,
  opportunities,
  validation
}
```

Keep this schema provider-neutral.

---

# 17. EXECUTION PROFILE MODEL

Use a structure equivalent to:

```ts
{
  mode: "realtime" | "async" | "batch",
  latencyRequirement?: number,
  deadline?: string,
  batchable: boolean,
  batchWindow?: number,
  parallelisable: boolean,
  orderingRequired: boolean,
  precomputable: boolean,
  cacheable: boolean,
  freshnessRequirement?: number
}
```

Adapt naming to existing project conventions.

---

# 18. COMPILER LOGIC

Create a separate compiler module rather than putting compilation logic inside React components.

Conceptually:

```ts
compileWorkload(solution): CompiledWorkload
```

It should:

- traverse workflow relationships
- generate inference operations
- resolve dependencies
- classify execution modes
- calculate derived operation counts
- identify parallel branches
- identify batch opportunities
- generate assumptions
- validate the workload

This should be deterministic for identical inputs.

---

# 19. SAMPLE CALCULATION

Use an example scenario such as:

10,000 customer requests/month.

Each request:

1 orchestrator inference
1 classification inference
1 knowledge inference
1 CRM tool operation
1 response inference

Therefore the compiler derives:

4 inference operations/request

and:

40,000 inference operations/month

The page should make clear that this was derived from the workflow, not entered by the developer.

Token estimates should similarly be shown as compiler-derived.

---

# 20. UX REQUIREMENTS

The page should feel like a serious technical product, not a marketing landing page.

Prioritise:

- clarity
- inspectability
- provenance
- workflow visibility
- useful information density
- functional interactions

Avoid:

- excessive startup jargon
- "AI magic"
- decorative animations
- meaningless dashboard metrics
- asking for information the compiler should derive

The user should be able to inspect exactly why the compiler produced a particular result.

---

# 21. PRIVACY / LOCAL COMPILATION MESSAGE

Include a concise panel:

### Your solution stays yours

The compiler is designed so proprietary implementation details can be analysed locally and transformed into a standardised workload representation.

The downstream workload dataset contains the information required for simulation without requiring disclosure of the developer's proprietary solution.

Do not imply that the current prototype provides production-grade privacy/security guarantees. Label this as the intended architecture.

---

# 22. IMPORTANT PRODUCT PRINCIPLE

Make this visible somewhere on the page:

> **Developers provide the solution. The compiler determines the workload.**

And:

> **Token consumption is an output of the compilation and simulation process — not an input the developer is expected to know.**

This distinction is fundamental.

---

# 23. ACCEPTANCE TESTS

The page is complete when:

1. A sample agentic solution can be loaded.
2. Agents/tasks/workflows can be inspected.
3. A task can be given a business-level execution requirement.
4. The system converts that into execution characteristics.
5. Compilation performs actual deterministic processing.
6. Inference operations are generated from workflow structure.
7. Dependencies are represented.
8. Parallel branches are identified.
9. Batch candidates are identified.
10. Token profiles are compiler-derived rather than developer-entered.
11. Assumptions have provenance.
12. Validation results are shown.
13. A compiled workload dataset can be viewed as structured JSON.
14. The page clearly separates developer inputs from compiler-derived outputs.
15. The page can demonstrate why a 3-second response requirement is economically different from a 6-hour batch deadline.
16. Existing project functionality is not broken.

---

# 24. DO NOT BUILD YET

Do NOT yet implement:

- production provider integrations
- OmniRoute integration
- SAIL Research integration
- real provider pricing
- GPU provisioning
- production authentication
- customer accounts
- billing
- external data transmission
- production compiler packaging

Those will come after the compiler schema and workflow have been validated.

The immediate objective is to create a **functional, inspectable prototype of the compiler boundary**.