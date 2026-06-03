# BUILD BRIEF — Front-of-House Layout & IA (scaffolding pass)

**For:** opencode (autonomous build).
**Repo:** `dennissolver/corporate-ai-solutions` — **the LIVE cockpit.** Do NOT touch `cais-shared-services/product-factory/pipeline-cockpit` (stale routes/lib).
**Canonical reference:** `product-factory/PRODUCT_FACTORY_METHODOLOGY.md` §0 (Front-of-house) — this brief implements §0; if anything here conflicts with §0, §0 wins.
**Type:** scaffolding only. Lay down the navigation shell and page stubs. Do **not** build the per-product card workflow (§6) or the onboarding question logic — those are separate, later briefs.

---

## Goal

Establish the operator path into the factory:

```
Dashboard (/admin)
  → Pipeline (/admin/pipeline)            portfolio: every product by state
       → [+ New Product] → /admin/pipeline/new-ideas    onboarding intake (shell)
       → click a product → /admin/pipeline/[productId]  page titled "Processing"
```

Plus: fold `factory` into `pipeline`, and make `methodology` render the canonical doc instead of the stub.

---

## Non-goals (do NOT build in this pass)

- The office-hours **question set** / interrogation logic on `/new-ideas` — ship an empty intake shell with a clearly-marked TODO; the questions and the answer→field mapping are still being specced.
- The per-product **Processing card** redesign (the §6 stage/gate/loop UI) — only the page *title* changes in this pass; `ProductDetailView` internals are otherwise untouched.
- Any change to the 14-field schema, the survey/certify/score routes, or the scorer.

---

## Hard constraints (read before editing)

1. **Do not rename live routes.** `/admin/pipeline/[productId]` stays exactly as the slug path. Bookmarks, the InvestorPilot login link, and recorded gate refs key off it. Change the **page title/heading** to "Processing", never the URL. (Stable external IDs — same lesson as the webhook-UUID bug.)
2. **Reserved static segments.** `/admin/pipeline/new-ideas` and `/admin/pipeline/factory` are static folders that sit beside the `[productId]` dynamic segment. Next gives static segments precedence, so this is safe — but ensure the `[productId]` page/API never receives `new-ideas` or `factory` as a product slug (guard or rely on precedence; do not introduce a route that would shadow them).
3. **Live-state pages must be dynamic.** Any page/route that reads live DB state and must reflect changes immediately needs, after imports:
   `export const dynamic = 'force-dynamic'; export const revalidate = 0; export const fetchCache = 'force-no-store';`
   (Next caches server-side fetches by default; `Cache-Control: no-store` does NOT opt out. This was the root cause of "card never updates." Applies to the new Dashboard and Pipeline/new-ideas views.)
4. **One table, two states — no new store.** A "new idea" is an existing `product_validation_status` row at **INCOMPLETE-SPEC** (fewer than 14 spec fields populated). Onboarding writing the 14 fields flips the same row to "in pipeline." `/new-ideas` is a **filtered view**, not a separate table.
5. Build passes the existing gate: `npx tsc --noEmit` clean; commit with `--no-verify` (known broken typecheck hook).

---

## State derivation (used by Dashboard + Pipeline + New Ideas)

Derive product state from the spec + gates already in the DB — do not add a status column:

| State | Rule | Surfaces in |
|---|---|---|
| **Idea / not-started** | < 14 of the 14 spec fields populated (INCOMPLETE-SPEC) | `/new-ideas`, Dashboard "ideas" count |
| **In-progress** | 14 fields populated; no GO `pipeline_gates` PASS yet | `/pipeline`, Dashboard "in-progress" count |
| **Completed** | a `pipeline_gates` PASS (GO) exists | `/pipeline` (done), Dashboard "completed" count |

(The 14 fields and the INCOMPLETE-SPEC/survey logic already exist; reuse the same field list `ProductDetailView` / the survey use. Do not redefine the 14.)

---

## Work items

