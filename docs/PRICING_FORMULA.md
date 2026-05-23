# Pricing Formula — Hosted Tier

**Status:** v1.0 drafted 2026-05-23.
**Scope:** how to price the paid hosted tier of any portfolio product that ships one. BYOK products are free by construction and need no formula.
**Anchored to:** MONETISATION_RULES.md Rules 12 (no uncovered cost exposure), 13 (single-tenant choice), 14 (hard-cut cap) and the global TEAM ADMIN rule.

---

## Philosophy

**We are never exposed to costs that are not pre-covered.** Every dollar of vendor cost, infrastructure cost, and operational cost CAS incurs on behalf of a customer must already be covered by money in hand — prepaid credits, paid-in-advance subscription, or escrow — BEFORE the cost is incurred. The formula below operationalises this principle; the hard-cut cap from Rule 14 enforces it at the call site; the prepaid Stripe model from Rule 12 enforces it at billing time.

Two paths, no in-between:

- **BYOK (free, self-host)** — every metered call lands on the customer's vendor account. Zero CAS cost exposure. No formula needed.
- **Full-service hosted** — CAS provides keys + infra + management. Every dollar of cost must be pre-covered by the formula below.

There is no "BYOK with management" middle tier (decision locked 2026-05-23). Customers pick all-or-nothing on operational responsibility.

**Two pricing models within the hosted tier, depending on product shape (Rule 15):**

- **Distributor-clip model (default for distributor-shaped products)** — CAS charges the distributor a small per-active-end-user clip ($10–20/mo). The distributor sets their own price to end-users and keeps the margin. CAS is infrastructure, not service provider. Per Rule 15 most portfolio products are this shape.
- **Plan-with-cap model (direct-to-end-user products only)** — CAS charges the end-user a tiered monthly plan ($49 / $99 / $149 / $199 / $299 / custom-quote) with usage cap per Rule 14. Used only for personal-interest-override products that target end-users directly (e.g. Kira, StoryVerse), where there is no distributor in the chain.

Both models satisfy Rules 12–14. The distinction is *who pays CAS* — the distributor (for distributor products) or the end-user (for personal-interest-override products).

---

## Model A — Distributor-clip (default for distributor-shaped products per Rule 15)

```
monthly_charge_to_distributor = active_end_users_this_month × clip_per_end_user
```

Where:

- `active_end_users_this_month` = end-users with ≥1 metered action in the billing period under the distributor's account.
- `clip_per_end_user` = **$10–20/mo** depending on product cost-base. Calibrated so the distributor's vendor + infra + support costs are covered with margin, but kept low enough that the distributor can comfortably mark up 3–10× to their end-user.

The distributor sees: *"You have 120 active end-users this month. Your bill is $1,800."* They sell each end-user a $50/mo seat (their pricing decision) and pocket $6,000 — $1,800 to CAS = $4,200 distributor margin.

**How to pick the clip rate (per product):**

```
clip_per_end_user = ( vendor_cost_per_end_user_per_month
                    + infra_amortised_per_end_user_per_month
                    + support_amortised_per_end_user_per_month
                    ) × (1 + margin)
```

Then round to $10, $15, or $20. Light products (data tools, simple workflows) → $10. Mid products (moderate LLM, some integrations) → $15. Heavy products (voice-heavy, LLM-heavy) → $20. Anything that prices above $20/end-user/mo should consider whether the distributor model fits or whether it should be plan-with-cap.

**Caps still apply per Rule 14** — but the cap is at the distributor account level, not per end-user. A distributor's plan covers up to N total end-user-units of metered usage per month; overage = top-up or upgrade. The distributor's account = the billing relationship that Rule 14's hard-cut protects.

---

## Model B — Plan-with-cap (personal-interest-override products only)

For direct-to-end-user products where there is no distributor in the chain (e.g. Kira, StoryVerse) — used only when Rule 15's personal-interest-override is invoked.

```
monthly_price = ( infra_fixed
               + Σ ( usage_per_user_per_month × vendor_unit_cost )  for every service the product touches
               + support_amortisation_per_customer
               ) × (1 + margin)
```

Then **round UP** to the nearest clean tier:

