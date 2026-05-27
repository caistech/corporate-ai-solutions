import { describe, it, expect } from 'vitest'
import {
  buildJudgePrompt,
  parseJudgedDimensions,
  judgedToDimensionInputs,
  suggestedActionFor,
  proposeDecision,
  type EvidenceProposalInput,
  type HypothesisProposalInput,
  type StreamEvidence,
} from '../decision-proposer'

const distStream: StreamEvidence = {
  campaign_type: 'distributor-candidate',
  interview_count: 4,
  signal_counts: { confirms: 3, contradicts: 1, refines: 0 },
  summaries: ['Academy owner would resell to her 120 students.', 'Coach wants a white-label option.'],
}
const euStream: StreamEvidence = {
  campaign_type: 'target-user',
  interview_count: 5,
  signal_counts: { confirms: 4, contradicts: 0, refines: 1 },
  summaries: ['Student practises daily and hates the lack of feedback.'],
}

const evidenceInput = (over: Partial<EvidenceProposalInput> = {}): EvidenceProposalInput => ({
  mode: 'evidence',
  product_slug: 'singify',
  what_it_is: 'Karaoke + vocal polish + a coach that knows your voice',
  distributor: distStream,
  endUser: euStream,
  buildFit: { score: 8, rationale: 'sits on the voice engine' },
  ...over,
})

const hypothesisInput = (over: Partial<HypothesisProposalInput> = {}): HypothesisProposalInput => ({
  mode: 'hypothesis',
  product_slug: 'singify',
  what_it_is: 'Karaoke + vocal polish + a coach',
  desk_notes: 'Singing teachers exist as a reachable pool; students want feedback.',
  ...over,
})

// A judge that returns whatever JSON we hand it — orchestration becomes deterministic.
const judgeReturning = (json: string) => ({ judge: async () => json })

const fourDims = (scores: { pain: number; gap: number; onsell: number; reach: number }) =>
  JSON.stringify({
    pain: { score: scores.pain, confidence: 'high', rationale: 'r' },
    gap: { score: scores.gap, confidence: 'medium', rationale: 'r' },
    onsell: { score: scores.onsell, confidence: 'high', rationale: 'r' },
    reach: { score: scores.reach, confidence: 'medium', rationale: 'r' },
  })

describe('buildJudgePrompt', () => {
  it('evidence mode embeds both streams and asks for the four interview dimensions only', () => {
    const p = buildJudgePrompt(evidenceInput())
    expect(p).toContain('DISTRIBUTOR STREAM')
    expect(p).toContain('END-USER STREAM')
    expect(p).toContain('would resell to her 120 students')
    expect(p).toContain('"pain"')
    expect(p).toContain('"onsell"')
    expect(p).toContain('build_fit is supplied separately')
    // build_fit is NOT in the requested schema in evidence mode
    expect(p).not.toContain('"build_fit": {')
  })

  it('hypothesis mode embeds desk notes and asks for all five dimensions', () => {
    const p = buildJudgePrompt(hypothesisInput())
    expect(p).toContain('DESK RESEARCH')
    expect(p).toContain('Singing teachers exist')
    expect(p).toContain('Score ALL five dimensions')
    expect(p).toContain('"build_fit": {')
  })
})

describe('parseJudgedDimensions', () => {
  it('parses well-formed JSON, clamps scores and defaults confidence', () => {
    const raw = `noise before {"pain":{"score":15,"confidence":"bogus","rationale":"x"},"gap":{"score":-2,"confidence":"low","rationale":"y"},"onsell":{"score":7,"confidence":"high","rationale":"z"},"reach":{"score":6,"confidence":"medium","rationale":"w"}} trailing`
    const j = parseJudgedDimensions(raw, 'evidence')!
    expect(j.pain!.score).toBe(10) // clamped from 15
    expect(j.pain!.confidence).toBe('low') // bogus → low
    expect(j.gap!.score).toBe(0) // clamped from -2
    expect(j.onsell!.score).toBe(7)
  })

  it('returns null on non-JSON or zero usable dimensions', () => {
    expect(parseJudgedDimensions('not json at all', 'evidence')).toBeNull()
    expect(parseJudgedDimensions('{"unrelated":1}', 'evidence')).toBeNull()
  })

  it('evidence mode ignores a build_fit the judge was not asked for', () => {
    const raw = fourDims({ pain: 8, gap: 7, onsell: 6, reach: 5 }).replace(
      '}',
      ',"build_fit":{"score":9,"confidence":"high","rationale":"nope"}}'
    )
    const j = parseJudgedDimensions(raw, 'evidence')!
    expect(j.build_fit).toBeUndefined()
  })
})

