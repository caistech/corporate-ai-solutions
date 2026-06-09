-- Agent-readiness fold-in — check #42 added to the ratified readiness catalogue.
--
-- Context: Google I/O 2026 shipped WebMCP (Chrome origin trial), Managed/Information
-- Agents (auto-browse), and native voice-to-structure. The Gate-1 rubric had NO check
-- for whether a product is discoverable / legible to AI search + browser agents — a gap
-- now that agent traffic is a real channel. Added as CONDITIONAL-WEIGHTED, scoped by a new
-- `public-web` applicability tag (N/A for pure internal tools / headless-MCP / CLI products).
--
-- Source of truth is still cais-shared-services/gate-readiness/ (workbook ->
-- extract_workbook.py -> criteria.json + readiness_seed.sql); this migration mirrors the
-- regenerated seed's row 42 into the cockpit. Additive + idempotent, same RLS posture.
--
-- Operability (key actions exposed as WebMCP tools) deliberately stays OUT of Gate 1 — it
-- re-enters at Tier-1 (post-Gate-2), like #27 settings / #30 team-admin. Cross-agent
-- integration (product-as-a-tool-in-another-agent) is BizModel §5 D3 distribution evidence,
-- not a readiness check.

-- 1. Upsert check #42 into the catalogue (matches the regenerated readiness_seed.sql).
INSERT INTO readiness_criteria
  (code, check_label, source, method, relevance, tier, weight, applies_when, notes, sort_order)
VALUES
  ('42', 'Agent-discoverable: llms.txt + schema.org/JSON-LD + /.well-known agent manifest', 'PS §11', 'AUTO', 'COND', 'CONDITIONAL-WEIGHTED', 'Med', 'public-web', 'CONDITIONAL-WEIGHTED (public-web) - agent-era discoverability after Google I/O 2026 (WebMCP + Information Agents auto-browse). Applies where a public web surface exists: llms.txt + schema.org/JSON-LD + /.well-known agent manifest so AI search/agents find + correctly describe the product. Operability (key actions as WebMCP tools) defers to Tier-1 (post-Gate-2); cross-agent integration feeds the BizModel §5 D3 distribution-leverage score.', 45)
ON CONFLICT (code) DO UPDATE SET
  check_label = EXCLUDED.check_label, source = EXCLUDED.source,
  method = EXCLUDED.method, relevance = EXCLUDED.relevance,
  tier = EXCLUDED.tier, weight = EXCLUDED.weight,
  applies_when = EXCLUDED.applies_when,
  notes = EXCLUDED.notes, sort_order = EXCLUDED.sort_order;

-- 2. Refresh the column comments to include the new `public-web` feature tag.
COMMENT ON COLUMN readiness_criteria.applies_when IS
  'Feature tag (voice|auth|supabase|third-party-content|address-or-abn-fields|email|public-web) that puts a CONDITIONAL-* check in scope. NULL = always applies. Source: gate-readiness/applicability.json.';

COMMENT ON COLUMN methodology_hypothesis_cards.features IS
  'Conditional features this product has (voice|auth|supabase|third-party-content|address-or-abn-fields|email|public-web). The scorer marks a CONDITIONAL-* check N/A when its applies_when tag is absent here.';