```
$49  $99  $149  $199  $299  custom-quote
```

Always up. Protects against demand volatility and avoids re-pricing conversations.

---

## The four cost components

### 1. `infra_fixed` — driven by tenancy

Tenancy is a customer-selectable option at checkout per Rule 13. Two values:

| Tenancy mode | `infra_fixed` | When applies |
|---|---|---|
| **Shared (multi-tenant)** | **~$0/mo marginal** | Default for STANDARD + REVENUE-tier products. Same Vercel + Supabase as other customers; RLS-isolated. Pro tier already paid; one more tenant adds rows, not infra. |
| **Dedicated (single-tenant)** | **~$50/mo baseline** | Customer's own Vercel project + Supabase project. Required for REGULATED-tier products (no shared option offered). Available as customer choice on STANDARD + REVENUE when the customer's compliance regime requires it (rationale field captured at checkout). |

The `$50/mo` dedicated baseline decomposes roughly as: Supabase Pro $25 + Vercel Pro share ~$15 + monitoring / back-office overhead ~$10. Re-validate quarterly.

### 2. `Σ usage × unit cost` — vendor mix per product

The product-specific component. Each product declares which services it touches, and for each, the per-user expected monthly usage. Reference rates as of 2026-05:

| Service | Unit | 2026-05 unit cost | What drives per-user usage |
|---|---|---|---|
| Anthropic — Claude Sonnet | 1M input / 1M output tokens | ~$3 / ~$15 | drafting + reasoning calls per session × tokens per call × sessions per month |
| Anthropic — Claude Haiku | 1M input / 1M output tokens | ~$0.80 / ~$4 | classification + light-weight calls per session |
| OpenAI — text-embedding-3-small | 1M tokens | ~$0.02 | KB ingestion + retrieval volume — usually <$1/customer/mo |
| OpenAI — GPT-4o | 1M input / 1M output tokens | ~$2.50 / ~$10 | when used as alt LLM |
| OpenRouter | per-model passthrough + ~5% markup | varies | when used as LLM provider |
| ElevenLabs — voice | minute of audio | ~$0.30 (Creator tier blended) | voice-session minutes per user × sessions per month |
| Resend — email | per email | $0.0001 above free 3k/mo | transactional + magic-link volume |
| Mapbox — geocoding | per request | ~$0.005 | map-using products only |
| Brave Search | per query | ~$0.005 | search-using products only |
| Hunter — email lookup | per request | ~$0.05 | outreach/enrichment products only |
| Supabase — egress / storage | GB | included to 5GB; then $0.09/GB | usually negligible per customer |
| Stripe — payment processing | per transaction | 2.9% + $0.30 | once per billing cycle + per top-up |

Rates drift; re-validate before any pricing change.

### 3. `support_amortisation_per_customer`

Default: **$100/mo per customer** (~30 minutes of operator time × $200/hr blended).

Higher for early customers (more bugs surface, more setup hand-holding). Lower as the product hardens and the support burden moves to docs + automated runbooks. Override the default if the product has known support intensity above or below the norm — e.g. a regulated product with quarterly compliance check-ins runs higher.

### 4. `margin`

Default: **45%** on top of total cost.

Margin covers:

- Stripe fees (~3% per transaction)
- Failed charges + refund churn (~5% blended)
- **Cap-lag absorption** (the small window between "customer hits 100% cap" and "customer actually tops up or upgrades" — Rule 12 protection)
- Product reinvestment + reserve

Don't drop below 40%. The first incident or vendor price-rise wipes a thin margin.

---

## Tenancy rule (locked)

| Risk tier | Shared offered? | Dedicated offered? | Default |
|---|---|---|---|
| REGULATED | No | Yes | Dedicated (no choice) |
| REVENUE / case-study | Yes | Yes | Shared |
| STANDARD | Yes | Yes | Shared |

REGULATED tier per global CLAUDE.md: mmcbuild, F2K-Checkpoint, F2K-Fund-Tokenisation, platform-trust, ndissda-automate, r-and-d-tax, disaster-support.

Rationale field captured at checkout when customer picks dedicated and the product offered both. Stored on `hosting_subscriptions.tenancy_rationale`.

---

