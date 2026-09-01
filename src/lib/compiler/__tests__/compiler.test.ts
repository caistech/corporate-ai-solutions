import { describe, expect, it } from 'vitest'
import { compileWorkload, SCHEMA_VERSION, COMPILER_VERSION } from '../compiler'
import { SAMPLE_SOLUTION, cloneSolution } from '../sample'

describe('compileWorkload', () => {
  it('produces a workload from the sample solution', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)

    expect(result.agents).toHaveLength(4)
    expect(result.tasks).toHaveLength(2)
    expect(result.inferenceOperations.length).toBeGreaterThan(0)
    expect(result.scenarios).toHaveLength(2)
  })

  it('is deterministic for identical inputs', () => {
    const a = compileWorkload(SAMPLE_SOLUTION)
    const b = compileWorkload(cloneSolution(SAMPLE_SOLUTION))
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b))
  })

  it('derives 4 inference operations per customer-response work unit', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)
    const respond = result.scenarios.find((s) => s.name === 'Customer response')
    expect(respond).toBeDefined()
    expect(respond!.inferenceOperationsPerWorkUnit).toBe(4)
    expect(respond!.totalInferenceOperationsPerMonth).toBe(40000)
  })

  it('does not require the developer to supply token counts', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)
    for (const profile of Object.values(result.tokenProfiles)) {
      expect(profile.provenance).toBe('Compiler-derived')
    }
  })

  it('represents dependencies between operations (Response waits on Knowledge + CRM)', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)
    const response = result.inferenceOperations.find((op) => op.name.includes('Response Agent'))
    expect(response).toBeDefined()
    expect(response!.dependencyIds).toHaveLength(2)
  })

  it('identifies the deferred enrichment task as a batch candidate', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)
    const batch = result.opportunities.find((op) => op.kind === 'batch')
    expect(batch).toBeDefined()
    expect(batch!.title).toBe('Customer enrichment')
  })

  it('emits validation results including a warning for the CRM failure profile', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)
    expect(result.validation.length).toBeGreaterThan(0)
    expect(result.validation.some((v) => v.message.includes('CRM'))).toBeTruthy()
  })

  it('carries schema + compiler versions', () => {
    const result = compileWorkload(SAMPLE_SOLUTION)
    expect(result.schemaVersion).toBe(SCHEMA_VERSION)
    expect(result.compilerVersion).toBe(COMPILER_VERSION)
  })
})