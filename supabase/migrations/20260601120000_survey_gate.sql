-- Survey gate wiring.
--
-- Two fixes the survey gate needs to actually function:
--   1. The pipeline_gates.gate CHECK constraint never included 'survey', so
--      recordGate({ gate: 'survey' }) violated the constraint and threw — the
--      survey verdict could never be recorded. Re-create the check WITH 'survey'.
--   2. Only a one-line `reason` was being persisted, so the panel could only show
--      a summary. Add a `result` jsonb column to hold the full SurveyResult
--      (per-field evidence + PRE-HARD + toReach) the scorer already computes.
--
-- Idempotent: safe to run even if 'survey' or the column were added out-of-band.

ALTER TABLE pipeline_gates DROP CONSTRAINT IF EXISTS pipeline_gates_gate_check;

ALTER TABLE pipeline_gates ADD CONSTRAINT pipeline_gates_gate_check
  CHECK (gate IN (
    'office-hours',
    'ceo-review',
    'eng-review',
    'design-review',
    'gate-1',
    'gate-2',
    'naive-tester',
    'provisioned',
    'survey'
  ));

ALTER TABLE pipeline_gates ADD COLUMN IF NOT EXISTS result JSONB;