## Cap enforcement (the implementation layer of Rule 12)

The formula gives you a monthly price; the cap gives you the corresponding usage ceiling. Both numbers ship together — a plan price without a hard cap violates Rule 12.

For each meter the product declares:

```
cap_at_plan_price = (plan_price / (1 + margin) - infra_fixed - support_amortisation) / vendor_unit_cost
```

Round DOWN to a clean number (e.g. 50k tokens / 100 voice minutes / 500 documents). Document the cap in the customer-facing pricing copy:

> $99/mo includes up to 50,000 LLM tokens, 100 voice minutes, and 5 active team members. Top up credits or upgrade if you need more.

When the customer hits 80% they get a banner + email. When they hit 100% the metered feature disables. Login + settings + reading + exporting remain available. Top-up clears the block in real time per Rule 14.

The cap-enforcement layer becomes `@caistech/usage-meters` (placeholder name) on the second hosted product that needs it — extract then, not before. First hosted product builds inline using the canonical shape so extraction is mechanical.

---

## Tier breakpoint policy

Round UP to the nearest:

- **$49** — light products: data tools, simple workflows, minimal LLM usage
- **$99** — typical SaaS: moderate LLM, some integrations, multi-tenant
- **$149** — heavier products: significant LLM-Sonnet usage, or voice add-on, or moderate integrations
- **$199** — voice-heavy or LLM-heavy combined; or dedicated tenancy add-on with light product
- **$299** — dedicated tenancy + heavy usage; or REGULATED-tier with single-tenant
- **custom-quote** — enterprise, multi-org, white-label, or anything above $299/mo

If the formula output sits awkwardly between tiers (e.g. $107), round up to $149 — not $99. Better to be slightly above expected average and protected, than slightly below and exposed.

---

## Worksheet template

Per-product worksheet, filled during the GO/NO-GO review or just before publishing a hosted tier:

```markdown
# Pricing worksheet — <product slug>

## Inputs

| Field | Value |
|---|---|
| Product slug | <slug> |
| Risk tier | STANDARD / REVENUE / REGULATED |
| Tenancy modes offered | shared / dedicated / both |
| Default tenancy | shared / dedicated |
| Vendor mix | LLM (Sonnet|Haiku|OpenRouter), embeddings (yes/no), voice (yes/no), email, maps, search, enrichment, other |

## Per-user expected usage (mid-band — for power users and casual blend)

| Service | Per-session unit | Sessions/user/mo | Monthly unit total | Monthly cost |
|---|---|---|---|---|
| Anthropic Sonnet (input) | 3k tokens | 50 | 150k tokens | $0.45 |
| Anthropic Sonnet (output) | 800 tokens | 50 | 40k tokens | $0.60 |
| OpenAI embeddings | 500 tokens | 50 | 25k tokens | $0.0005 |
| ElevenLabs voice | 0 min | 0 | 0 | $0.00 |
| Resend email | 5 emails | 1 | 5 emails | $0.00 (free tier) |
| ... | | | | |
| **Vendor subtotal** | | | | **$X.XX/user/mo** |

## Team-size assumption

Assume a mid-band team of N users per organisation. The plan price covers N seats; per-seat usage rolls up to org-level cap.

## Per-org monthly cost (Σ users × per-user vendor) + fixed

| Component | Value |
|---|---|
| Vendor subtotal × N users | $X.XX |
| infra_fixed (shared) | $0 |
| infra_fixed (dedicated) | $50 |
| support_amortisation | $100 |
| **Cost subtotal (shared)** | **$X.XX** |
| **Cost subtotal (dedicated)** | **$X.XX + 50** |
| × margin (1.45) | |
| **Formula output (shared)** | **$X.XX** |
| **Formula output (dedicated)** | **$X.XX** |
| **Rounded tier (shared)** | **$49 / $99 / $149 / $199 / $299** |
| **Rounded tier (dedicated)** | **$49 / $99 / $149 / $199 / $299** |

## Caps at the rounded tier price

Per-meter cap calculation:

| Meter | Cap at tier price | Top-up unit | Top-up price |
|---|---|---|---|
| LLM tokens (combined input + output) | 200k tokens / mo | 50k tokens | $10 |
| Voice minutes | 100 min / mo | 30 min | $10 |
| Documents generated | 500 / mo | 100 | $10 |
| Team seats | 5 seats | +1 seat | $20 / mo |

Cap copy for customer pricing page:

> $XX/mo includes up to <token cap>, <voice cap>, <doc cap>, and <seat cap>. Top up credits or upgrade if you need more.

## Sign-off

- [ ] Worksheet outputs rounded UP per the breakpoint policy.
- [ ] Caps documented and matched against the formula output.
- [ ] Tenancy options + prices presented at checkout per Rule 13.
- [ ] Cap-enforcement layer wired per Rule 14 (shape canonical for future `@caistech/usage-meters` extraction).
- [ ] Stripe wired prepaid per Rule 12 (no metered billing).
```