describe('judgedToDimensionInputs', () => {
  it('maps judged dims and injects the carried build_fit in evidence mode', () => {
    const j = parseJudgedDimensions(fourDims({ pain: 8, gap: 7, onsell: 6, reach: 5 }), 'evidence')!
    const inputs = judgedToDimensionInputs(j, { build_fit: { score: 9, rationale: 'substrate' } })
    const byKey = Object.fromEntries(inputs.map((i) => [i.key, i]))
    expect(byKey.build_fit.score).toBe(9)
    expect(byKey.pain.score).toBe(8)
    expect(inputs).toHaveLength(5)
  })

  it('omits a dimension that is neither judged nor carried (scorer then counts it 0)', () => {
    const j = parseJudgedDimensions(
      JSON.stringify({ pain: { score: 8, confidence: 'high', rationale: 'r' } }),
      'hypothesis'
    )!
    const inputs = judgedToDimensionInputs(j)
    expect(inputs.map((i) => i.key)).toEqual(['pain'])
  })
})

describe('suggestedActionFor', () => {
  it('maps Gate-0 (hypothesis) bands to triage actions', () => {
    expect(suggestedActionFor('hypothesis', 'GO').action).toBe('move-to-research')
    expect(suggestedActionFor('hypothesis', 'REDESIGN').action).toBe('redesign-to-fit')
    expect(suggestedActionFor('hypothesis', 'NO-GO').action).toBe('kill')
  })
  it('maps Gate-2 (evidence) bands to decision actions', () => {
    expect(suggestedActionFor('evidence', 'GO').action).toBe('go-full-build')
    expect(suggestedActionFor('evidence', 'NO-GO').action).toBe('no-go')
  })
})

describe('proposeDecision (orchestration with an injected judge)', () => {
  it('evidence mode: strong streams + carried build_fit → GO / go-full-build, always requiresConfirm', async () => {
    const deps = judgeReturning(fourDims({ pain: 9, gap: 8, onsell: 8, reach: 8 }))
    const proposal = await proposeDecision(evidenceInput(), deps)
    expect(proposal.mode).toBe('evidence')
    expect(proposal.score.band).toBe('GO')
    expect(proposal.suggested.action).toBe('go-full-build')
    expect(proposal.requiresConfirm).toBe(true)
    expect(proposal.judged.onsell!.score).toBe(8)
  })

  it('onsell below the hard gate forces NO-GO even with a strong composite', async () => {
    const deps = judgeReturning(fourDims({ pain: 10, gap: 10, onsell: 2, reach: 10 }))
    const proposal = await proposeDecision(evidenceInput(), deps)
    expect(proposal.score.gate.passed).toBe(false)
    expect(proposal.score.band).toBe('NO-GO')
    expect(proposal.suggested.action).toBe('no-go')
  })

  it('the personal-interest override clears the onsell gate and is recorded', async () => {
    const deps = judgeReturning(fourDims({ pain: 9, gap: 8, onsell: 2, reach: 8 }))
    const proposal = await proposeDecision(
      evidenceInput({ personalInterestOverride: { reason: 'strategic voice-engine bet' } }),
      deps
    )
    expect(proposal.score.gate.overridden).toBe(true)
    expect(proposal.score.band).not.toBe('NO-GO') // gate cleared → band follows the composite
  })

  it('hypothesis mode proposes a Gate-0 triage action from desk research', async () => {
    const deps = judgeReturning(
      JSON.stringify({
        pain: { score: 8, confidence: 'medium', rationale: 'r' },
        gap: { score: 7, confidence: 'low', rationale: 'r' },
        onsell: { score: 7, confidence: 'medium', rationale: 'r' },
        reach: { score: 7, confidence: 'low', rationale: 'r' },
        build_fit: { score: 8, confidence: 'high', rationale: 'r' },
      })
    )
    const proposal = await proposeDecision(hypothesisInput(), deps)
    expect(proposal.suggested.gate).toBe('gate-0')
    expect(['move-to-research', 'redesign-to-fit', 'kill']).toContain(proposal.suggested.action)
  })

  it('throws when the judge returns unparseable output', async () => {
    await expect(proposeDecision(evidenceInput(), judgeReturning('no json'))).rejects.toThrow(/Failed to parse/)
  })

  it('retries a transient judge failure, then succeeds (a hiccup must not fail the proposal)', async () => {
    let calls = 0
    const flaky = {
      judge: async () => {
        calls++
        if (calls === 1) throw new Error('fetch failed: ECONNRESET')
        return fourDims({ pain: 9, gap: 8, onsell: 8, reach: 8 })
      },
    }
    const proposal = await proposeDecision(evidenceInput(), flaky)
    expect(calls).toBe(2) // first attempt threw, second succeeded
    expect(proposal.score.band).toBe('GO')
  })

  it('retries an unparseable judge generation, then succeeds', async () => {
    let calls = 0
    const flaky = {
      judge: async () => {
        calls++
        return calls === 1 ? 'no json here' : fourDims({ pain: 9, gap: 8, onsell: 8, reach: 8 })
      },
    }
    const proposal = await proposeDecision(evidenceInput(), flaky)
    expect(calls).toBe(2)
    expect(proposal.score.band).toBe('GO')
  })
})
