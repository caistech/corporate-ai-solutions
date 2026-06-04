-- 20260604130000_drop_readiness_results_blocks_gate.sql
--
-- Drop the dead `blocks_gate` column from readiness_results.
--
-- score.ts derives the HARD gate purely from readiness_criteria.tier (isHardTier on
-- 'HARD' | 'CONDITIONAL-HARD'); it never reads readiness_results.blocks_gate. The column
-- always defaulted to false, upsertReadinessResult never wrote it, and nothing consumed it
-- — a column named like it gates but read by nothing is a trap. Single source of truth for
-- gating is the criteria tier.
--
-- Idempotent: IF EXISTS makes a re-apply a no-op.

alter table public.readiness_results drop column if exists blocks_gate;