### W1 — CREATE `src/app/admin/page.tsx` (Dashboard)
- `/admin` is currently 404. Create a card-grid dashboard, one card per control surface, matching the existing `AdminNav` entries: **Pipeline, Methodology, Ops, Reviews, Settings** (drop a separate "Product Factory" card — folded into Pipeline, see W4).
- The **Pipeline** card is primary: show live counts by state (ideas / in-progress / completed) using the derivation above, and a prominent **[+ New Product]** action linking to `/admin/pipeline/new-ideas`.
- Apply constraint #3 (dynamic) since it reads live counts.
- Acceptance: visiting `/admin` renders the dashboard (no 404); Pipeline card shows non-zero counts for existing products and links work.

### W2 — CREATE `src/app/admin/pipeline/new-ideas/page.tsx` (Onboarding shell)
- Static route beside `[productId]` (constraint #2).
- Ship a **shell only**: page titled "New Idea — Onboarding", a placeholder intake form area with a visible `{/* TODO: office-hours question set + answer→field mapping — pending spec */}`, and a disabled/stub "Submit idea" action.
- It should also **list existing ideas** (rows in INCOMPLETE-SPEC) so the page doubles as the idea repository (the filtered view from constraint #4). Clicking an existing idea opens its `/[productId]` page.
- Do NOT wire idea creation logic yet beyond a stub (creating the row + seeding fields is the next brief).
- Acceptance: `/admin/pipeline/new-ideas` renders, lists INCOMPLETE-SPEC products, has the clearly-marked intake TODO, and does not 500.

### W3 — EDIT `src/app/admin/pipeline/page.tsx` + `src/components/admin/PipelineTable.tsx` (Portfolio)
- Make this the single portfolio view: every product grouped/filterable by state (not-started / in-progress / completed) per the derivation.
- Add a **[+ New Product]** button → `/admin/pipeline/new-ideas`.
- Absorb the "where is every product in the process" content from `factory` (W4).
- Acceptance: one page shows all products with their state; New Product button present; nothing from the old factory overview is lost.

### W4 — EDIT `src/app/admin/pipeline/factory/page.tsx` (Fold into Pipeline)
- Replace its body with a permanent redirect to `/admin/pipeline` (`redirect('/admin/pipeline')`), preserving any existing bookmarks. Migrate any unique-and-useful content into W3 first; discard the mishmash.
- Acceptance: visiting `/admin/pipeline/factory` lands on `/admin/pipeline`.

### W5 — EDIT `src/app/admin/methodology/page.tsx` (Render the canonical doc)
- Replace the "Phase 3+ not implemented" stub with a page that renders `product-factory/PRODUCT_FACTORY_METHODOLOGY.md` (read + render as Markdown). Read-only is fine for this pass.
- Acceptance: `/admin/methodology` shows the methodology document, not the stub.

### W6 — EDIT the Processing page title (heading only)
- In `src/app/admin/pipeline/[productId]/page.tsx` (and/or `ProductDetailView` header), set the page title/heading to **"Processing"** (optionally "Processing — {product name}"). **URL unchanged.** No other `ProductDetailView` changes.
- Acceptance: the per-product page reads "Processing" in its title/heading; the route is still `/admin/pipeline/[productId]`.

### W7 — EDIT `src/components/admin/AdminNav.tsx` (Nav consistency)
- Ensure a **Dashboard** (`/admin`) entry exists; ensure **Methodology / Pipeline / Ops / Reviews / Settings** are present; remove any standalone "Product Factory"/`factory` nav link (folded into Pipeline).
- Acceptance: nav matches the §0 route map; no link points at the retired factory page.

---

## Definition of done

- `/admin` renders a Dashboard (no 404) with live state counts and a New Product action.
- `/admin/pipeline` is the single portfolio (factory folded in + redirected); `/admin/pipeline/new-ideas` renders the onboarding shell + idea list; `/admin/pipeline/[productId]` is unchanged in URL and titled "Processing".
- `/admin/methodology` renders the canonical doc.
- No new status column; state derived from spec completeness + `pipeline_gates`.
- `npx tsc --noEmit` clean; deployed to Vercel; routes verified live.

## Out of scope (explicitly, so it isn't built)
Onboarding question set + answer→field mapping + idea-creation write path; the §6 Processing-card stage/gate/loop redesign; Certificate of Occupancy; scorer reconciliation; handover package; ops/sensors.