---

## Examples (illustrative — not committed)

Worked through the formula for reference. These are not the actual final prices; the per-product worksheets in the candidate review will produce the real numbers.

### Example A — Light data tool (e.g. a workflow product with no LLM, no voice)

- Vendor mix: Resend (light), Supabase (light). No LLM, no voice.
- Per-user vendor cost: ~$0.50/mo
- Team of 5 users: vendor subtotal $2.50
- Shared tenancy: $2.50 + $0 + $100 = $102.50 cost; × 1.45 margin = $148.63
- **Rounded tier (shared): $149/mo**
- Dedicated: $102.50 + $50 + (margin) = $221.13 → **$299/mo**

### Example B — Mid-weight LLM product (CQR-shape: classify + draft)

- Vendor mix: Anthropic Haiku (classify) + Sonnet (draft), OpenAI embeddings, Resend, ElevenLabs (one-shot voice setup), Supabase.
- Per-user vendor cost: ~$8/mo (mid-band — 50 drafts/mo)
- Team of 5: vendor subtotal $40
- Shared: $40 + $0 + $100 = $140; × 1.45 = $203
- **Rounded tier (shared): $299/mo**
- Dedicated: $140 + $50 + (margin) = $275.50 → **$299/mo**
- Caps at $299/mo: ~600k LLM tokens, 30 voice min, 5 team seats.

### Example C — Voice-heavy product (Connexions / Kira shape)

- Vendor mix: Anthropic Sonnet (long-form), OpenAI embeddings, ElevenLabs voice (heavy — interview sessions), Resend, Supabase.
- Per-user vendor cost: ~$25/mo (mid-band — 30 voice min × $0.30 + LLM heavy)
- Team of 5: vendor subtotal $125
- Shared: $125 + $0 + $100 = $225; × 1.45 = $326
- **Rounded tier (shared): custom-quote** (above $299 breakpoint — bespoke conversation)
- Or: lower the per-user expected usage assumption (smaller team, lower frequency) and re-run.

### Example D — REGULATED-tier product (e.g. r-and-d-tax)

- Tenancy: dedicated only (no shared option).
- Vendor mix: moderate LLM, light other.
- Per-user vendor cost: ~$5/mo
- Team of 5: vendor subtotal $25
- Dedicated: $25 + $50 + $100 + (regulated tier higher support ~$200) = $375; × 1.45 = $544
- **Rounded tier (dedicated): custom-quote** (REGULATED + dedicated typically lands above $299 — expected and intentional)

---

## When this formula needs to change

Append-only with dated change notes:

- Vendor unit costs drift (Anthropic / OpenAI rate changes). Re-validate the table above quarterly.
- A new vendor enters the stack — add a row to the unit-cost table.
- `infra_fixed` for dedicated needs re-validation (Supabase Pro / Vercel Pro pricing changes).
- `support_amortisation` revises based on observed support intensity (after the first 6 months of any hosted product).
- `margin` revises based on observed cap-lag dollars (after the first 3 months of cap enforcement on any hosted product).
- New tenancy modes (e.g. on-prem deploy) introduce new `infra_fixed` rows.
- Tier breakpoint policy revises if observed median product price clusters in a gap (e.g. too many products want $130 — add a $129 tier).

Revisions are append-only with dated change notes. Removing a tier or relaxing the round-UP policy requires explicit written reasoning, same as the auth-pattern rule.
